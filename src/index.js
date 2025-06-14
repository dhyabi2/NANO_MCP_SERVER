#!/usr/bin/env node

const { NanoMCPServer } = require('./server');
const { StdioTransport } = require('./stdio-transport');

// Default configuration
const config = {
    port: process.env.MCP_PORT || 8080,
    apiUrl: process.env.NANO_RPC_URL || 'https://rpc.nano.to',
    rpcKey: process.env.NANO_RPC_KEY || 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
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