import { MCPServer, MCPMethod, MCPServerConfig, RPCConfig } from './mcp-types.js';
import { rpcCall } from './rpc.js';
import { convert, Unit } from 'nanocurrency';
import * as nanocurrency from 'nanocurrency';
import * as nanoWeb from 'nanocurrency-web';
import { block } from 'nanocurrency-web';
import { Logger } from './utils/logger.js';
import { KeyManager } from './utils/key-manager.js';
import path from 'path';

// Use a relative path for logs
const LOG_DIR = path.join(process.cwd(), 'logs');

interface NanoBalance {
  balance: string;
  pending: string;
  receivable: string;
}

interface NanoAccountInfo {
  frontier: string;
  open_block: string;
  representative_block: string;
  balance: string;
  modified_timestamp: string;
  block_count: string;
  representative: string;
}

interface WalletInfo {
  address: string;
  privateKey: string;
  publicKey: string;
}

interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export class NanoMCP extends MCPServer {
  private methods: Map<string, MCPMethod>;
  private logger: Logger;
  private keyManager: KeyManager;

  constructor(rpcConfig?: RPCConfig) {
    const serverConfig: MCPServerConfig = {
      name: 'nano',
      description: 'MCP server for NANO (XNO) cryptocurrency',
      version: '1.0.0',
      author: 'Your Name',
    };

    super(serverConfig, rpcConfig);

    // Initialize logger and key manager
    this.logger = new Logger(LOG_DIR);
    this.keyManager = new KeyManager(this.logger);
    this.methods = new Map();

    // Register MCP methods
    this.methods.set('getBalance', this.getBalance.bind(this));
    this.methods.set('getAccountInfo', this.getAccountInfo.bind(this));
    this.methods.set('getBlockCount', this.getBlockCount.bind(this));
    this.methods.set('getVersion', this.getVersion.bind(this));
    this.methods.set('convertToNano', async (rawAmount: string) => Promise.resolve(this.convertToNano(rawAmount)));
    this.methods.set('convertFromNano', async (nanoAmount: string) => Promise.resolve(this.convertFromNano(nanoAmount)));
    this.methods.set('generateWallet', this.generateWallet.bind(this));
    this.methods.set('sendTransaction', this.sendTransaction.bind(this));
    this.methods.set('receivePending', this.receivePending.bind(this));
    this.methods.set('initializeAccount', this.initializeAccount.bind(this));
    this.methods.set('createWallet', this.createWallet.bind(this));
    this.methods.set('createAccount', this.createAccount.bind(this));
    this.methods.set('send', this.send.bind(this));
    this.methods.set('receiveAll', this.receiveAll.bind(this));
    this.methods.set('backupWallet', this.backupWallet.bind(this));
  }

  setRPCConfig(config: RPCConfig): void {
    this.rpcConfig = { ...this.rpcConfig, ...config };
  }

  async getBalance(address: string): Promise<NanoBalance> {
    try {
      const formattedAddress = address.replace('xrb_', 'nano_');
      this.logger.log('GET_BALANCE', { address: formattedAddress });
      
      const response = await rpcCall('account_balance', { 
        account: formattedAddress,
        include_only_confirmed: true 
      }, this.rpcConfig);

      return {
        balance: response.balance || '0',
        pending: response.pending || '0',
        receivable: response.receivable || '0'
      };
    } catch (error) {
      this.logger.logError('GET_BALANCE_ERROR', error);
      throw error;
    }
  }

  async getAccountInfo(address: string): Promise<NanoAccountInfo> {
    const response = await rpcCall('account_info', { account: address }, this.rpcConfig);
    return response as NanoAccountInfo;
  }

  async getBlockCount(): Promise<{ count: string; unchecked: string; }> {
    const response = await rpcCall('block_count', {}, this.rpcConfig);
    return {
      count: response.count,
      unchecked: response.unchecked
    };
  }

  async getVersion(): Promise<{ node_vendor: string; }> {
    const response = await rpcCall('version', {}, this.rpcConfig);
    return {
      node_vendor: response.node_vendor
    };
  }

  async generateWallet(): Promise<WalletInfo> {
    try {
      return await this.keyManager.generateKeyPair();
    } catch (error) {
      this.logger.logError('GENERATE_WALLET_ERROR', error);
      throw error;
    }
  }

  async sendTransaction(fromAddress: string, privateKey: string, toAddress: string, amountRaw: string): Promise<TransactionResult> {
    try {
      const formattedFromAddress = fromAddress.replace('xrb_', 'nano_');
      const formattedToAddress = toAddress.replace('xrb_', 'nano_');

      const accountInfo = await rpcCall('account_info', {
        account: formattedFromAddress,
        representative: true,
        json_block: 'true'
      }, this.rpcConfig);

      if (accountInfo.error) {
        throw new Error(accountInfo.error);
      }

      const workData = await rpcCall('work_generate', {
        hash: accountInfo.frontier,
        difficulty: 'fffffff800000000'
      }, this.rpcConfig);

      if (!workData || !workData.work) {
        throw new Error('Failed to generate work');
      }

      const blockData = {
        walletBalanceRaw: accountInfo.balance,
        fromAddress: formattedFromAddress,
        toAddress: formattedToAddress,
        representativeAddress: accountInfo.representative,
        frontier: accountInfo.frontier,
        amountRaw: amountRaw,
        work: workData.work
      };

      const signedBlock = block.send(blockData, privateKey);

      const processData = await rpcCall('process', {
        json_block: 'true',
        subtype: 'send',
        block: signedBlock
      }, this.rpcConfig);

      return {
        success: true,
        hash: processData.hash
      };
    } catch (error) {
      this.logger.logError('SEND_TRANSACTION_ERROR', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async receivePending(address: string, privateKey: string): Promise<TransactionResult> {
    try {
      const formattedAddress = address.replace('xrb_', 'nano_');
      this.logger.log('RECEIVE_PENDING', { address: formattedAddress });

      const pendingData = await rpcCall('pending', {
        account: formattedAddress,
        threshold: '1',
        source: true,
        include_active: true,
        include_only_confirmed: true
      }, this.rpcConfig);

      if (!pendingData.blocks || Object.keys(pendingData.blocks).length === 0) {
        return { success: true };
      }

      let receivedCount = 0;
      for (const blockHash of Object.keys(pendingData.blocks)) {
        try {
          const blockInfo = await rpcCall('blocks_info', {
            hashes: [blockHash],
            json_block: 'true',
            pending: true,
            source: true
          }, this.rpcConfig);

          const accountInfo = await rpcCall('account_info', {
            account: formattedAddress,
            representative: true
          }, this.rpcConfig).catch(() => null);

          const previous = accountInfo?.frontier || '0'.repeat(64);
          const representative = accountInfo?.representative || formattedAddress;
          const currentBalance = accountInfo?.balance || '0';
          const amountRaw = blockInfo.blocks[blockHash].amount;

          // Get public key from the private key
          const wallet = await nanoWeb.wallet.generate(privateKey);
          const publicKey = wallet.accounts[0].publicKey;

          const workHash = previous === '0'.repeat(64) ? 
            publicKey : 
            previous;

          const workData = await rpcCall('work_generate', {
            hash: workHash,
            difficulty: previous === '0'.repeat(64) ? 
              'fffffff800000000' : 
              'fffffe0000000000'
          }, this.rpcConfig);

          if (!workData || !workData.work) {
            throw new Error('Failed to generate work');
          }

          const blockData = {
            walletBalanceRaw: currentBalance,
            fromAddress: blockInfo.blocks[blockHash].source,
            toAddress: formattedAddress,
            representativeAddress: representative,
            frontier: previous,
            amountRaw: amountRaw,
            work: workData.work,
            transactionHash: blockHash
          };

          const signedBlock = block.receive(blockData, privateKey);

          const processResult = await rpcCall('process', {
            json_block: 'true',
            subtype: previous === '0'.repeat(64) ? 'open' : 'receive',
            block: signedBlock
          }, this.rpcConfig);

          if (processResult && processResult.hash) {
            receivedCount++;
          }
        } catch (error) {
          this.logger.logError('RECEIVE_BLOCK_ERROR', {
            blockHash,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return { success: true, hash: `Received ${receivedCount} blocks` };
    } catch (error) {
      this.logger.logError('RECEIVE_PENDING_ERROR', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async initializeAccount(address: string, privateKey: string): Promise<any> {
    try {
      this.logger.log('INITIALIZE_ACCOUNT', { address });
      
      if (!this.keyManager.validateKeyFormat(privateKey)) {
        throw new Error('Invalid private key format');
      }

      const accountInfo = await rpcCall('account_info', {
        account: address,
        representative: true,
        receivable: true
      }, this.rpcConfig).catch(() => null);

      if (accountInfo && !accountInfo.error) {
        return { status: 'Account already initialized' };
      }

      const publicKey = nanocurrency.derivePublicKey(privateKey);
      
      if (!this.keyManager.verifyKeyPair(privateKey, publicKey)) {
        throw new Error('Key pair verification failed');
      }

      const workData = await rpcCall('work_generate', {
        hash: publicKey,
        difficulty: 'fffffff800000000'
      }, this.rpcConfig);

      if (!workData || !workData.work) {
        throw new Error('Failed to generate work');
      }

      const blockData = {
        walletBalanceRaw: '0',
        fromAddress: address,
        toAddress: address,
        representativeAddress: address,
        frontier: publicKey,
        amountRaw: '0',
        work: workData.work
      };

      const signedBlock = block.receive(blockData, privateKey);
      
      const processResult = await rpcCall('process', {
        json_block: 'true',
        subtype: 'open',
        block: signedBlock
      }, this.rpcConfig);

      return processResult;
    } catch (error) {
      this.logger.logError('INITIALIZE_ACCOUNT_ERROR', error);
      throw error;
    }
  }

  async createWallet(): Promise<string> {
    try {
      const response = await rpcCall('wallet_create', {}, this.rpcConfig);
      if (response.wallet) {
        return response.wallet;
      }
      throw new Error('Failed to create wallet');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create wallet: ${errorMessage}`);
    }
  }

  async createAccount(): Promise<string> {
    if (!this.rpcConfig.walletId) {
      throw new Error('Wallet ID not configured. Call setRPCConfig with walletId first.');
    }

    try {
      const response = await rpcCall('account_create', {
        wallet: this.rpcConfig.walletId
      }, this.rpcConfig);

      if (response.account) {
        return response.account;
      }
      throw new Error('Failed to create account');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create account: ${errorMessage}`);
    }
  }

  async send(toAddress: string, fromAddress: string, amountNano: string): Promise<string> {
    if (!this.rpcConfig.walletId) {
      throw new Error('Wallet ID not configured. Call setRPCConfig with walletId first.');
    }

    try {
      const amountRaw = this.convertFromNano(amountNano);
      
      const response = await rpcCall('send', {
        wallet: this.rpcConfig.walletId,
        source: fromAddress,
        destination: toAddress,
        amount: amountRaw
      }, this.rpcConfig);

      if (response.block) {
        return response.block;
      }
      throw new Error('Failed to send transaction');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send transaction: ${errorMessage}`);
    }
  }

  async receiveAll(address: string): Promise<{ received: number }> {
    if (!this.rpcConfig.walletId) {
      throw new Error('Wallet ID not configured. Call setRPCConfig with walletId first.');
    }

    try {
      const pendingResponse = await rpcCall('pending', {
        account: address,
        threshold: '1',
        source: true,
        include_active: true,
        include_only_confirmed: true
      }, this.rpcConfig);

      if (!pendingResponse.blocks || Object.keys(pendingResponse.blocks).length === 0) {
        return { received: 0 };
      }

      let receivedCount = 0;
      for (const blockHash of Object.keys(pendingResponse.blocks)) {
        try {
          const receiveResponse = await rpcCall('receive', {
            wallet: this.rpcConfig.walletId,
            account: address,
            block: blockHash
          }, this.rpcConfig);

          if (receiveResponse.block) {
            receivedCount++;
          }
        } catch (error) {
          console.error('Error receiving block:', blockHash, error);
        }
      }

      return { received: receivedCount };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to receive pending transactions: ${errorMessage}`);
    }
  }

  async backupWallet(walletId: string): Promise<any> {
    try {
      const response = await rpcCall('wallet_export', {
        wallet: walletId
      }, this.rpcConfig);

      if (response.json) {
        return response.json;
      }
      throw new Error('Failed to export wallet');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to backup wallet: ${errorMessage}`);
    }
  }

  // Helper methods
  private convertToNano(rawAmount: string): string {
    return convert(rawAmount, { from: Unit.raw, to: Unit.NANO });
  }

  private convertFromNano(nanoAmount: string): string {
    return convert(nanoAmount, { from: Unit.NANO, to: Unit.raw });
  }

  // Override MCPServer method to handle requests
  async handleRequest(method: string, params: any[]): Promise<any> {
    const handler = this.methods.get(method);
    if (!handler) {
      throw new Error(`Method ${method} not found`);
    }
    return await handler(...params);
  }
} 