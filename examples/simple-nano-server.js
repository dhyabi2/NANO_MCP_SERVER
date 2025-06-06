const { NanoMCP } = require('./node_modules/nano-mcp/src/mcp.js');

console.log('Starting NANO MCP Server...');

const server = new NanoMCP({
    publicKey: 'PUBLIC-KEY-FA9CE81226BF478291D34836A09D8B06',
    rpcKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
    port: 8000,
    host: '127.0.0.1'
});

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
async function startServer() {
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
}

startServer(); 