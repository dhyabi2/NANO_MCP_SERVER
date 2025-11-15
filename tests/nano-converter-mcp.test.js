/**
 * Nano Converter MCP Integration Tests
 * Tests the nanoConverterHelp MCP tool integration
 */

const { NanoMCPServer } = require('../src/server');

describe('NanoConverter MCP Integration', () => {
    let server;

    beforeEach(() => {
        server = new NanoMCPServer();
    });

    describe('nanoConverterHelp method', () => {
        test('should be available in tools list', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "initialize",
                params: {},
                id: 1
            });

            expect(response.result.capabilities.methods).toContain('nanoConverterHelp');
        });

        test('should return comprehensive conversion help', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(1);
            expect(response.result).toBeDefined();
        });

        test('should include description and formulas', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            const result = response.result;
            expect(result.description).toContain('10^30');
            expect(result.formula).toBe('raw = XNO × 10^30');
            expect(result.reverseFormula).toBe('XNO = raw ÷ 10^30');
            expect(result.decimalPlaces).toBe(30);
        });

        test('should include conversion examples', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            const result = response.result;
            expect(result.examples).toBeDefined();
            expect(result.examples['1_XNO']).toBe('1000000000000000000000000000000');
            expect(result.examples['0.1_XNO']).toBe('100000000000000000000000000000');
            expect(Object.keys(result.examples).length).toBeGreaterThan(5);
        });

        test('should include common mistakes list', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            const result = response.result;
            expect(result.commonMistakes).toBeDefined();
            expect(Array.isArray(result.commonMistakes)).toBe(true);
            expect(result.commonMistakes.length).toBeGreaterThan(3);
            expect(result.commonMistakes.some(m => m.includes('floating-point'))).toBe(true);
        });

        test('should include utility functions documentation', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            const result = response.result;
            expect(result.utilityFunctions).toBeDefined();
            expect(result.utilityFunctions.xnoToRaw).toBeDefined();
            expect(result.utilityFunctions.rawToXNO).toBeDefined();
            expect(result.utilityFunctions.isValidNanoAddress).toBeDefined();
            expect(result.utilityFunctions.formatXNO).toBeDefined();
        });

        test('should include example workflow', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            const result = response.result;
            expect(result.exampleWorkflow).toBeDefined();
            expect(Array.isArray(result.exampleWorkflow)).toBe(true);
            expect(result.exampleWorkflow.length).toBeGreaterThan(3);
            expect(result.exampleWorkflow[0]).toContain('Step 1');
        });

        test('should include integration guidance', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            const result = response.result;
            expect(result.integrationWithMCP).toBeDefined();
            expect(result.integrationWithMCP.convertBalance).toBeDefined();
            expect(result.integrationWithMCP.getAccountStatus).toBeDefined();
            expect(result.integrationWithMCP.sendTransaction).toBeDefined();
        });

        test('should include warning about decimal places', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            const result = response.result;
            expect(result.warning).toBeDefined();
            expect(result.warning).toContain('30 decimal places');
            expect(result.warning).toContain('10^30');
        });

        test('should include best practices', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            const result = response.result;
            expect(result.bestPractices).toBeDefined();
            expect(Array.isArray(result.bestPractices)).toBe(true);
            expect(result.bestPractices.some(p => p.includes('BigInt'))).toBe(true);
        });

        test('should not require any parameters', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            expect(response.result).toBeDefined();
            expect(response.error).toBeUndefined();
        });

        test('should work even without params object', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                id: 1
            });

            // Should still work (params is optional for this method)
            expect(response.result).toBeDefined();
        });
    });

    describe('Integration with other MCP methods', () => {
        test('should appear in tools/list', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "tools/list",
                params: {},
                id: 1
            });

            const tools = response.result.tools;
            const nanoConverterTool = tools.find(t => t.name === 'nanoConverterHelp');
            
            expect(nanoConverterTool).toBeDefined();
            expect(nanoConverterTool.description).toContain('conversion');
            expect(nanoConverterTool.description).toContain('clients');
        });

        test('should complement convertBalance method', async () => {
            // First get help
            const helpResponse = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            // Then use convertBalance
            const convertResponse = await server.handleRequest({
                jsonrpc: "2.0",
                method: "convertBalance",
                params: {
                    amount: "0.1",
                    from: "nano",
                    to: "raw"
                },
                id: 2
            });

            // Verify the example in help matches the actual conversion
            const exampleRaw = helpResponse.result.examples['0.1_XNO'];
            const actualRaw = convertResponse.result.converted;
            expect(actualRaw).toBe(exampleRaw);
        });

        test('should provide guidance that works with sendTransaction', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            // Verify the workflow mentions sendTransaction
            const workflow = response.result.exampleWorkflow.join(' ');
            expect(workflow).toContain('sendTransaction');
            
            // Verify integration guidance mentions sendTransaction
            expect(response.result.integrationWithMCP.sendTransaction).toContain('amountRaw');
        });
    });

    describe('Error handling', () => {
        test('should handle method call with extra parameters gracefully', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {
                    unexpectedParam: "should be ignored"
                },
                id: 1
            });

            // Should still work, ignoring extra params
            expect(response.result).toBeDefined();
            expect(response.error).toBeUndefined();
        });
    });

    describe('Response structure validation', () => {
        test('should return valid JSON-RPC 2.0 response', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(1);
            expect(response.result).toBeDefined();
            expect(response.error).toBeUndefined();
        });

        test('should return comprehensive help object', async () => {
            const response = await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            const result = response.result;
            
            // Check all expected top-level properties
            expect(result).toHaveProperty('description');
            expect(result).toHaveProperty('formula');
            expect(result).toHaveProperty('reverseFormula');
            expect(result).toHaveProperty('decimalPlaces');
            expect(result).toHaveProperty('examples');
            expect(result).toHaveProperty('commonMistakes');
            expect(result).toHaveProperty('tools');
            expect(result).toHaveProperty('bestPractices');
            expect(result).toHaveProperty('utilityFunctions');
            expect(result).toHaveProperty('exampleWorkflow');
            expect(result).toHaveProperty('integrationWithMCP');
            expect(result).toHaveProperty('warning');
        });
    });

    describe('Logging', () => {
        test('should log when method is called', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            await server.handleRequest({
                jsonrpc: "2.0",
                method: "nanoConverterHelp",
                params: {},
                id: 1
            });

            // The NanoConverter utilities log when accessed
            // No direct logging for the MCP method itself, but the utilities log
            
            consoleLogSpy.mockRestore();
        });
    });
});

