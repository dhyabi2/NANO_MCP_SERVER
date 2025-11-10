const { NanoTransactions } = require('../../utils/nano-transactions');

/**
 * Isolated interface for handling pending receive operations
 * Uses the same MCP infrastructure but with dedicated endpoint
 */
class PendingReceiveInterface {
    constructor() {
        // Use the same NanoTransactions class but with isolated configuration
        this.nanoTransactions = new NanoTransactions({
            rpcNodes: [process.env.PENDING_RPC_URL || 'https://uk1.public.xnopay.com/proxy'],
            rpcKey: null, // No API key required for xnopay public node
            defaultRepresentative: process.env.PENDING_REPRESENTATIVE || 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf'
        });
    }

    /**
     * Handle JSON-RPC request for pending receive operations
     * @param {Object} request - JSON-RPC request object
     * @returns {Promise<Object>} JSON-RPC response object
     */
    async handleRequest(request) {
        try {
            const { method, params, id } = request;

            if (method !== 'pending/receive') {
                throw new Error('Method not supported. Use pending/receive');
            }

            if (!params.account || !params.privateKey) {
                throw new Error('Missing required parameters: account and privateKey');
            }

            // Use the existing receiveAllPending method from NanoTransactions
            const result = await this.nanoTransactions.receiveAllPending(
                params.account,
                params.privateKey
            );

            return {
                jsonrpc: "2.0",
                result: {
                    success: true,
                    ...result
                },
                id
            };
        } catch (error) {
            return {
                jsonrpc: "2.0",
                error: {
                    code: -32603,
                    message: error.message
                },
                id: request.id
            };
        }
    }
}

module.exports = new PendingReceiveInterface();