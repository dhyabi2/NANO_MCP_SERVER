import { NanoMCP } from './src/mcp.js';

async function main() {
    try {
        console.log('Starting test server...');
        const server = new NanoMCP();
        await server.start();
        console.log('Server started successfully');
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

main(); 