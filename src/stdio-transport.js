const readline = require('readline');

class StdioTransport {
    /**
     * Creates a new stdio transport for NANO MCP Server
     * @param {NanoMCPServer} server - The NANO MCP server instance
     */
    constructor(server, input = process.stdin, output = process.stdout) {
        this.server = server;
        this.input = input;
        this.output = output;
    }

    /**
     * Starts the stdio transport
     */
    start() {
        console.error('NANO MCP Server running in stdio mode');
        
        this.rl = readline.createInterface({
            input: this.input,
            terminal: false
        });

        this.rl.on('line', async (line) => {
            // console.error('DEBUG: Received line:', line);
            // Skip empty lines
            if (!line.trim()) return;

            try {
                const request = JSON.parse(line);
                const response = await this.server.handleRequest(request);
                this.output.write(JSON.stringify(response) + '\n');
            } catch (error) {
                console.error('Error processing request:', error);
                this.output.write(JSON.stringify({
                    jsonrpc: "2.0",
                    error: {
                        code: -32700,
                        message: "Parse error"
                    },
                    id: null
                }) + '\n');
            }
        });

        this.rl.on('close', () => {
            process.exit(0);
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
