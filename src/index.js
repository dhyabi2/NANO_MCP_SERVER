#!/usr/bin/env node

const { MCPServer } = require('./server');

// Default configuration
const config = {
    port: process.env.MCP_PORT || 8080,
    apiUrl: process.env.NANO_RPC_URL || 'https://rpc.nano.to',
    rpcKey: process.env.NANO_RPC_KEY,
    defaultRepresentative: process.env.NANO_REPRESENTATIVE || 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf'
};

// Create and start the server
const server = new MCPServer(config);
server.start();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    await server.stop();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT. Performing graceful shutdown...');
    await server.stop();
    process.exit(0);
}); 