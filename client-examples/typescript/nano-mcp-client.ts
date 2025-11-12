/**
 * Production-Level NANO MCP Client (TypeScript)
 * 
 * Features:
 * - Full TypeScript type safety
 * - JSON Schema validation
 * - Auto-retry with exponential backoff
 * - Comprehensive error handling
 * - Production-ready timeouts
 * 
 * Usage:
 * ```typescript
 * import { NanoMcpClient } from './nano-mcp-client';
 * 
 * const client = new NanoMcpClient('https://nano-mcp.replit.app');
 * const wallet = await client.generateWallet();
 * ```
 */

// ============================================================================
// TYPE DEFINITIONS (from JSON Schema)
// ============================================================================

export type NanoAddress = string; // Pattern: ^(nano|xrb)_[13]{1}[13456789abcdefghijkmnopqrstuwxyz]{59}$
export type PrivateKey = string;   // Pattern: ^[0-9A-Fa-f]{64}$
export type BlockHash = string;    // Pattern: ^[0-9A-F]{64}$
export type RawAmount = string;    // Pattern: ^[0-9]+$

export interface JsonRpcRequest<T = any> {
  jsonrpc: "2.0";
  method: string;
  params: T;
  id: number | string;
}

export interface JsonRpcResponse<T = any> {
  jsonrpc: "2.0";
  result?: T;
  error?: ErrorResponse;
  id: number | string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  errorCode: string;
  details?: Record<string, any>;
  nextSteps?: string[];
  relatedFunctions?: string[];
  exampleRequest?: any;
}

// Response types
export interface GenerateWalletResult {
  address: NanoAddress;
  privateKey: PrivateKey;
  publicKey: string;
  seed: string;
}

export interface GetBalanceResult {
  balance: RawAmount;
  balanceNano: string;
  pending: RawAmount;
  pendingNano: string;
}

export interface AccountStatusResult {
  address: NanoAddress;
  initialized: boolean;
  balance: RawAmount;
  balanceNano: string;
  pendingCount: number;
  totalPending: RawAmount;
  totalPendingNano: string;
  canSend: boolean;
  needsAction: string[];
  representative?: NanoAddress;
}

export interface InitializeAccountResult {
  initialized: boolean;
  hash?: BlockHash;
  balance?: RawAmount;
  representative?: NanoAddress;
  message?: string;
}

export interface SendTransactionResult {
  success: boolean;
  hash: BlockHash;
}

export interface ReceiveAllPendingResult {
  hash: BlockHash;
}

export interface ConvertBalanceResult {
  original: string;
  converted: string;
  from: "nano" | "raw";
  to: "nano" | "raw";
}

export interface QrCodeResult {
  qrCode: string; // Base64-encoded PNG
  nanoUri: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const TRANSACTION_TIMEOUT = 60000; // 60 seconds (for PoW generation)
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

// NANO address regex for validation
const NANO_ADDRESS_REGEX = /^(nano|xrb)_[13]{1}[13456789abcdefghijkmnopqrstuwxyz]{59}$/;
const PRIVATE_KEY_REGEX = /^[0-9A-Fa-f]{64}$/;

// ============================================================================
// NANO MCP CLIENT CLASS
// ============================================================================

export class NanoMcpClient {
  private baseUrl: string;
  private requestId: number = 1;

  constructor(baseUrl: string = 'https://nano-mcp.replit.app') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // ==========================================================================
  // CORE MCP CALL METHOD
  // ==========================================================================

  private async callMCP<T>(
    method: string,
    params: any = {},
    timeout: number = DEFAULT_TIMEOUT,
    retries: number = 1
  ): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
      id: this.requestId++
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[MCP] ${method} - attempt ${attempt}/${retries}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const jsonResponse: JsonRpcResponse<T> = await response.json();

        // Handle JSON-RPC error
        if (jsonResponse.error) {
          const error = jsonResponse.error as ErrorResponse;
          const errorMessage = this.formatError(error);
          throw new Error(errorMessage);
        }

        // Success
        if (jsonResponse.result !== undefined) {
          console.log(`[MCP] ${method} - success on attempt ${attempt}`);
          return jsonResponse.result;
        }

