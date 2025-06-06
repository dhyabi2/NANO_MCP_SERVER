import { createServer, Server as HTTPServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocket, Server as WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import {
  MCPServer,
  MCPServerConfig,
  MCPRequest,
  MCPResponse,
  MCPError,
  TransportConfig,
  ToolDefinition,
  Resource,
  PromptTemplate
} from './types/mcp-types';
import { SchemaValidator } from './utils/schema-validator';

export abstract class EnhancedMCPServer extends MCPServer {
  private httpServer: HTTPServer | null = null;
  private wsServer: WebSocketServer | null = null;
  private eventEmitter: EventEmitter;
  private schemaValidator: SchemaValidator;

  constructor(config: MCPServerConfig, transport: TransportConfig) {
    super(config, transport);
    this.eventEmitter = new EventEmitter();
    this.schemaValidator = SchemaValidator.getInstance();
  }

  async start(): Promise<void> {
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

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
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
    } catch (error) {
      return this.createErrorResponse(request.id, error);
    }
  }

  private async startHTTPServer(): Promise<void> {
    this.httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: Buffer) => body += chunk);
        req.on('end', async () => {
          try {
            const request = JSON.parse(body) as MCPRequest;
            const response = await this.handleRequest(request);
            
            res.writeHead(200, {
              'Content-Type': 'application/json',
              ...this.transport.options.headers
            });
            res.end(JSON.stringify(response));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(this.createErrorResponse('0', error)));
          }
        });
      } else if (req.headers.accept === 'text/event-stream') {
        // Handle SSE
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        const sendEvent = (data: any) => {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        this.eventEmitter.on('message', sendEvent);
        req.on('close', () => {
          this.eventEmitter.off('message', sendEvent);
        });
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    });

    const [host, port] = this.transport.endpoint.split(':');
    this.httpServer.listen(parseInt(port), host);
  }

  private async startWebSocketServer(): Promise<void> {
    this.httpServer = createServer();
    this.wsServer = new WebSocketServer({ server: this.httpServer });

    this.wsServer.on('connection', (ws: WebSocket) => {
      ws.on('message', async (message: string) => {
        try {
          const request = JSON.parse(message) as MCPRequest;
          const response = await this.handleRequest(request);
          ws.send(JSON.stringify(response));
        } catch (error) {
          ws.send(JSON.stringify(this.createErrorResponse('0', error)));
        }
      });
    });

    const [host, port] = this.transport.endpoint.split(':');
    this.httpServer.listen(parseInt(port), host);
  }

  private async startSSEServer(): Promise<void> {
    // SSE is handled as part of the HTTP server
    await this.startHTTPServer();
  }

  private handleToolsList(id: string | number): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: this.getTools()
      }
    };
  }

  private handleResourcesList(id: string | number): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        resources: this.getResources()
      }
    };
  }

  private handlePromptsList(id: string | number): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        prompts: this.getPrompts()
      }
    };
  }

  private async handleToolCall(request: MCPRequest): Promise<MCPResponse> {
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

  private async handleResourceGet(request: MCPRequest): Promise<MCPResponse> {
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

  private async handlePromptExecute(request: MCPRequest): Promise<MCPResponse> {
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

  protected createErrorResponse(id: string | number, error: any): MCPResponse {
    const mcpError: MCPError = {
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

  private validateAgainstSchema(data: unknown, schema: any): void {
    try {
      this.schemaValidator.validate(data, schema);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Schema validation failed');
    }
  }

  protected override registerTool(tool: ToolDefinition): void {
    // Register tool's parameter schema
    this.schemaValidator.addSchema(tool.parameters, `tool:${tool.name}:params`);
    // Register tool's return schema
    this.schemaValidator.addSchema(tool.returns.schema, `tool:${tool.name}:returns`);
    super.registerTool(tool);
  }

  protected override registerPrompt(prompt: PromptTemplate): void {
    // Register prompt's input schema
    this.schemaValidator.addSchema(prompt.inputSchema, `prompt:${prompt.name}:input`);
    // Register prompt's output schema
    this.schemaValidator.addSchema(prompt.outputSchema, `prompt:${prompt.name}:output`);
    super.registerPrompt(prompt);
  }

  protected validateToolResult(name: string, result: unknown): void {
    const schema = this.schemaValidator.getSchema(`tool:${name}:returns`);
    if (schema) {
      this.validateAgainstSchema(result, schema);
    }
  }

  protected validatePromptResult(name: string, result: unknown): void {
    const schema = this.schemaValidator.getSchema(`prompt:${name}:output`);
    if (schema) {
      this.validateAgainstSchema(result, schema);
    }
  }

  // These methods must be implemented by derived classes
  protected abstract executeTool(name: string, args: any): Promise<any>;
  protected abstract executePrompt(name: string, input: any): Promise<any>;
  protected abstract fetchResource(uri: string): Promise<any>;
} 