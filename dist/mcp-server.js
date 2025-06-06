"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedMCPServer = void 0;
const http_1 = require("http");
const ws_1 = require("ws");
const events_1 = require("events");
const mcp_types_1 = require("./types/mcp-types");
const schema_validator_1 = require("./utils/schema-validator");
class EnhancedMCPServer extends mcp_types_1.MCPServer {
    constructor(config, transport) {
        super(config, transport);
        this.httpServer = null;
        this.wsServer = null;
        this.eventEmitter = new events_1.EventEmitter();
        this.schemaValidator = schema_validator_1.SchemaValidator.getInstance();
    }
    async start() {
        switch (this.transport.type) {
            case 'http':
                await this.startHTTPServer();
                break;
            case 'websocket':
                await this.startWebSocketServer();
                break;
            case 'sse':
                await this.startSSEServer();
                break;
            default:
                throw new Error(`Unsupported transport type: ${this.transport.type}`);
        }
        console.log(`${this.config.name} MCP Server v${this.config.version} started`);
        console.log(`Listening on ${this.transport.endpoint}`);
    }
    async handleRequest(request) {
        try {
            switch (request.method) {
                case 'tools.list':
                    return this.handleToolsList(request.id);
                case 'resources.list':
                    return this.handleResourcesList(request.id);
                case 'prompts.list':
                    return this.handlePromptsList(request.id);
                case 'tools.call':
                    return this.handleToolCall(request);
                case 'resources.get':
                    return this.handleResourceGet(request);
                case 'prompts.execute':
                    return this.handlePromptExecute(request);
                default:
                    throw new Error(`Method not found: ${request.method}`);
            }
        }
        catch (error) {
            return this.createErrorResponse(request.id, error);
        }
    }
    async startHTTPServer() {
        this.httpServer = (0, http_1.createServer)(async (req, res) => {
            if (req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => body += chunk);
                req.on('end', async () => {
                    try {
                        const request = JSON.parse(body);
                        const response = await this.handleRequest(request);
                        res.writeHead(200, {
                            'Content-Type': 'application/json',
                            ...this.transport.options.headers
                        });
                        res.end(JSON.stringify(response));
                    }
                    catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(this.createErrorResponse('0', error)));
                    }
                });
            }
            else if (req.headers.accept === 'text/event-stream') {
                // Handle SSE
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });
                const sendEvent = (data) => {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                };
                this.eventEmitter.on('message', sendEvent);
                req.on('close', () => {
                    this.eventEmitter.off('message', sendEvent);
                });
            }
            else {
                res.writeHead(405, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Method not allowed' }));
            }
        });
        const [host, port] = this.transport.endpoint.split(':');
        this.httpServer.listen(parseInt(port), host);
    }
    async startWebSocketServer() {
        this.httpServer = (0, http_1.createServer)();
        this.wsServer = new ws_1.Server({ server: this.httpServer });
        this.wsServer.on('connection', (ws) => {
            ws.on('message', async (message) => {
                try {
                    const request = JSON.parse(message);
                    const response = await this.handleRequest(request);
                    ws.send(JSON.stringify(response));
                }
                catch (error) {
                    ws.send(JSON.stringify(this.createErrorResponse('0', error)));
                }
            });
        });
        const [host, port] = this.transport.endpoint.split(':');
        this.httpServer.listen(parseInt(port), host);
    }
    async startSSEServer() {
        // SSE is handled as part of the HTTP server
        await this.startHTTPServer();
    }
    handleToolsList(id) {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                tools: this.getTools()
            }
        };
    }
    handleResourcesList(id) {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                resources: this.getResources()
            }
        };
    }
    handlePromptsList(id) {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                prompts: this.getPrompts()
            }
        };
    }
    async handleToolCall(request) {
        const { name, arguments: args } = request.params;
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }
        // Validate arguments against tool schema
        this.validateAgainstSchema(args, tool.parameters);
        // Execute tool logic
        const result = await this.executeTool(name, args);
        return {
            jsonrpc: '2.0',
            id: request.id,
            result
        };
    }
    async handleResourceGet(request) {
        const { uri } = request.params;
        const resource = this.resources.get(uri);
        if (!resource) {
            throw new Error(`Resource not found: ${uri}`);
        }
        // Execute resource fetch logic
        const result = await this.fetchResource(uri);
        return {
            jsonrpc: '2.0',
            id: request.id,
            result
        };
    }
    async handlePromptExecute(request) {
        const { name, input } = request.params;
        const prompt = this.prompts.get(name);
        if (!prompt) {
            throw new Error(`Prompt not found: ${name}`);
        }
        // Validate input against prompt schema
        this.validateAgainstSchema(input, prompt.inputSchema);
        // Execute prompt logic
        const result = await this.executePrompt(name, input);
        // Validate result against prompt output schema
        this.validateAgainstSchema(result, prompt.outputSchema);
        return {
            jsonrpc: '2.0',
            id: request.id,
            result
        };
    }
    createErrorResponse(id, error) {
        const mcpError = {
            code: -32000,
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error
        };
        return {
            jsonrpc: '2.0',
            id,
            error: mcpError
        };
    }
    validateAgainstSchema(data, schema) {
        try {
            this.schemaValidator.validate(data, schema);
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Schema validation failed');
        }
    }
    registerTool(tool) {
        // Register tool's parameter schema
        this.schemaValidator.addSchema(tool.parameters, `tool:${tool.name}:params`);
        // Register tool's return schema
        this.schemaValidator.addSchema(tool.returns.schema, `tool:${tool.name}:returns`);
        super.registerTool(tool);
    }
    registerPrompt(prompt) {
        // Register prompt's input schema
        this.schemaValidator.addSchema(prompt.inputSchema, `prompt:${prompt.name}:input`);
        // Register prompt's output schema
        this.schemaValidator.addSchema(prompt.outputSchema, `prompt:${prompt.name}:output`);
        super.registerPrompt(prompt);
    }
    validateToolResult(name, result) {
        const schema = this.schemaValidator.getSchema(`tool:${name}:returns`);
        if (schema) {
            this.validateAgainstSchema(result, schema);
        }
    }
    validatePromptResult(name, result) {
        const schema = this.schemaValidator.getSchema(`prompt:${name}:output`);
        if (schema) {
            this.validateAgainstSchema(result, schema);
        }
    }
}
exports.EnhancedMCPServer = EnhancedMCPServer;
