import { jest } from '@jest/globals';
import { checkAddress, checkHash, convert, Unit } from 'nanocurrency';
import { rpcCall } from '../rpc';
import { RPCConfig } from '../mcp-types';
import type { MockResponse } from './types';

describe('NANO RPC Tests', () => {
  const TEST_ACCOUNT = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
  const TEST_BLOCK = '023B94B7D27B311666C8636954FE17F1FD2EAA97A8BAC27DE5084FBBD5C6B02C';

  // Increase timeout for real RPC calls
  jest.setTimeout(30000);

  describe('Account Operations', () => {
    test('should get account balance successfully', async () => {
      const result = await rpcCall('account_balance', { account: TEST_ACCOUNT });

      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('pending');
      expect(result).toHaveProperty('receivable');

      // Verify balance conversion
      const balanceNano = convert(result.balance, {
        from: Unit.raw,
        to: Unit.NANO,
      });
      expect(parseFloat(balanceNano)).toBeGreaterThanOrEqual(0);
    });

    test('should handle invalid account address', async () => {
      const invalidAccount = 'invalid_account';
      expect(checkAddress(invalidAccount)).toBe(false);

      await expect(rpcCall('account_balance', { account: invalidAccount }))
        .rejects
        .toThrow();
    });

    test('should get account info successfully', async () => {
      const result = await rpcCall('account_info', { account: TEST_ACCOUNT });

      expect(result).toHaveProperty('frontier');
      expect(result).toHaveProperty('open_block');
      expect(result).toHaveProperty('representative_block');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('modified_timestamp');
      expect(result).toHaveProperty('block_count');
    });
  });

  describe('Block Operations', () => {
    test('should get block info successfully', async () => {
      const result = await rpcCall('block_info', { hash: TEST_BLOCK });

      expect(result).toHaveProperty('block_account');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('local_timestamp');
      expect(result).toHaveProperty('confirmed');
    });

    test('should handle invalid block hash', async () => {
      const invalidHash = 'invalid_hash';
      expect(checkHash(invalidHash)).toBe(false);

      await expect(rpcCall('block_info', { hash: invalidHash }))
        .rejects
        .toThrow();
    });

    test('should get block count successfully', async () => {
      const result = await rpcCall('block_count');

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('unchecked');
      expect(result).toHaveProperty('cemented');

      expect(parseInt(result.count)).toBeGreaterThan(0);
      expect(parseInt(result.cemented)).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle RPC errors for non-existent account', async () => {
      const nonExistentAccount = 'nano_1111111111111111111111111111111111111111111111111111hifc8npp';

      await expect(rpcCall('account_info', { account: nonExistentAccount }))
        .rejects
        .toThrow();
    });

    test('should handle RPC errors for non-existent block', async () => {
      const nonExistentBlock = '0000000000000000000000000000000000000000000000000000000000000000';

      await expect(rpcCall('block_info', { hash: nonExistentBlock }))
        .rejects
        .toThrow();
    });
  });

  describe('Node Information', () => {
    test('should get version information successfully', async () => {
      const result = await rpcCall('version');

      expect(result).toHaveProperty('rpc_version');
      expect(result).toHaveProperty('store_version');
      expect(result).toHaveProperty('protocol_version');
      expect(result).toHaveProperty('node_vendor');
      expect(result).toHaveProperty('store_vendor');
      expect(result).toHaveProperty('network');
    });
  });
});

describe('RPC', () => {
  const mockConfig: RPCConfig = {
    nodeUrl: 'https://proxy.nanos.cc/proxy',
    apiKey: 'test-key'
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should make successful RPC calls', async () => {
    const mockResponse = { success: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as MockResponse);

    const result = await rpcCall('test_action', { param: 'value' }, mockConfig);
    expect(result).toEqual(mockResponse);

    expect(global.fetch).toHaveBeenCalledWith(
      mockConfig.nodeUrl,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key'
        },
        body: JSON.stringify({
          action: 'test_action',
          param: 'value'
        })
      })
    );
  });

  it('should handle HTTP errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    } as MockResponse);

    await expect(rpcCall('test_action', {}, mockConfig))
      .rejects
      .toThrow('HTTP error! status: 500');
  });

  it('should handle RPC errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ error: 'RPC error message' })
    } as MockResponse);

    await expect(rpcCall('test_action', {}, mockConfig))
      .rejects
      .toThrow('RPC error message');
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    await expect(rpcCall('test_action', {}, mockConfig))
      .rejects
      .toThrow('RPC call failed: Network error');
  });
}); 