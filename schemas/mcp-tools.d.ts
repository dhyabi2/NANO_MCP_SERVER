/**
 * TypeScript Type Definitions for NANO MCP Server
 * Auto-generated from JSON Schema for AI agents and TypeScript clients
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export type NanoAddress = string; // Pattern: ^(nano|xrb)_[13]{1}[13456789abcdefghijkmnopqrstuwxyz]{59}$
export type PrivateKey = string;   // Pattern: ^[0-9A-Fa-f]{64}$
export type PublicKey = string;    // Pattern: ^[0-9A-Fa-f]{64}$
export type Seed = string;         // Pattern: ^[0-9A-Fa-f]{64}$
export type BlockHash = string;    // Pattern: ^[0-9A-F]{64}$
export type RawAmount = string;    // Pattern: ^[0-9]+$
export type NanoAmount = string;   // Pattern: ^[0-9]+\.[0-9]{6}$

// ============================================================================
// JSON-RPC 2.0 BASE TYPES
// ============================================================================

export interface JsonRpcRequest<T = any> {
  jsonrpc: "2.0";
  method: string;
  params: T;
  id: number | string;
}

export interface JsonRpcSuccessResponse<T = any> {
  jsonrpc: "2.0";
  result: T;
  id: number | string;
}

export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  error: ErrorResponse;
  id: number | string;
}

export type JsonRpcResponse<T = any> = JsonRpcSuccessResponse<T> | JsonRpcErrorResponse;

// ============================================================================
// ERROR TYPES
// ============================================================================

export type ErrorCode =
  | "INVALID_ADDRESS_FORMAT"
  | "INVALID_ADDRESS_PREFIX"
  | "INVALID_ADDRESS_CHECKSUM"
  | "INVALID_PRIVATE_KEY_FORMAT"
  | "INVALID_PRIVATE_KEY_LENGTH"
  | "INVALID_PRIVATE_KEY_CHARACTERS"
  | "INVALID_AMOUNT_FORMAT"
  | "AMOUNT_WRONG_UNIT"
  | "INVALID_AMOUNT_NEGATIVE"
  | "INVALID_AMOUNT_ZERO"
  | "INVALID_AMOUNT_OVERFLOW"
  | "INSUFFICIENT_BALANCE"
  | "INSUFFICIENT_WORK"
  | "ACCOUNT_NOT_INITIALIZED"
  | "ACCOUNT_NOT_INITIALIZED_NO_PENDING"
  | "PENDING_BLOCKS_NOT_RECEIVED"
  | "BLOCKCHAIN_INVALID_BLOCK"
  | "BLOCKCHAIN_INSUFFICIENT_BALANCE"
  | "BLOCKCHAIN_ERROR"
  | "MISSING_PARAMETER"
  | "METHOD_NOT_FOUND"
  | "INVALID_CONVERSION_UNITS"
  | "SAME_CONVERSION_UNITS"
  | "CONVERSION_ERROR"
  | "INVALID_QR_AMOUNT_FORMAT"
  | "QR_GENERATION_ERROR"
  | "TEST_WALLETS_NOT_FOUND"
  | "INVALID_WALLET_IDENTIFIER"
  | "RPC_ERROR";

export interface ErrorResponse {
  success: false;
  error: string;
  errorCode: ErrorCode;
  details?: Record<string, any>;
  nextSteps?: string[];
  relatedFunctions?: string[];
  exampleRequest?: JsonRpcRequest;
}

// ============================================================================
// INITIALIZE
// ============================================================================

export interface InitializeParams {}

export interface InitializeResult {
  capabilities: string[];
  version: string;
  availableMethods: string[];
  rpcNode?: string;
  defaultRepresentative?: string;
}

// ============================================================================
// GENERATE WALLET
// ============================================================================

export interface GenerateWalletParams {}

export interface GenerateWalletResult {
  address: NanoAddress;
  privateKey: PrivateKey;
  publicKey: PublicKey;
  seed: Seed;
}

// ============================================================================
// GET BALANCE
// ============================================================================

export interface GetBalanceParams {
  address: NanoAddress;
}

export interface GetBalanceResult {
  balance: RawAmount;
  balanceNano: NanoAmount;
  pending: RawAmount;
  pendingNano: NanoAmount;
}

// ============================================================================
// GET ACCOUNT INFO
// ============================================================================

export interface GetAccountInfoParams {
  address: NanoAddress;
}

export interface GetAccountInfoResult {
  frontier: BlockHash;
  open_block: BlockHash;
  representative_block: BlockHash;
  balance: RawAmount;
  modified_timestamp: string;
  block_count: string;
  representative: NanoAddress;
}

// ============================================================================
// GET PENDING BLOCKS
// ============================================================================

export interface GetPendingBlocksParams {
  address: NanoAddress;
}

export interface PendingBlock {
  amount: RawAmount;
  source: NanoAddress;
}

export interface GetPendingBlocksResult {
  blocks: Record<BlockHash, PendingBlock>;
}

// ============================================================================
// INITIALIZE ACCOUNT
// ============================================================================

export interface InitializeAccountParams {
  address: NanoAddress;
  privateKey: PrivateKey;
}

export interface InitializeAccountResult {
  initialized: boolean;
  hash: BlockHash;
  balance?: RawAmount;
  representative?: NanoAddress;
}

// ============================================================================
// SEND TRANSACTION
// ============================================================================

export interface SendTransactionParams {
  fromAddress: NanoAddress;
  toAddress: NanoAddress;
  amountRaw: RawAmount;
  privateKey: PrivateKey;
}

export interface SendTransactionResult {
  success: boolean;
  hash: BlockHash;
}

// ============================================================================
// RECEIVE ALL PENDING
// ============================================================================

export interface ReceiveAllPendingParams {
  address: NanoAddress;
  privateKey: PrivateKey;
}

export interface ReceiveBlockResult {
  hash: BlockHash;
}

export type ReceiveAllPendingResult = ReceiveBlockResult[];

// ============================================================================
// GENERATE QR CODE
// ============================================================================

export interface GenerateQrCodeParams {
  address: NanoAddress;
  amount?: string;
}

export interface GenerateQrCodeResult {
  qrCode: string; // Base64-encoded PNG
  nanoUri: string;
}

// ============================================================================
// CONVERT BALANCE
// ============================================================================

export interface ConvertBalanceParams {
  amount: string;
  from: "nano" | "raw";
  to: "nano" | "raw";
}

export interface ConvertBalanceResult {
  original: string;
  converted: string;
  from: "nano" | "raw";
  to: "nano" | "raw";
}

// ============================================================================
// GET ACCOUNT STATUS
// ============================================================================

export interface GetAccountStatusParams {
  address: NanoAddress;
}

export interface GetAccountStatusResult {
  address: NanoAddress;
  initialized: boolean;
  balance: RawAmount;
  balanceNano: NanoAmount;
  pendingCount: number;
  totalPending: RawAmount;
  totalPendingNano: NanoAmount;
  canSend: boolean;
  needsAction: string[];
  representative?: NanoAddress;
}

// ============================================================================
// TEST WALLET MANAGEMENT
// ============================================================================

export interface SetupTestWalletsParams {}

export interface TestWalletInfo {
  address: NanoAddress;
  funded: boolean;
}

export interface SetupTestWalletsResult {
  wallet1: TestWalletInfo;
  wallet2: TestWalletInfo;
  created: string; // ISO 8601 date-time
  status: "awaiting_funding";
  message: string;
  fundingInstructions: string[];
}

export interface GetTestWalletsParams {
  includePrivateKeys?: boolean;
}

export interface TestWalletFull {
  address: NanoAddress;
  privateKey?: PrivateKey;
  balance: RawAmount;
  funded: boolean;
}

export interface GetTestWalletsResult {
  wallet1: TestWalletFull;
  wallet2: TestWalletFull;
}

export interface CheckTestWalletsFundingParams {}

export interface CheckTestWalletsFundingResult {
  allFunded: boolean;
  wallet1Funded: boolean;
  wallet2Funded: boolean;
  message: string;
}

export interface ResetTestWalletsParams {}

export interface ResetTestWalletsResult {
  success: boolean;
  message: string;
}

// ============================================================================
// MCP CLIENT INTERFACE
// ============================================================================

/**
 * Type-safe MCP Client Interface
 * AI agents can use this for auto-completion and type checking
 */
