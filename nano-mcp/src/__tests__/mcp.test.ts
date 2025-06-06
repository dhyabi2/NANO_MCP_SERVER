import { NanoMCP } from '../mcp';
import { rpcCall } from '../rpc';
import * as nanocurrency from 'nanocurrency';
import * as nanoWeb from 'nanocurrency-web';

// Mock the rpcCall function
jest.mock('../rpc');
const mockedRpcCall = rpcCall as jest.MockedFunction<typeof rpcCall>;

describe('NanoMCP', () => {
  let mcp: NanoMCP;
  
  beforeEach(() => {
    mcp = new NanoMCP();
    jest.clearAllMocks();
  });

  describe('Wallet Generation', () => {
    it('should generate a valid wallet', async () => {
      const wallet = await mcp.generateWallet();
      
      expect(wallet).toHaveProperty('address');
      expect(wallet).toHaveProperty('privateKey');
      expect(wallet).toHaveProperty('publicKey');
      
      expect(wallet.address).toMatch(/^nano_[a-zA-Z0-9]{60}$/);
      expect(wallet.privateKey).toMatch(/^[0-9a-fA-F]{64}$/);
      expect(wallet.publicKey).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    it('should convert xrb_ prefix to nano_', async () => {
      jest.spyOn(nanoWeb.wallet, 'generate').mockImplementation(async () => ({
        mnemonic: 'test mnemonic',
        seed: 'test seed',
        accounts: [{
          address: 'xrb_1234',
          privateKey: '1234',
          publicKey: '5678'
        }]
      }));

      const wallet = await mcp.generateWallet();
      expect(wallet.address).toMatch(/^nano_/);
    });
  });

  describe('Account Initialization', () => {
    const testAddress = 'nano_' + '1'.repeat(60);
    const testPrivateKey = '0'.repeat(64);

    it('should initialize a new account', async () => {
      mockedRpcCall
        .mockResolvedValueOnce({ error: 'Account not found' }) // account_info call
        .mockResolvedValueOnce({ work: 'work123' }) // work_generate call
        .mockResolvedValueOnce({ hash: 'block123' }); // process call

      const result = await mcp.initializeAccount(testAddress, testPrivateKey);
      expect(result).toHaveProperty('hash');
    });

    it('should handle already initialized accounts', async () => {
      mockedRpcCall.mockResolvedValueOnce({ balance: '0' }); // account_info returns success

      const result = await mcp.initializeAccount(testAddress, testPrivateKey);
      expect(result).toEqual({ status: 'Account already initialized' });
    });

    it('should validate private key format', async () => {
      await expect(mcp.initializeAccount(testAddress, 'invalid-key'))
        .rejects
        .toThrow('Invalid private key format');
    });
  });

  describe('Transaction Operations', () => {
    const testFromAddress = 'nano_' + '1'.repeat(60);
    const testToAddress = 'nano_' + '2'.repeat(60);
    const testPrivateKey = '0'.repeat(64);
    const testAmount = '1000000000000000000000000000000'; // 1 NANO in raw

    it('should send a transaction successfully', async () => {
      mockedRpcCall
        .mockResolvedValueOnce({ // account_info
          balance: '2000000000000000000000000000000',
          frontier: 'previous_block_hash',
          representative: 'nano_rep'
        })
        .mockResolvedValueOnce({ work: 'work123' }) // work_generate
        .mockResolvedValueOnce({ hash: 'new_block_hash' }); // process

      const result = await mcp.sendTransaction(
        testFromAddress,
        testPrivateKey,
        testToAddress,
        testAmount
      );

      expect(result.success).toBe(true);
      expect(result.hash).toBe('new_block_hash');
    });

    it('should handle send transaction errors', async () => {
      mockedRpcCall.mockRejectedValueOnce(new Error('RPC error'));

      const result = await mcp.sendTransaction(
        testFromAddress,
        testPrivateKey,
        testToAddress,
        testAmount
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('RPC error');
    });
  });

  describe('Pending Reception', () => {
    const testAddress = 'nano_' + '1'.repeat(60);
    const testPrivateKey = '0'.repeat(64);

    it('should receive pending transactions', async () => {
      mockedRpcCall
        .mockResolvedValueOnce({ // pending
          blocks: {
            'block1': { amount: '1000000000000000000000000000000' }
          }
        })
        .mockResolvedValueOnce({ // blocks_info
          blocks: {
            'block1': {
              amount: '1000000000000000000000000000000',
              source: 'nano_source'
            }
          }
        })
        .mockResolvedValueOnce({ // account_info
          frontier: 'frontier_hash',
          representative: 'nano_rep'
        })
        .mockResolvedValueOnce({ work: 'work123' }) // work_generate
        .mockResolvedValueOnce({ hash: 'new_block_hash' }); // process

      const result = await mcp.receivePending(testAddress, testPrivateKey);
      expect(result.success).toBe(true);
      expect(result.hash).toBe('new_block_hash');
    });

    it('should handle no pending blocks', async () => {
      mockedRpcCall.mockResolvedValueOnce({ blocks: {} }); // pending

      const result = await mcp.receivePending(testAddress, testPrivateKey);
      expect(result.success).toBe(true);
      expect(result.hash).toBeUndefined();
    });
  });

  describe('Balance and Info Operations', () => {
    const testAddress = 'nano_' + '1'.repeat(60);

    it('should get account balance', async () => {
      mockedRpcCall.mockResolvedValueOnce({
        balance: '1000000000000000000000000000000',
        pending: '0',
        receivable: '0'
      });

      const balance = await mcp.getBalance(testAddress);
      expect(balance).toEqual({
        balance: '1000000000000000000000000000000',
        pending: '0',
        receivable: '0'
      });
    });

    it('should get account info', async () => {
      const mockAccountInfo = {
        frontier: 'block_hash',
        open_block: 'open_block_hash',
        representative_block: 'rep_block_hash',
        balance: '1000000000000000000000000000000',
        modified_timestamp: '1614556800',
        block_count: '1',
        representative: 'nano_rep'
      };

      mockedRpcCall.mockResolvedValueOnce(mockAccountInfo);

      const info = await mcp.getAccountInfo(testAddress);
      expect(info).toEqual(mockAccountInfo);
    });
  });

  describe('Wallet Operations', () => {
    const testWalletId = 'wallet123';

    it('should create a wallet', async () => {
      mockedRpcCall.mockResolvedValueOnce({ wallet: testWalletId });

      const walletId = await mcp.createWallet();
      expect(walletId).toBe(testWalletId);
    });

    it('should create an account in a wallet', async () => {
      const testAccount = 'nano_' + '1'.repeat(60);
      mcp.setRPCConfig({ 
        nodeUrl: 'https://proxy.nanos.cc/proxy',
        walletId: testWalletId 
      });
      mockedRpcCall.mockResolvedValueOnce({ account: testAccount });

      const account = await mcp.createAccount();
      expect(account).toBe(testAccount);
    });

    it('should backup a wallet', async () => {
      const mockBackup = { seed: 'test_seed', accounts: [] };
      mockedRpcCall.mockResolvedValueOnce({ json: mockBackup });

      const backup = await mcp.backupWallet(testWalletId);
      expect(backup).toEqual(mockBackup);
    });
  });

  describe('Unit Conversion', () => {
    it('should convert raw to NANO', async () => {
      const raw = '1000000000000000000000000000000'; // 1 NANO in raw
      const nano = await mcp.handleRequest('convertToNano', [raw]);
      expect(nano).toBe('1');
    });

    it('should convert NANO to raw', async () => {
      const nano = '1';
      const raw = await mcp.handleRequest('convertFromNano', [nano]);
      expect(raw).toBe('1000000000000000000000000000000');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid method calls', async () => {
      await expect(mcp.handleRequest('invalidMethod', []))
        .rejects
        .toThrow('Method invalidMethod not found');
    });

    it('should handle RPC errors gracefully', async () => {
      mockedRpcCall.mockRejectedValueOnce(new Error('RPC connection failed'));

      await expect(mcp.getBalance('nano_address'))
        .rejects
        .toThrow('RPC connection failed');
    });
  });
}); 