        throw new Error('Invalid JSON-RPC response: no result or error');

      } catch (error: any) {
        lastError = error;
        console.error(`[MCP] ${method} attempt ${attempt} failed:`, error.message);

        // Don't retry on validation errors or client errors
        if (
          error.message.includes('INVALID_') ||
          error.message.includes('MISSING_PARAMETER') ||
          error.message.includes('METHOD_NOT_FOUND') ||
          error.name === 'AbortError'
        ) {
          throw error;
        }

        // Retry with exponential backoff
        if (attempt < retries) {
          const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(`[MCP] Retrying ${method} in ${delayMs}ms...`);
          await this.sleep(delayMs);
        }
      }
    }

    throw lastError || new Error(`${method} failed after ${retries} attempts`);
  }

  private formatError(error: ErrorResponse): string {
    let message = `[${error.errorCode}] ${error.error}`;
    
    if (error.details) {
      message += `\nDetails: ${JSON.stringify(error.details, null, 2)}`;
    }
    
    if (error.nextSteps && error.nextSteps.length > 0) {
      message += `\n\nNext Steps:\n${error.nextSteps.map(s => `  - ${s}`).join('\n')}`;
    }
    
    if (error.relatedFunctions && error.relatedFunctions.length > 0) {
      message += `\n\nRelated Functions: ${error.relatedFunctions.join(', ')}`;
    }
    
    return message;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // CLIENT-SIDE VALIDATION
  // ==========================================================================

  private validateAddress(address: string, paramName: string = 'address'): void {
    if (!address || typeof address !== 'string') {
      throw new Error(`${paramName} is required and must be a string`);
    }
    if (!NANO_ADDRESS_REGEX.test(address)) {
      throw new Error(
        `${paramName} must be a valid NANO address (starts with 'nano_' or 'xrb_', 60-65 chars)`
      );
    }
  }

  private validatePrivateKey(privateKey: string): void {
    if (!privateKey || typeof privateKey !== 'string') {
      throw new Error('privateKey is required and must be a string');
    }
    if (!PRIVATE_KEY_REGEX.test(privateKey)) {
      throw new Error('privateKey must be a 64-character hexadecimal string');
    }
  }

  private validateAmountRaw(amountRaw: string): void {
    if (!amountRaw || typeof amountRaw !== 'string') {
      throw new Error('amountRaw is required and must be a string');
    }
    if (!/^[0-9]+$/.test(amountRaw)) {
      throw new Error('amountRaw must contain only digits');
    }
    if (BigInt(amountRaw) <= 0) {
      throw new Error('amountRaw must be greater than 0');
    }
  }

  // ==========================================================================
  // SERVER-SIDE VALIDATION (using schema endpoint)
  // ==========================================================================

  async validateParams(method: string, params: any): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/schema/validate/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        return { valid: false, errors: [`HTTP ${response.status}: ${response.statusText}`] };
      }

      const result = await response.json();
      return result.validation;
    } catch (error: any) {
      return { valid: false, errors: [error.message] };
    }
  }

  // ==========================================================================
  // PUBLIC API METHODS
  // ==========================================================================

  /**
   * Generate a new NANO wallet
   */
  async generateWallet(): Promise<GenerateWalletResult> {
    return this.callMCP<GenerateWalletResult>("generateWallet", {});
  }

  /**
   * Get balance for an address (includes pending)
   */
  async getBalance(address: string): Promise<GetBalanceResult> {
    this.validateAddress(address);
    return this.callMCP<GetBalanceResult>("getBalance", { address });
  }

  /**
   * Get comprehensive account status (RECOMMENDED)
   * Returns balance, pending blocks, initialization status, and actionable recommendations
   */
  async getAccountStatus(address: string): Promise<AccountStatusResult> {
    this.validateAddress(address);
    return this.callMCP<AccountStatusResult>("getAccountStatus", { address });
  }

  /**
   * Initialize account (opens account by receiving first pending block)
   * IMPORTANT: Account must have pending blocks before calling this
   */
  async initializeAccount(
    address: string,
    privateKey: string
  ): Promise<InitializeAccountResult> {
    this.validateAddress(address);
    this.validatePrivateKey(privateKey);
    
    return this.callMCP<InitializeAccountResult>(
      "initializeAccount",
      { address, privateKey },
      TRANSACTION_TIMEOUT,
      1 // No retries for initialization (deterministic operation)
    );
  }

  /**
   * Receive all pending blocks for an address
   */
  async receiveAllPending(
    address: string,
    privateKey: string
  ): Promise<ReceiveAllPendingResult[]> {
    this.validateAddress(address);
    this.validatePrivateKey(privateKey);
    
    return this.callMCP<ReceiveAllPendingResult[]>(
      "receiveAllPending",
      { address, privateKey },
      TRANSACTION_TIMEOUT,
      1 // No retries (each block is independent)
    );
  }

  /**
   * Send NANO transaction with automatic retries on transient errors
   * Validates all parameters before sending
   */
  async sendTransaction(
    fromAddress: string,
    toAddress: string,
    amountRaw: string,
    privateKey: string
  ): Promise<SendTransactionResult> {
    // Client-side validation
    this.validateAddress(fromAddress, 'fromAddress');
    this.validateAddress(toAddress, 'toAddress');
    this.validateAmountRaw(amountRaw);
    this.validatePrivateKey(privateKey);

    // Send with retries (for INSUFFICIENT_WORK and transient errors)
    return this.callMCP<SendTransactionResult>(
      "sendTransaction",
      { fromAddress, toAddress, amountRaw, privateKey },
      TRANSACTION_TIMEOUT,
      MAX_RETRIES
    );
  }

  /**
   * Convert between NANO and raw units
   */
  async convertBalance(
    amount: string,
    from: "nano" | "raw",
    to: "nano" | "raw"
  ): Promise<ConvertBalanceResult> {
    if (!amount || typeof amount !== 'string') {
      throw new Error('amount is required and must be a string');
    }
    if (!['nano', 'raw'].includes(from)) {
      throw new Error('from must be "nano" or "raw"');
    }
    if (!['nano', 'raw'].includes(to)) {
      throw new Error('to must be "nano" or "raw"');
    }
    if (from === to) {
      throw new Error('from and to must be different units');
    }

    return this.callMCP<ConvertBalanceResult>("convertBalance", { amount, from, to });
  }

  /**
   * Generate QR code for payment request
   */
  async generateQrCode(address: string, amount?: string): Promise<QrCodeResult> {
    this.validateAddress(address);
    const params: any = { address };
    if (amount) {
      params.amount = amount;
    }
    return this.callMCP<QrCodeResult>("generateQrCode", params);
  }

  // ==========================================================================
  // SCHEMA DISCOVERY METHODS
  // ==========================================================================

  /**
   * Get complete JSON Schema for all tools
   */
  async getSchema(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/schema`);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get schema for a specific tool
   */
  async getToolSchema(toolName: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/schema/tools/${toolName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tool schema: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get examples for a tool
   */
  async getExamples(toolName: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/schema/examples/${toolName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch examples: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get TypeScript definitions
   */
  async getTypeScriptDefinitions(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/schema/typescript`);
    if (!response.ok) {
      throw new Error(`Failed to fetch TypeScript definitions: ${response.status}`);
    }
    return response.text();
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert NANO to raw (for use in sendTransaction)
 */