export interface NanoMcpClient {
  initialize(params: InitializeParams): Promise<InitializeResult>;
  generateWallet(params: GenerateWalletParams): Promise<GenerateWalletResult>;
  getBalance(params: GetBalanceParams): Promise<GetBalanceResult>;
  getAccountInfo(params: GetAccountInfoParams): Promise<GetAccountInfoResult>;
  getPendingBlocks(params: GetPendingBlocksParams): Promise<GetPendingBlocksResult>;
  initializeAccount(params: InitializeAccountParams): Promise<InitializeAccountResult>;
  sendTransaction(params: SendTransactionParams): Promise<SendTransactionResult>;
  receiveAllPending(params: ReceiveAllPendingParams): Promise<ReceiveAllPendingResult>;
  generateQrCode(params: GenerateQrCodeParams): Promise<GenerateQrCodeResult>;
  convertBalance(params: ConvertBalanceParams): Promise<ConvertBalanceResult>;
  getAccountStatus(params: GetAccountStatusParams): Promise<GetAccountStatusResult>;
  setupTestWallets(params: SetupTestWalletsParams): Promise<SetupTestWalletsResult>;
  getTestWallets(params: GetTestWalletsParams): Promise<GetTestWalletsResult>;
  checkTestWalletsFunding(params: CheckTestWalletsFundingParams): Promise<CheckTestWalletsFundingResult>;
  resetTestWallets(params: ResetTestWalletsParams): Promise<ResetTestWalletsResult>;
}

