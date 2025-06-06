"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
class MCPServer {
    constructor(config) {
        this.config = config;
        this.handlers = new Map();
    }
    async handleRequest(request) {
        const handler = this.handlers.get(request.method);
        if (!handler) {
            return {
                error: {
                    code: -32601,
                    message: `Method ${request.method} not found`,
                    details: {
                        availableMethods: Array.from(this.handlers.keys())
                    }
                }
            };
        }
        return handler(request);
    }
    async start() {
        console.log(`${this.config.name} MCP Server v${this.config.version} started`);
    }
}
exports.MCPServer = MCPServer;