export function nanoToRaw(nanoAmount: string | number): string {
  const nano = typeof nanoAmount === 'string' ? parseFloat(nanoAmount) : nanoAmount;
  if (isNaN(nano) || nano < 0) {
    throw new Error('Invalid NANO amount');
  }
  
  // 1 NANO = 10^30 raw
  const rawBigInt = BigInt(Math.floor(nano * 1e6)) * BigInt('1000000000000000000000000');
  return rawBigInt.toString();
}

/**
 * Convert raw to NANO (for display)
 */
export function rawToNano(rawAmount: string): string {
  try {
    const raw = BigInt(rawAmount);
    const nano = Number(raw) / 1e30;
    return nano.toFixed(6);
  } catch (error) {
    throw new Error('Invalid raw amount');
  }
}

/**
 * Constants for common XNO amounts
 */
export const XNO = {
  ONE_RAW: '1',
  ONE_NANO: '1000000000000000000000000000000',
  POINT_ONE_NANO: '100000000000000000000000000000',
  POINT_ZERO_ONE_NANO: '10000000000000000000000000000',
  POINT_ZERO_ZERO_ONE_NANO: '1000000000000000000000000000'
};

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Complete workflow with error handling
 * 
 * ```typescript
 * async function example() {
 *   const client = new NanoMcpClient('https://nano-mcp.replit.app');
 *   
 *   try {
 *     // 1. Generate wallet
 *     const wallet = await client.generateWallet();
 *     console.log('Wallet:', wallet.address);
 *     
 *     // 2. Check account status
 *     const status = await client.getAccountStatus(wallet.address);
 *     console.log('Status:', status);
 *     
 *     if (status.needsAction.length > 0) {
 *       console.log('Actions needed:', status.needsAction);
 *     }
 *     
 *     // 3. Initialize if needed
 *     if (!status.initialized && status.pendingCount > 0) {
 *       const init = await client.initializeAccount(wallet.address, wallet.privateKey);
 *       console.log('Initialized:', init.hash);
 *     }
 *     
 *     // 4. Send transaction (with auto-retry)
 *     if (status.canSend) {
 *       const tx = await client.sendTransaction(
 *         wallet.address,
 *         'nano_1x7biz69cem95oo7gxkdkdbxsfs6ixkxx833fz3ps9qxh3uofa1hr8ejkizd',
 *         nanoToRaw('0.001'),
 *         wallet.privateKey
 *       );
 *       console.log('Transaction hash:', tx.hash);
 *     }
 *     
 *   } catch (error: any) {
 *     console.error('Error:', error.message);
 *     // Error includes nextSteps and relatedFunctions for guidance
 *   }
 * }
 * ```
 */

export default NanoMcpClient;

