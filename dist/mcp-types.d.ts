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
export declare abstract class MCPServer {
    protected config: MCPServerConfig;
    protected handlers: Map<string, (request: MCPRequest) => Promise<MCPResponse>>;
    constructor(config: MCPServerConfig);
    handleRequest(request: MCPRequest): Promise<MCPResponse>;
    start(): Promise<void>;
}
