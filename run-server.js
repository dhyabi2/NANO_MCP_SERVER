import { NanoMCP } from './src/mcp.js';

process.stdout.write('\x1Bc'); // Clear console
console.log('Starting NANO MCP Server...');

const server = new NanoMCP();

// Initialize request handler
server.setRequestHandler('initialize', async (request) => {
    console.log('Initialization request received');
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

// Start the server
try {
    await server.start();
    console.log('Server started successfully!');
    
    // Keep the process running
    process.stdin.resume();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down server...');
        process.exit(0);
    });
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
} 