import { MCPServer, MCPServerConfig, MCPRequest, MCPResponse, TransportConfig, ToolDefinition, PromptTemplate } from './types/mcp-types';
export declare abstract class EnhancedMCPServer extends MCPServer {
    private httpServer;
    private wsServer;
    private eventEmitter;
    private schemaValidator;
    constructor(config: MCPServerConfig, transport: TransportConfig);
    start(): Promise<void>;
    handleRequest(request: MCPRequest): Promise<MCPResponse>;
    private startHTTPServer;
    private startWebSocketServer;
    private startSSEServer;
    private handleToolsList;
    private handleResourcesList;
    private handlePromptsList;
    private handleToolCall;
    private handleResourceGet;
    private handlePromptExecute;
    protected createErrorResponse(id: string | number, error: any): MCPResponse;
    private validateAgainstSchema;
    protected registerTool(tool: ToolDefinition): void;
    protected registerPrompt(prompt: PromptTemplate): void;
    protected validateToolResult(name: string, result: unknown): void;
    protected validatePromptResult(name: string, result: unknown): void;
    protected abstract executeTool(name: string, args: any): Promise<any>;
    protected abstract executePrompt(name: string, input: any): Promise<any>;
    protected abstract fetchResource(uri: string): Promise<any>;
}
