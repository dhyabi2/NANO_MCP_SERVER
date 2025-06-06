export type MCPMethod = (...args: any[]) => Promise<any>;

export interface MCPServerConfig {
  name: string;
  description: string;
  version: string;
  author: string;
}

export interface RPCConfig {
  nodeUrl: string;
  walletId?: string;
  apiKey?: string;
}

export interface MCPRequest<T = any> {
  jsonrpc: '2.0';
  method: string;
  params: T;
  id: string | number;
}

export interface MCPResponse<T = any> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number;
}

export type RequestHandler<T = any, R = any> = (request: MCPRequest<T>) => Promise<R>;

export abstract class MCPServer {
  protected config: MCPServerConfig;
  protected rpcConfig: RPCConfig;
  private handlers: Map<string, RequestHandler>;

  constructor(config: MCPServerConfig, rpcConfig?: RPCConfig) {
    this.config = config;
    this.rpcConfig = rpcConfig || {
      nodeUrl: 'https://proxy.nanos.cc/proxy'
    };
    this.handlers = new Map();
  }

  setRequestHandler<T = any, R = any>(method: string, handler: RequestHandler<T, R>): void {
    this.handlers.set(method, handler);
  }

  abstract handleRequest(method: string, params: any[]): Promise<any>;

  async start(): Promise<void> {
    console.log(`Starting ${this.config.name} MCP server v${this.config.version}`);
    // Implementation would handle stdio communication
  }

  protected async handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const handler = this.handlers.get(request.method);
      if (!handler) {
        throw new Error(`Method ${request.method} not found`);
      }

      const result = await handler(request);
      return {
        jsonrpc: '2.0',
        result,
        id: request.id,
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : String(error),
        },
        id: request.id,
      };
    }
  }
} 