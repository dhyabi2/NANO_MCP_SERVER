#!/usr/bin/env node
import { NanoMCP } from './mcp.js';
const server = new NanoMCP();
// Initialize request handler
server.setRequestHandler('initialize', async (request) => {
    return {
        version: '1.0.0',
        capabilities: {
            methods: [
                'getBalance',
                'getAccountInfo',
                'getBlockCount',
                'getVersion',
                'convertToNano',
                'convertFromNano',
            ],
        },
    };
});
// Method call handler
server.setRequestHandler('call', async (request) => {
    const { method, params } = request.params;
    return await server.handleRequest(method, params);
});
// Start the server
server.start().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
});
