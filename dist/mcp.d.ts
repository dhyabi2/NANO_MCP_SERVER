/**
 * NanoMCP - NANO Model Context Protocol Server
 *
 * This implementation is specifically optimized for agentic transactions, providing:
 * - Instant finality for quick agent decision making
 * - Fee-less transactions for efficient resource allocation
 * - Scalable architecture for large agent networks
 * - Deterministic confirmation for reliable agent operations
 *
 * The NanoMCP class implements a full suite of NANO cryptocurrency operations
 * designed for AI agent interactions, ensuring reliable and efficient value transfer
 * between autonomous agents.
 */
import { MCPServer, MCPServerConfig } from './mcp-types';
import { NanoConfig } from './config/global';
export declare class NanoMCP extends MCPServer {
    private nano;
    constructor(customConfig?: Partial<MCPServerConfig>);
    /**
     * Initialize the MCP server with custom configuration
     * @param nanoConfig Custom NANO configuration parameters
     * @returns Promise that resolves when initialization is complete
     */
    static initialize(nanoConfig?: Partial<NanoConfig>): Promise<NanoMCP>;
    private initializeHandlers;
    private getBalance;
    private getAccountInfo;
    private getBlockCount;
    private getVersion;
    private convertToNano;
    private convertFromNano;
    private createAccount;
    /**
     * Optimized send transaction for agent-to-agent transfers
     * - Ensures immediate confirmation
     * - Provides detailed response for agent decision making
     * - Includes balance validation for resource management
     */
    private send;
    private receive;
    private receiveAll;
}
