export interface MCPServerConfig {
    name: string;
    description: string;
    version: string;
    author: string;
    features?: string[];
}

export interface MCPErrorResponse {
    code: number;
    message: string;
    details?: Record<string, any>;
}

export interface MCPRequest {
    method: string;
    params: Record<string, any>;
}

export interface MCPResponse {
    result?: any;
    error?: MCPErrorResponse;
}

export abstract class MCPServer {
    protected config: MCPServerConfig;
    protected handlers: Map<string, (request: MCPRequest) => Promise<MCPResponse>>;

    constructor(config: MCPServerConfig) {
        this.config = config;
        this.handlers = new Map();
    }

    public async handleRequest(request: MCPRequest): Promise<MCPResponse> {
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

    async start(): Promise<void> {
        console.log(`${this.config.name} MCP Server v${this.config.version} started`);
    }
} 