// ============================================================================
// METHOD NAMES (for type-safe method dispatch)
// ============================================================================

export type MethodName =
  | "initialize"
  | "generateWallet"
  | "getBalance"
  | "getAccountInfo"
  | "getPendingBlocks"
  | "initializeAccount"
  | "sendTransaction"
  | "receiveAllPending"
  | "generateQrCode"
  | "convertBalance"
  | "getAccountStatus"
  | "setupTestWallets"
  | "getTestWallets"
  | "checkTestWalletsFunding"
  | "resetTestWallets";

// ============================================================================
// METHOD PARAMETER MAP (for type-safe dispatch)
// ============================================================================

export interface MethodParamsMap {
  initialize: InitializeParams;
  generateWallet: GenerateWalletParams;
  getBalance: GetBalanceParams;
  getAccountInfo: GetAccountInfoParams;
  getPendingBlocks: GetPendingBlocksParams;
  initializeAccount: InitializeAccountParams;
  sendTransaction: SendTransactionParams;
  receiveAllPending: ReceiveAllPendingParams;
  generateQrCode: GenerateQrCodeParams;
  convertBalance: ConvertBalanceParams;
  getAccountStatus: GetAccountStatusParams;
  setupTestWallets: SetupTestWalletsParams;
  getTestWallets: GetTestWalletsParams;
  checkTestWalletsFunding: CheckTestWalletsFundingParams;
  resetTestWallets: ResetTestWalletsParams;
}

// ============================================================================
// METHOD RESULT MAP (for type-safe dispatch)
// ============================================================================

export interface MethodResultMap {
  initialize: InitializeResult;
  generateWallet: GenerateWalletResult;
  getBalance: GetBalanceResult;
  getAccountInfo: GetAccountInfoResult;
  getPendingBlocks: GetPendingBlocksResult;
  initializeAccount: InitializeAccountResult;
  sendTransaction: SendTransactionResult;
  receiveAllPending: ReceiveAllPendingResult;
  generateQrCode: GenerateQrCodeResult;
  convertBalance: ConvertBalanceResult;
  getAccountStatus: GetAccountStatusResult;
  setupTestWallets: SetupTestWalletsResult;
  getTestWallets: GetTestWalletsResult;
  checkTestWalletsFunding: CheckTestWalletsFundingResult;
  resetTestWallets: ResetTestWalletsResult;
}

// ============================================================================
// TYPED REQUEST/RESPONSE (for generic functions)
// ============================================================================

export type TypedRequest<M extends MethodName> = JsonRpcRequest<MethodParamsMap[M]>;
export type TypedResponse<M extends MethodName> = JsonRpcResponse<MethodResultMap[M]>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract parameters for a given method
 */
export type ParamsFor<M extends MethodName> = MethodParamsMap[M];

/**
 * Extract result type for a given method
 */
export type ResultFor<M extends MethodName> = MethodResultMap[M];

/**
 * Type guard for error responses
 */
export function isErrorResponse(response: JsonRpcResponse): response is JsonRpcErrorResponse {
  return 'error' in response;
}

/**
 * Type guard for success responses
 */
export function isSuccessResponse<T>(response: JsonRpcResponse<T>): response is JsonRpcSuccessResponse<T> {
  return 'result' in response;
}

