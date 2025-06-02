import { MCPServer, MCPMethod } from './mcp-types.js';
import { rpcCall } from './rpc.js';
import { convert, Unit } from 'nanocurrency';

interface NanoBalance {
  balance: string;
  pending: string;
  receivable: string;
}

interface NanoAccountInfo {
  frontier: string;
  open_block: string;
  representative_block: string;
  balance: string;
  modified_timestamp: string;
  block_count: string;
  account_version: string;
  confirmation_height: string;
  confirmation_height_frontier: string;
}

export class NanoMCP extends MCPServer {
  private methods: Map<string, MCPMethod>;

  constructor() {
    super({
      name: 'nano',
      description: 'MCP server for NANO (XNO) cryptocurrency',
      version: '1.0.0',
      author: 'Your Name',
    });

    this.methods = new Map();

    // Register MCP methods
    this.methods.set('getBalance', this.getBalance.bind(this));
    this.methods.set('getAccountInfo', this.getAccountInfo.bind(this));
    this.methods.set('getBlockCount', this.getBlockCount.bind(this));
    this.methods.set('getVersion', this.getVersion.bind(this));
    this.methods.set('convertToNano', this.convertToNano.bind(this));
    this.methods.set('convertFromNano', this.convertFromNano.bind(this));
  }

  async getBalance(account: string): Promise<{ balanceNano: string; pendingNano: string }> {
    const response = await rpcCall('account_balance', { account }) as NanoBalance;
    
    return {
      balanceNano: convert(response.balance, { from: Unit.raw, to: Unit.NANO }),
      pendingNano: convert(response.pending, { from: Unit.raw, to: Unit.NANO }),
    };
  }

  async getAccountInfo(account: string): Promise<NanoAccountInfo> {
    return await rpcCall('account_info', { account }) as NanoAccountInfo;
  }

  async getBlockCount(): Promise<{ count: string; unchecked: string; cemented: string }> {
    return await rpcCall('block_count') as { count: string; unchecked: string; cemented: string };
  }

  async getVersion(): Promise<{
    rpc_version: string;
    node_vendor: string;
    network: string;
  }> {
    return await rpcCall('version') as {
      rpc_version: string;
      node_vendor: string;
      network: string;
    };
  }

  convertToNano(rawAmount: string): string {
    return convert(rawAmount, { from: Unit.raw, to: Unit.NANO });
  }

  convertFromNano(nanoAmount: string): string {
    return convert(nanoAmount, { from: Unit.NANO, to: Unit.raw });
  }

  // Override MCPServer method to handle requests
  async handleRequest(method: string, params: any[]): Promise<any> {
    const handler = this.methods.get(method);
    if (!handler) {
      throw new Error(`Method ${method} not found`);
    }
    return await handler(...params);
  }
} 