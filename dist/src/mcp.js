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
import { MCPServer } from './mcp-types';
import { NanoTransactions } from './utils/nano-transactions';
import { isValidXNOAddress } from './helpers/validators';
import { convert, Unit } from 'nanocurrency';
import { config } from './config/global';
export class NanoMCP extends MCPServer {
    nano;
    constructor(customConfig) {
        super({
            name: 'NANO',
            description: 'NANO cryptocurrency MCP server optimized for agentic transactions',
            version: '1.0.9',
            author: 'Chain Reaction',
            features: [
                'instant-finality',
                'fee-less',
                'scalable',
                'deterministic',
                'energy-efficient'
            ],
            ...customConfig
        });
        // Initialize configuration
        const validation = config.initializeConfig();
        if (!validation.isValid) {
            const configStatus = config.getConfigStatus();
            throw new Error(`Configuration validation failed:\n${configStatus}`);
        }
        // Initialize NanoTransactions with validated configuration
        this.nano = new NanoTransactions();
        // Log any configuration warnings
        if (validation.warnings.length > 0) {
            console.warn('Configuration warnings:', validation.warnings.join(', '));
        }
        this.initializeHandlers();
    }
    /**
     * Initialize the MCP server with custom configuration
     * @param nanoConfig Custom NANO configuration parameters
     * @returns Promise that resolves when initialization is complete
     */
    static async initialize(nanoConfig) {
        // Initialize global configuration first
        const validation = config.initializeConfig(nanoConfig);
        if (!validation.isValid) {
            const configStatus = config.getConfigStatus();
            throw new Error(`Configuration validation failed:\n${configStatus}`);
        }
        // Create and return new instance
        return new NanoMCP();
    }
    initializeHandlers() {
        this.handlers.set('getBalance', this.getBalance.bind(this));
        this.handlers.set('getAccountInfo', this.getAccountInfo.bind(this));
        this.handlers.set('getBlockCount', this.getBlockCount.bind(this));
        this.handlers.set('getVersion', this.getVersion.bind(this));
        this.handlers.set('convertToNano', this.convertToNano.bind(this));
        this.handlers.set('convertFromNano', this.convertFromNano.bind(this));
        this.handlers.set('createAccount', this.createAccount.bind(this));
        this.handlers.set('send', this.send.bind(this));
        this.handlers.set('receive', this.receive.bind(this));
        this.handlers.set('receiveAll', this.receiveAll.bind(this));
    }
    async getBalance(request) {
        const { account } = request.params;
        if (!isValidXNOAddress(account)) {
            return { error: { code: -32602, message: 'Invalid NANO address' } };
        }
        try {
            const info = await this.nano.getAccountInfo(account);
            if (info.error) {
                return { error: { code: -32000, message: info.error } };
            }
            return { result: info };
        }
        catch (error) {
            return { error: { code: -32000, message: error instanceof Error ? error.message : 'Unknown error' } };
        }
    }
    async getAccountInfo(request) {
        const { account } = request.params;
        if (!isValidXNOAddress(account)) {
            return { error: { code: -32602, message: 'Invalid NANO address' } };
        }
        try {
            const info = await this.nano.getAccountInfo(account);
            return { result: info };
        }
        catch (error) {
            return { error: { code: -32000, message: error instanceof Error ? error.message : 'Unknown error' } };
        }
    }
    async getBlockCount(request) {
        try {
            const info = await this.nano.getAccountInfo('nano_1111111111111111111111111111111111111111111111111111hifc8npp');
            return { result: { count: info.block_count || '0' } };
        }
        catch (error) {
            return { error: { code: -32000, message: error instanceof Error ? error.message : 'Unknown error' } };
        }
    }
    async getVersion() {
        return { result: { version: this.config.version } };
    }
    convertToNano(request) {
        const { amount } = request.params;
        try {
            const nanoAmount = convert(amount, { from: Unit.raw, to: Unit.NANO });
            return Promise.resolve({ result: { amount: nanoAmount } });
        }
        catch (error) {
            return Promise.resolve({ error: { code: -32000, message: 'Invalid amount' } });
        }
    }
    convertFromNano(request) {
        const { amount } = request.params;
        try {
            const rawAmount = convert(amount, { from: Unit.NANO, to: Unit.raw });
            return Promise.resolve({ result: { amount: rawAmount } });
        }
        catch (error) {
            return Promise.resolve({ error: { code: -32000, message: 'Invalid amount' } });
        }
    }
    async createAccount(request) {
        const { privateKey, sourceBlock, sourceAmount } = request.params;
        if (!privateKey || !sourceBlock || !sourceAmount) {
            return { error: { code: -32602, message: 'Missing required parameters' } };
        }
        try {
            const result = await this.nano.createOpenBlock(request.params.address, privateKey, sourceBlock, sourceAmount);
            return { result };
        }
        catch (error) {
            return { error: { code: -32000, message: error instanceof Error ? error.message : 'Unknown error' } };
        }
    }
    /**
     * Optimized send transaction for agent-to-agent transfers
     * - Ensures immediate confirmation
     * - Provides detailed response for agent decision making
     * - Includes balance validation for resource management
     */
    async send(request) {
        const { fromAddress, privateKey, toAddress, amount } = request.params;
        // Input validation
        if (!fromAddress || !privateKey || !toAddress || !amount) {
            return {
                error: {
                    code: -32602,
                    message: 'Missing required parameters',
                    details: {
                        missingFields: [
                            !fromAddress && 'fromAddress',
                            !privateKey && 'privateKey',
                            !toAddress && 'toAddress',
                            !amount && 'amount'
                        ].filter(Boolean)
                    }
                }
            };
        }
        if (!isValidXNOAddress(fromAddress) || !isValidXNOAddress(toAddress)) {
            return {
                error: {
                    code: -32602,
                    message: 'Invalid NANO address',
                    details: {
                        invalidAddresses: [
                            !isValidXNOAddress(fromAddress) && 'fromAddress',
                            !isValidXNOAddress(toAddress) && 'toAddress'
                        ].filter(Boolean)
                    }
                }
            };
        }
        try {
            // Get current account state
            const accountInfo = await this.nano.getAccountInfo(fromAddress);
            if (accountInfo.error) {
                return {
                    error: {
                        code: -32000,
                        message: accountInfo.error,
                        details: { accountState: accountInfo }
                    }
                };
            }
            // Validate balance before sending
            const currentBalance = convert(accountInfo.balance || '0', { from: Unit.raw, to: Unit.NANO });
            const sendAmount = parseFloat(amount);
            if (parseFloat(currentBalance) < sendAmount) {
                return {
                    error: {
                        code: -32000,
                        message: 'Insufficient balance',
                        details: {
                            currentBalance,
                            requestedAmount: amount,
                            shortfall: (sendAmount - parseFloat(currentBalance)).toFixed(6)
                        }
                    }
                };
            }
            // Process the send transaction
            const result = await this.nano.createSendBlock(fromAddress, privateKey, toAddress, amount, accountInfo);
            // Enhance response with transaction details for agent consumption
            return {
                result: {
                    ...result,
                    transactionDetails: {
                        timestamp: new Date().toISOString(),
                        confirmationTime: '< 1 second',
                        fee: '0',
                        newBalance: convert(result.balance || '0', { from: Unit.raw, to: Unit.NANO })
                    }
                }
            };
        }
        catch (error) {
            return {
                error: {
                    code: -32000,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    details: { timestamp: new Date().toISOString() }
                }
            };
        }
    }
    async receive(request) {
        const { address, privateKey, sourceBlock, sourceAmount } = request.params;
        if (!address || !privateKey || !sourceBlock || !sourceAmount) {
            return {
                error: {
                    code: -32602,
                    message: 'Missing required parameters',
                    details: {
                        missingFields: [
                            !address && 'address',
                            !privateKey && 'privateKey',
                            !sourceBlock && 'sourceBlock',
                            !sourceAmount && 'sourceAmount'
                        ].filter(Boolean)
                    }
                }
            };
        }
        if (!isValidXNOAddress(address)) {
            return {
                error: {
                    code: -32602,
                    message: 'Invalid NANO address',
                    details: { invalidAddress: address }
                }
            };
        }
        try {
            const accountInfo = await this.nano.getAccountInfo(address);
            if (accountInfo.error && accountInfo.error !== 'Account not found') {
                return {
                    error: {
                        code: -32000,
                        message: accountInfo.error,
                        details: { accountState: accountInfo }
                    }
                };
            }
            let result;
            if (accountInfo.error === 'Account not found') {
                result = await this.nano.createOpenBlock(address, privateKey, sourceBlock, sourceAmount);
            }
            else {
                // Use receiveAllPending for receiving blocks
                result = await this.nano.receiveAllPending(address, privateKey);
            }
            return {
                result: {
                    ...result,
                    transactionDetails: {
                        timestamp: new Date().toISOString(),
                        confirmationTime: '< 1 second',
                        fee: '0'
                    }
                }
            };
        }
        catch (error) {
            return {
                error: {
                    code: -32000,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    details: { timestamp: new Date().toISOString() }
                }
            };
        }
    }
    async receiveAll(request) {
        const { address, privateKey } = request.params;
        if (!address || !privateKey) {
            return { error: { code: -32602, message: 'Missing required parameters' } };
        }
        if (!isValidXNOAddress(address)) {
            return { error: { code: -32602, message: 'Invalid NANO address' } };
        }
        try {
            const result = await this.nano.receiveAllPending(address, privateKey);
            return { result };
        }
        catch (error) {
            return { error: { code: -32000, message: error instanceof Error ? error.message : 'Unknown error' } };
        }
    }
}
