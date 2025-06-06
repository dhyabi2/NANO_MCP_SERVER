import { expect } from 'chai';
import { NanoMCP } from 'nano-mcp-server';

describe('NANO MCP Tests', () => {
    let mcp;

    before(async () => {
        mcp = new NanoMCP();
        await mcp.handleRequest({
            method: 'initialize',
            params: {
                rpcUrl: 'https://rpc.nano.to/',
                rpcKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
                gpuKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
                defaultRepresentative: 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4'
            }
        });
    });

    it('should initialize MCP correctly', () => {
        expect(mcp).to.exist;
    });

    it('should get version info', async () => {
        const response = await mcp.handleRequest({ method: 'getVersion' });
        expect(response.result).to.exist;
        expect(response.error).to.be.undefined;
        expect(response.result.rpc_version).to.exist;
        expect(response.result.store_version).to.exist;
    });

    it('should get block count', async () => {
        const response = await mcp.handleRequest({ method: 'getBlockCount' });
        expect(response.result).to.exist;
        expect(response.error).to.be.undefined;
        expect(response.result.count).to.exist;
        expect(response.result.count).to.be.a('string');
    });

    it('should validate account', async () => {
        const response = await mcp.handleRequest({
            method: 'validateAccount',
            params: {
                account: 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4'
            }
        });
        expect(response.result).to.exist;
        expect(response.error).to.be.undefined;
        expect(response.result.valid).to.be.true;
    });

    it('should handle invalid account validation', async () => {
        const response = await mcp.handleRequest({
            method: 'validateAccount',
            params: {
                account: 'invalid_account'
            }
        });
        expect(response.result).to.exist;
        expect(response.error).to.be.undefined;
        expect(response.result.valid).to.be.false;
    });

    it('should get account info', async () => {
        const response = await mcp.handleRequest({
            method: 'getAccountInfo',
            params: {
                account: 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4'
            }
        });
        expect(response.result).to.exist;
        expect(response.error).to.be.undefined;
    });
}); 