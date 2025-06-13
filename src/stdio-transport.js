const readline = require('readline');

class StdioTransport {
    /**
     * Creates a new stdio transport for NANO MCP Server
     * @param {NanoMCPServer} server - The NANO MCP server instance
     */
    constructor(server) {
        this.server = server;
    }

    /**
     * Starts the stdio transport
     */
    start() {
        console.error('NANO MCP Server running in stdio mode');
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', async (data) => {
            try {
                const request = JSON.parse(data);
                const response = await this.server.handleRequest(request);
                console.log(JSON.stringify(response));
            } catch (error) {
                console.error('Error processing request:', error);
                console.log(JSON.stringify({
                    jsonrpc: "2.0",
                    error: {
                        code: -32700,
                        message: "Parse error"
                    },
                    id: null
                }));
            }
        });

        // Handle process termination
        process.on('SIGINT', () => {
            this.stop();
            process.exit(0);
        });
    }

    stop() {
        // Close readline interface if it exists
        if (this.rl) {
            this.rl.close();
        }
    }
}

module.exports = { StdioTransport }; 