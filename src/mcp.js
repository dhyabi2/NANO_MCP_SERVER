import { MCPServer } from './mcp-types.js';
import * as nanocurrency from 'nanocurrency';
import { WalletService } from './services/wallet-service.js';

export class NanoMCP extends MCPServer {
    constructor() {
        const config = {
            name: 'NANO',
            version: '1.0.0'
        };
        super(config);
        this.walletService = new WalletService();
        this.initializeHandlers();
    }

    initializeHandlers() {
        this.setRequestHandler('initialize', async () => {
            return {
                version: '1.0.0',
                capabilities: {
                    methods: [
                        'initialize',
                        'generateWallet',
                        'getBalance',
                        'initializeAccount',
                        'sendTransaction',
                        'receivePending'
                    ]
                }
            };
        });

        this.setRequestHandler('generateWallet', async () => {
            return await this.walletService.generateWallet();
        });

        this.setRequestHandler('getBalance', async (params) => {
            if (!params.address) {
                throw new Error('Address is required');
            }
            return await this.walletService.getBalance(params.address);
        });

        this.setRequestHandler('initializeAccount', async (params) => {
            if (!params.address || !params.privateKey) {
                throw new Error('Address and privateKey are required');
            }
            return await this.walletService.initializeAccount(params.address, params.privateKey);
        });

        this.setRequestHandler('sendTransaction', async (params) => {
            if (!params.fromAddress || !params.privateKey || !params.toAddress || !params.amountRaw) {
                throw new Error('fromAddress, privateKey, toAddress, and amountRaw are required');
            }
            return await this.walletService.sendTransaction(
                params.fromAddress,
                params.privateKey,
                params.toAddress,
                params.amountRaw
            );
        });

        this.setRequestHandler('receivePending', async (params) => {
            if (!params.address || !params.privateKey) {
                throw new Error('Address and privateKey are required');
            }
            return await this.walletService.receivePending(params.address, params.privateKey);
        });
    }

    async start() {
        try {
            console.log('Starting NANO MCP Server...');
            await super.start();
            console.log('NANO MCP Server started successfully');
        } catch (error) {
            console.error('Failed to start NANO MCP Server:', error);
            throw error;
        }
    }

    async getAccountInfo(request) {
        console.log('getAccountInfo called with:', request.params);
        const { account } = request.params;
        return { account };
    }

    async getBlockCount() {
        console.log('getBlockCount called');
        return { count: '0' };
    }

    async getVersion() {
        console.log('getVersion called');
        return { version: this.config.version };
    }

    async convertToNano(request) {
        console.log('convertToNano called with:', request.params);
        const { amount } = request.params;
        return { amount: nanocurrency.convert(amount, 'raw', 'NANO') };
    }

    async convertFromNano(request) {
        console.log('convertFromNano called with:', request.params);
        const { amount } = request.params;
        return { amount: nanocurrency.convert(amount, 'NANO', 'raw') };
    }
} 