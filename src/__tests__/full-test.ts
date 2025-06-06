import { NanoMCP } from '../mcp';
import { config } from '../config/global';

describe('NANO MCP Full Test Suite', () => {
    let mcp: NanoMCP;

    beforeAll(async () => {
        // Initialize with test configuration
        await NanoMCP.initialize({
            rpcUrl: 'https://rpc.nano.to/',
            rpcKey: 'test_key',
            gpuKey: 'test_gpu_key',
            defaultRepresentative: 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4'
        });
        mcp = new NanoMCP();
    });

    describe('Configuration', () => {
        test('should initialize with valid configuration', () => {
            const nanoConfig = config.getNanoConfig();
            expect(nanoConfig.rpcUrl).toBe('https://rpc.nano.to/');
            expect(nanoConfig.defaultRepresentative).toBe('nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4');
        });

        test('should validate configuration', () => {
            const validation = config.validateConfig();
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
    });

    describe('Account Operations', () => {
        const TEST_ACCOUNT = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';

        test('should get account balance', async () => {
            const result = await mcp.getBalance(TEST_ACCOUNT);
            expect(result).toHaveProperty('balanceNano');
            expect(result).toHaveProperty('pendingNano');
            expect(parseFloat(result.balanceNano)).toBeGreaterThanOrEqual(0);
        });

        test('should get account info', async () => {
            const result = await mcp.getAccountInfo(TEST_ACCOUNT);
            expect(result).toHaveProperty('frontier');
            expect(result).toHaveProperty('balance');
            expect(result).toHaveProperty('representative');
        });

        test('should handle invalid account', async () => {
            await expect(mcp.getBalance('invalid_account'))
                .rejects
                .toThrow();
        });
    });

    describe('Network Information', () => {
        test('should get block count', async () => {
            const result = await mcp.getBlockCount();
            expect(result).toHaveProperty('count');
            expect(parseInt(result.count)).toBeGreaterThan(0);
        });

        test('should get version info', async () => {
            const result = await mcp.getVersion();
            expect(result).toHaveProperty('node_vendor');
            expect(result).toHaveProperty('protocol_version');
        });
    });

    describe('Unit Conversion', () => {
        test('should convert raw to NANO', () => {
            const rawAmount = '1000000000000000000000000000000'; // 1 NANO
            const nanoAmount = mcp.convertToNano(rawAmount);
            expect(nanoAmount).toBe('1');
        });

        test('should convert NANO to raw', () => {
            const nanoAmount = '1';
            const rawAmount = mcp.convertFromNano(nanoAmount);
            expect(rawAmount).toBe('1000000000000000000000000000000');
        });

        test('should handle decimal amounts', () => {
            const nanoAmount = '0.123456';
            const rawAmount = mcp.convertFromNano(nanoAmount);
            const backToNano = mcp.convertToNano(rawAmount);
            expect(backToNano).toBe('0.123456');
        });
    });

    describe('Error Handling', () => {
        test('should handle RPC errors gracefully', async () => {
            const invalidAccount = 'nano_1invalid111111111111111111111111111111111111111111111111111111';
            await expect(mcp.getAccountInfo(invalidAccount))
                .rejects
                .toThrow();
        });

        test('should handle network errors', async () => {
            const badMcp = new NanoMCP();
            config.initializeConfig({ rpcUrl: 'https://invalid.url/' });
            await expect(badMcp.getBlockCount())
                .rejects
                .toThrow();
        });
    });

    describe('Representative Management', () => {
        test('should use default representative', () => {
            const nanoConfig = config.getNanoConfig();
            expect(nanoConfig.defaultRepresentative)
                .toBe('nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4');
        });

        test('should allow custom representative', async () => {
            const customRep = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
            config.initializeConfig({ defaultRepresentative: customRep });
            const nanoConfig = config.getNanoConfig();
            expect(nanoConfig.defaultRepresentative).toBe(customRep);
        });
    });
}); 