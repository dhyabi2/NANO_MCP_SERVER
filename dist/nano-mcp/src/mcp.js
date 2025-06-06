import { MCPServer } from './mcp-types.js';
import { rpcCall } from './rpc.js';
import { convert, Unit } from 'nanocurrency';
export class NanoMCP extends MCPServer {
    methods;
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
    async getBalance(account) {
        const response = await rpcCall('account_balance', { account });
        return {
            balanceNano: convert(response.balance, { from: Unit.raw, to: Unit.NANO }),
            pendingNano: convert(response.pending, { from: Unit.raw, to: Unit.NANO }),
        };
    }
    async getAccountInfo(account) {
        return await rpcCall('account_info', { account });
    }
    async getBlockCount() {
        return await rpcCall('block_count');
    }
    async getVersion() {
        return await rpcCall('version');
    }
    convertToNano(rawAmount) {
        return convert(rawAmount, { from: Unit.raw, to: Unit.NANO });
    }
    convertFromNano(nanoAmount) {
        return convert(nanoAmount, { from: Unit.NANO, to: Unit.raw });
    }
    // Override MCPServer method to handle requests
    async handleRequest(method, params) {
        const handler = this.methods.get(method);
        if (!handler) {
            throw new Error(`Method ${method} not found`);
        }
        return await handler(...params);
    }
}
