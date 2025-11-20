#!/usr/bin/env node

const { NanoMCPServer } = require('./server');
const { StdioTransport } = require('./stdio-transport');

// ⚠️ CRITICAL: RPC NODE CONFIGURATION WITH REDUNDANCY
// ⚠️ Primary RPC Node: https://uk1.public.xnopay.com/proxy
// ⚠️ Backup RPC Node: https://node.somenano.com/proxy (tested and verified)
// ⚠️ Both nodes are public and require NO API KEY
// ⚠️ Failover is automatic if primary node becomes unavailable

// Default configuration
const config = {
    port: 8080,
    rpcNodes: [
        'https://uk1.public.xnopay.com/proxy',  // Primary RPC node
        'https://node.somenano.com/proxy'       // Backup RPC node (redundancy)
    ],
    rpcKey: null, // No API key required for public nodes
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
