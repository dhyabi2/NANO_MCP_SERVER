"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
// Base MCP Server Class
class MCPServer {
    constructor(config, transport) {
        this.config = config;
        this.transport = transport;
        this.tools = new Map();
        this.resources = new Map();
        this.prompts = new Map();
    }
    registerTool(tool) {
        this.tools.set(tool.name, tool);
    }
    registerResource(resource) {
        this.resources.set(resource.uri, resource);
    }
    registerPrompt(prompt) {
        this.prompts.set(prompt.name, prompt);
    }
    getTools() {
        return Array.from(this.tools.values());
    }
    getResources() {
        return Array.from(this.resources.values());
    }
    getPrompts() {
        return Array.from(this.prompts.values());
    }
}
exports.MCPServer = MCPServer;
