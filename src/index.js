#!/usr/bin/env node

const { NanoMCPServer } = require('./server');
const { StdioTransport } = require('./stdio-transport');

// Global Error Handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Keep the process alive but log the error
    // In a critical production system, we might want to exit, 
    // but for an MCP server staying alive is often preferred to avoid breaking the client connection completely.
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Keep the process alive
});

// ⚠️ CRITICAL: RPC NODE CONFIGURATION WITH REDUNDANCY
// ⚠️ Primary RPC Node: https://uk1.public.xnopay.com/proxy
// ⚠️ Backup RPC Node 1: https://node.somenano.com/proxy (tested and verified)
// ⚠️ Backup RPC Node 2: https://rainstorm.city/api (tested and verified)
// ⚠️ Backup RPC Node 3: https://nanoslo.0x.no/proxy (tested and verified - 10k rate limit)
// ⚠️ All nodes are public and require NO API KEY
// ⚠️ Failover is automatic if primary node becomes unavailable
// ⚠️ System will try each node twice before giving up (total 8 attempts across 4 nodes)

// Default configuration
const config = {
    port: 8080,
    rpcNodes: [
        'https://uk1.public.xnopay.com/proxy',  // Primary RPC node
        'https://node.somenano.com/proxy',      // Backup RPC node 1 (redundancy)
        'https://rainstorm.city/api',           // Backup RPC node 2 (redundancy)
        'https://nanoslo.0x.no/proxy'          // Backup RPC node 3 (redundancy - 10k rate limit)
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
