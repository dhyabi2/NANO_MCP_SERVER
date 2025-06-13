const readline = require('readline');

class StdioTransport {
    constructor(server) {
        this.server = server;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });
    }

    start() {
        // Log startup to stderr to keep stdout clean for JSON-RPC
        console.error('MCP Server running in stdio mode');
        
        this.rl.on('line', async (line) => {
            try {
                const request = JSON.parse(line);
                const response = await this.server.handleRequest(request);
                
                // Write response as a single line with newline
                process.stdout.write(JSON.stringify(response) + '\n');
            } catch (error) {
                // Write error response as a single line with newline
                process.stdout.write(JSON.stringify({
                    jsonrpc: "2.0",
                    error: {
                        code: -32603,
                        message: error.message
                    },
                    id: null
                }) + '\n');
            }
        });

        // Handle process termination
        process.on('SIGINT', () => {
            this.stop();
            process.exit(0);
        });
    }

    stop() {
        this.rl.close();
    }
}

module.exports = { StdioTransport }; 