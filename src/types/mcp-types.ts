import { JSONSchema7 } from 'json-schema';

// Core MCP Types
export interface MCPServerConfig {
  name: string;
  description: string;
  version: string;
  author: string;
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  details?: any;
}

// Enhanced Tool Definitions
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema7;
  returns: {
    type: string;
    description: string;
    schema: JSONSchema7;
  };
  examples: Array<{
    description: string;
    request: any;
    response: any;
  }>;
}

// Resource Management
export interface Resource {
  uri: string;
  type: string;
  description: string;
  schema: JSONSchema7;
  capabilities: string[];
  metadata: Record<string, any>;
}

export interface ResourceListResponse {
  resources: Resource[];
}

// Transport Layer
export interface TransportConfig {
  type: 'http' | 'sse' | 'websocket';
  endpoint: string;
  options: {
    headers?: Record<string, string>;
    timeout?: number;
    keepAlive?: boolean;
  };
}

// Prompt Templates
export interface PromptTemplate {
  name: string;
  description: string;
  inputSchema: JSONSchema7;
  outputSchema: JSONSchema7;
  template: string;
  examples: Array<{
    input: any;
    output: any;
  }>;
}

// Base MCP Server Class
export abstract class MCPServer {
  protected config: MCPServerConfig;
  protected tools: Map<string, ToolDefinition>;
  protected resources: Map<string, Resource>;
  protected prompts: Map<string, PromptTemplate>;
  protected transport: TransportConfig;

  constructor(config: MCPServerConfig, transport: TransportConfig) {
    this.config = config;
    this.transport = transport;
    this.tools = new Map();
    this.resources = new Map();
    this.prompts = new Map();
  }

  abstract handleRequest(request: MCPRequest): Promise<MCPResponse>;
  abstract start(): Promise<void>;

  protected registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  protected registerResource(resource: Resource): void {
    this.resources.set(resource.uri, resource);
  }

  protected registerPrompt(prompt: PromptTemplate): void {
    this.prompts.set(prompt.name, prompt);
  }

  protected getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  protected getResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  protected getPrompts(): PromptTemplate[] {
    return Array.from(this.prompts.values());
  }

  protected abstract executeTool(name: string, args: any): Promise<any>;
  protected abstract executePrompt(name: string, input: any): Promise<any>;
  protected abstract fetchResource(uri: string): Promise<any>;
} 