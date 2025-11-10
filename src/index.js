#!/usr/bin/env node

const { NanoMCPServer } = require('./server');
const { StdioTransport } = require('./stdio-transport');

// ⚠️ CRITICAL: DO NOT CHANGE THE RPC NODE URL
// ⚠️ This RPC node has been specifically configured by the user
// ⚠️ NEVER modify, replace, or add additional RPC nodes
// ⚠️ URL: https://uk1.public.xnopay.com/proxy
// ⚠️ NO API KEY REQUIRED - This is a public node

// Default configuration
const config = {
    port: 8080,
    rpcNodes: [
        'https://uk1.public.xnopay.com/proxy' // ⚠️ DO NOT CHANGE THIS RPC NODE
    ],
    rpcKey: null, // No API key required for xnopay public node
    defaultRepresentative: process.env.NANO_REPRESENTATIVE || 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf',
    transport: process.env.MCP_TRANSPORT || 'http' // 'http' or 'stdio'
};

// Create and start server
const server = new NanoMCPServer(config);

if (config.transport === 'stdio') {
    const stdioTransport = new StdioTransport(server);
    stdioTransport.start();
    console.error('NANO MCP Server running in stdio mode');
} else {
    server.startHttp();
}

// Handle process termination
process.on('SIGINT', () => {
    console.error('\nShutting down NANO MCP Server...');
    process.exit(0);
});
