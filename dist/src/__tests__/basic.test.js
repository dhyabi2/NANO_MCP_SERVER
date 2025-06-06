import { NanoMCP } from '@chainreactionom/nano-mcp-server';
describe('Basic MCP Tests', () => {
    let mcp;
    beforeAll(async () => {
        mcp = new NanoMCP();
    });
    test('should get version info', async () => {
        const response = await mcp.handleRequest({ method: 'getVersion' });
        expect(response.result).toBeDefined();
        expect(response.error).toBeUndefined();
    });
    test('should get block count', async () => {
        const response = await mcp.handleRequest({ method: 'getBlockCount' });
        expect(response.result).toBeDefined();
        expect(response.error).toBeUndefined();
        expect(response.result.count).toBeDefined();
    });
    test('should handle invalid method', async () => {
        const response = await mcp.handleRequest({ method: 'invalidMethod' });
        expect(response.error).toBeDefined();
        expect(response.error.code).toBe(-32601);
    });
});
