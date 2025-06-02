import { NanoMCP } from '../mcp.js';

describe('NANO MCP Tests', () => {
  const TEST_ACCOUNT = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
  let server: NanoMCP;

  beforeAll(() => {
    server = new NanoMCP();
  });

  describe('Balance Operations', () => {
    test('should get account balance in NANO units', async () => {
      const result = await server.getBalance(TEST_ACCOUNT);
      
      expect(result).toHaveProperty('balanceNano');
      expect(result).toHaveProperty('pendingNano');
      expect(parseFloat(result.balanceNano)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(result.pendingNano)).toBeGreaterThanOrEqual(0);
    });

    test('should handle invalid account for balance', async () => {
      await expect(server.getBalance('invalid_account'))
        .rejects
        .toThrow();
    });
  });

  describe('Account Information', () => {
    test('should get account info', async () => {
      const result = await server.getAccountInfo(TEST_ACCOUNT);
      
      expect(result).toHaveProperty('frontier');
      expect(result).toHaveProperty('open_block');
      expect(result).toHaveProperty('representative_block');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('modified_timestamp');
      expect(result).toHaveProperty('block_count');
    });

    test('should handle non-existent account', async () => {
      const nonExistentAccount = 'nano_1111111111111111111111111111111111111111111111111111hifc8npp';
      
      await expect(server.getAccountInfo(nonExistentAccount))
        .rejects
        .toThrow();
    });
  });

  describe('Block Count', () => {
    test('should get network block count', async () => {
      const result = await server.getBlockCount();
      
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('unchecked');
      expect(result).toHaveProperty('cemented');
      expect(parseInt(result.count)).toBeGreaterThan(0);
      expect(parseInt(result.cemented)).toBeGreaterThan(0);
    });
  });

  describe('Version Information', () => {
    test('should get node version info', async () => {
      const result = await server.getVersion();
      
      expect(result).toHaveProperty('rpc_version');
      expect(result).toHaveProperty('node_vendor');
      expect(result).toHaveProperty('network');
    });
  });

  describe('Unit Conversion', () => {
    test('should convert raw to NANO', () => {
      const rawAmount = '1000000000000000000000000000000'; // 1 NANO in raw
      const nanoAmount = server.convertToNano(rawAmount);
      expect(nanoAmount).toBe('1');
    });

    test('should convert NANO to raw', () => {
      const nanoAmount = '1'; // 1 NANO
      const rawAmount = server.convertFromNano(nanoAmount);
      expect(rawAmount).toBe('1000000000000000000000000000000');
    });

    test('should handle decimal NANO amounts', () => {
      const nanoAmount = '1.23';
      const rawAmount = server.convertFromNano(nanoAmount);
      const backToNano = server.convertToNano(rawAmount);
      expect(backToNano).toBe('1.23');
    });
  });
}); 