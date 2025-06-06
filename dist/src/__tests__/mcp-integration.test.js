import { NanoMCP } from '@chainreactionom/nano-mcp-server';
import { config } from '@chainreactionom/nano-mcp-server/dist/config/global';
describe('NANO MCP Integration Tests', () => {
    let mcp;
    beforeAll(async () => {
        // Initialize with test configuration
        await config.initializeConfig({
            rpcUrl: 'https://rpc.nano.to/',
            rpcKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
            gpuKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
            defaultRepresentative: 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4'
        });
        mcp = new NanoMCP();
    });
    describe('Basic Operations', () => {
        test('should get node version', async () => {
            const version = await mcp.handleRequest({ method: 'getVersion' });
            expect(version.result).toBeDefined();
        });
        test('should get block count', async () => {
            const blockCount = await mcp.handleRequest({ method: 'getBlockCount' });
            expect(blockCount.result).toBeDefined();
            expect(typeof blockCount.result.count).toBe('string');
        });
        test('should get account balance', async () => {
            const balance = await mcp.handleRequest({
                method: 'getBalance',
                params: {
                    account: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
                }
            });
            expect(balance.result).toBeDefined();
            expect(typeof balance.result.balance).toBe('string');
        });
    });
    describe('Unit Conversion', () => {
        test('should convert to NANO', async () => {
            const result = await mcp.handleRequest({
                method: 'convertToNano',
                params: { raw: '1000000000000000000000000000000' }
            });
            expect(result.result).toBe('1');
        });
        test('should convert from NANO', async () => {
            const result = await mcp.handleRequest({
                method: 'convertFromNano',
                params: { nano: '1' }
            });
            expect(result.result).toBe('1000000000000000000000000000000');
        });
    });
    describe('Account Operations', () => {
        test('should get account info', async () => {
            const info = await mcp.handleRequest({
                method: 'getAccountInfo',
                params: {
                    account: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
                }
            });
            expect(info.result).toBeDefined();
            expect(info.error).toBeUndefined();
        });
        test('should handle invalid account', async () => {
            const info = await mcp.handleRequest({
                method: 'getAccountInfo',
                params: { account: 'invalid_address' }
            });
            expect(info.error).toBeDefined();
        });
    });
    describe('Error Handling', () => {
        test('should handle invalid method', async () => {
            const result = await mcp.handleRequest({
                method: 'invalidMethod'
            });
            expect(result.error).toBeDefined();
            expect(result.error.code).toBe(-32601);
        });
        test('should handle missing parameters', async () => {
            const result = await mcp.handleRequest({
                method: 'getBalance'
            });
            expect(result.error).toBeDefined();
        });
    });
    describe('Configuration Validation', () => {
        test('should validate RPC URL', () => {
            const validation = config.validateConfig();
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
    });
});
