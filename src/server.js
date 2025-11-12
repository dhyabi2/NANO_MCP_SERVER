const http = require('http');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const { NanoTransactions } = require('../utils/nano-transactions');
const { SchemaValidator } = require('../utils/schema-validator');
const { TestWalletManager } = require('../utils/test-wallet-manager');
const { BalanceConverter } = require('../utils/balance-converter');
const { EnhancedErrorHandler } = require('../utils/error-handler');
const { schemaProvider } = require('../utils/schema-provider');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const DEFAULT_PORT = 8080;

/**
 * Request templates for each method to help users with correct format
 */
const REQUEST_TEMPLATES = {
    generateWallet: {
        jsonrpc: "2.0",
        method: "generateWallet",
        params: {},
        id: 1
    },
    getBalance: {
        jsonrpc: "2.0",
        method: "getBalance",
        params: {
            address: "nano_3xxxxx..."
        },
        id: 1
    },
    getAccountInfo: {
        jsonrpc: "2.0",
        method: "getAccountInfo",
        params: {
            address: "nano_3xxxxx..."
        },
        id: 1
    },
    getPendingBlocks: {
        jsonrpc: "2.0",
        method: "getPendingBlocks",
        params: {
            address: "nano_3xxxxx..."
        },
        id: 1
    },
    initializeAccount: {
        jsonrpc: "2.0",
        method: "initializeAccount",
        params: {
            address: "nano_3xxxxx...",
            privateKey: "your_private_key_here"
        },
        id: 1
    },
    sendTransaction: {
        jsonrpc: "2.0",
        method: "sendTransaction",
        params: {
            fromAddress: "nano_3xxxxx...",
            toAddress: "nano_1xxxxx...",
            amountRaw: "1000000000000000000000000000",
            privateKey: "your_private_key_here"
        },
        id: 1
    },
    receiveAllPending: {
        jsonrpc: "2.0",
        method: "receiveAllPending",
        params: {
            address: "nano_3xxxxx...",
            privateKey: "your_private_key_here"
        },
        id: 1
    },
    generateQrCode: {
        jsonrpc: "2.0",
        method: "generateQrCode",
        params: {
            address: "nano_3xxxxx...",
            amount: "0.1"
        },
        id: 1
    },
    setupTestWallets: {
        jsonrpc: "2.0",
        method: "setupTestWallets",
        params: {},
        id: 1
    },
    getTestWallets: {
        jsonrpc: "2.0",
        method: "getTestWallets",
        params: {
            includePrivateKeys: true
        },
        id: 1
    },
    updateTestWalletBalance: {
        jsonrpc: "2.0",
        method: "updateTestWalletBalance",
        params: {
            walletIdentifier: "wallet1",
            balance: "1000000000000000000000000000"
        },
        id: 1
    },
    checkTestWalletsFunding: {
        jsonrpc: "2.0",
        method: "checkTestWalletsFunding",
        params: {},
        id: 1
    },
    resetTestWallets: {
        jsonrpc: "2.0",
        method: "resetTestWallets",
        params: {},
        id: 1
    },
    convertBalance: {
        jsonrpc: "2.0",
        method: "convertBalance",
        params: {
            amount: "100000000000000000000000000",
            from: "raw",
            to: "nano"
        },
        id: 1
    },
    getAccountStatus: {
        jsonrpc: "2.0",
        method: "getAccountStatus",
        params: {
            address: "nano_3xxxxx..."
        },
        id: 1
    }
};

/**
 * Tool definitions for the MCP server
 * Each tool includes its name, description, and input schema
 */
const MCP_TOOLS = [
    {
        name: 'initialize',
        description: 'Initialize the MCP server and get available capabilities',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'generateWallet',
        description: 'Generate a new NANO wallet with address and private key',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'getBalance',
        description: 'Get the balance and pending amounts for a NANO address',
        inputSchema: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'NANO address to check balance for'
                }
            },
            required: ['address']
        }
    },
    {
        name: 'getAccountInfo',
        description: 'Get detailed account information for a NANO address',
        inputSchema: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'NANO address to get information for'
                }
            },
            required: ['address']
        }
    },
    {
        name: 'getPendingBlocks',
        description: 'Get pending blocks (incoming transactions) for a NANO address',
        inputSchema: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'NANO address to get pending blocks for'
                }
            },
            required: ['address']
        }
    },
    {
        name: 'initializeAccount',
        description: 'Initialize a NANO account by publishing the first receive block',
        inputSchema: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'NANO address to initialize'
                },
                privateKey: {
                    type: 'string',
                    description: 'Private key of the NANO address'
                }
            },
            required: ['address', 'privateKey']
        }
    },
    {
        name: 'sendTransaction',
        description: 'Send NANO from one address to another',
        inputSchema: {
            type: 'object',
            properties: {
                fromAddress: {
                    type: 'string',
                    description: 'NANO address to send from'
                },
                toAddress: {
                    type: 'string',
                    description: 'NANO address to send to'
                },
                amountRaw: {
                    type: 'string',
                    description: 'Amount to send in raw units'
                },
                privateKey: {
                    type: 'string',
                    description: 'Private key of the sending address'
                }
            },
            required: ['fromAddress', 'toAddress', 'amountRaw', 'privateKey']
        }
    },
    {
        name: 'receiveAllPending',
        description: 'Receive all pending transactions for a NANO address',
        inputSchema: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'NANO address to receive pending transactions for'
                },
                privateKey: {
                    type: 'string',
                    description: 'Private key of the NANO address'
                }
            },
            required: ['address', 'privateKey']
        }
    },
    {
        name: 'generateQrCode',
        description: 'Generate a QR code for a NANO payment with address and amount',
        inputSchema: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'NANO address to receive payment'
                },
                amount: {
                    type: 'string',
                    description: 'Amount in decimal XNO (e.g., "0.1" for 0.1 NANO)'
                }
            },
            required: ['address', 'amount']
        }
    },
    {
        name: 'setupTestWallets',
        description: 'Generate two test wallets for integration testing. Saves wallets with private keys and prompts user to fund them with test NANO.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'getTestWallets',
        description: 'Retrieve existing test wallets with their addresses, balances, and funding status',
        inputSchema: {
            type: 'object',
            properties: {
                includePrivateKeys: {
                    type: 'boolean',
                    description: 'Whether to include private keys in the response (default: true)'
                }
            },
            required: []
        }
    },
    {
        name: 'updateTestWalletBalance',
        description: 'Update the balance and funding status for a test wallet (used after checking on-chain balance)',
        inputSchema: {
            type: 'object',
            properties: {
                walletIdentifier: {
                    type: 'string',
                    description: 'Wallet identifier: "wallet1" or "wallet2"'
                },
                balance: {
                    type: 'string',
                    description: 'New balance in raw units'
                }
            },
            required: ['walletIdentifier', 'balance']
        }
    },
    {
        name: 'checkTestWalletsFunding',
        description: 'Check the funding status of both test wallets to determine if they are ready for testing',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'resetTestWallets',
        description: 'Delete existing test wallets to start fresh with new wallet generation',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'convertBalance',
        description: 'Convert between NANO and raw units. Helps autonomous agents with amount formatting.',
        inputSchema: {
            type: 'object',
            properties: {
                amount: {
                    type: 'string',
                    description: 'Amount to convert'
                },
                from: {
                    type: 'string',
                    description: 'Source unit: "nano" or "raw"'
                },
                to: {
                    type: 'string',
                    description: 'Target unit: "nano" or "raw"'
                }
            },
            required: ['amount', 'from', 'to']
        }
    },
    {
        name: 'getAccountStatus',
        description: 'Get comprehensive account status with readiness checks, pending blocks, and actionable recommendations for autonomous agents',
        inputSchema: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'NANO address to check status for'
                }
            },
            required: ['address']
        }
    }
];

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: Get API documentation
 *     description: Returns the Swagger UI documentation
 *     responses:
 *       200:
 *         description: API documentation
 */
/**
 * @swagger
 * /tools/list:
 *   get:
 *     summary: Get list of available tools
 *     description: Returns a list of all available tools and their schemas
 *     responses:
 *       200:
 *         description: List of tools
 */
/**
 * NANO MCP (NANO Cryptocurrency) Server implementation
 * Provides a JSON-RPC 2.0 interface for interacting with the NANO network
 * Supports both HTTP and stdio transports
 */
class NanoMCPServer {
    /**
     * Creates a new NANO MCP Server instance
     * @param {Object} config - Server configuration
     * @param {number} [config.port=3000] - HTTP server port
     * @param {string} [config.apiUrl='https://rpc.nano.to'] - NANO RPC node URL
     * @param {string} [config.rpcKey] - API key for authenticated RPC nodes
     * @param {string} [config.defaultRepresentative] - Default representative for new accounts
     */
    constructor(config = {}) {
        this.config = {
            port: process.env.MCP_PORT || 8080,
            apiUrl: process.env.NANO_RPC_URL || 'https://rpc.nano.to',
            rpcKey: process.env.NANO_RPC_KEY || 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
            defaultRepresentative: process.env.NANO_REPRESENTATIVE || 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf',
            ...config
        };
        this.nanoTransactions = new NanoTransactions(this.config);
        this.schemaValidator = SchemaValidator.getInstance();
        this.testWalletManager = new TestWalletManager();
    }

    /**
     * Handles incoming JSON-RPC requests
     * @param {Object} request - JSON-RPC request object
     * @param {string} request.method - Method name to execute
     * @param {Object} request.params - Method parameters
     * @param {number} request.id - Request identifier
     * @returns {Promise<Object>} JSON-RPC response object
     * @throws {Error} When method is not found or parameters are invalid
     */
    async handleRequest(request) {
        try {
            const { method, params, id } = request;
            let result;

            switch (method) {
                case 'tools/list':
                    result = {
                        tools: MCP_TOOLS
                    };
                    break;
                case 'initialize':
                    result = {
                        version: "1.0.0",
                        capabilities: {
                            methods: MCP_TOOLS.map(tool => tool.name)
                        }
                    };
                    break;
                case 'generateWallet':
                    result = await this.nanoTransactions.generateWallet();
                    break;
                case 'getBalance':
                    // Validate address parameter
                    if (!params || !params.address) {
                        return EnhancedErrorHandler.missingParameter('address', 'getBalance', {
                            address: "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn"
                        });
                    }
                    
                    const balanceAddressError = EnhancedErrorHandler.validateAddress(params.address, 'address');
                    if (balanceAddressError) {
                        return balanceAddressError;
                    }
                    
                    const balanceInfo = await this.nanoTransactions.getAccountInfo(params.address);
                    result = {
                        balance: balanceInfo.balance || '0',
                        pending: balanceInfo.pending || '0'
                    };
                    break;
                case 'getAccountInfo':
                    // Validate address parameter
                    if (!params || !params.address) {
                        return EnhancedErrorHandler.missingParameter('address', 'getAccountInfo', {
                            address: "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn"
                        });
                    }
                    
                    const accountInfoAddressError = EnhancedErrorHandler.validateAddress(params.address, 'address');
                    if (accountInfoAddressError) {
                        return accountInfoAddressError;
                    }
                    
                    result = await this.nanoTransactions.getAccountInfo(params.address);
                    break;
                case 'getPendingBlocks':
                    // Validate address parameter
                    if (!params || !params.address) {
                        return EnhancedErrorHandler.missingParameter('address', 'getPendingBlocks', {
                            address: "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn"
                        });
                    }
                    
                    const pendingAddressError = EnhancedErrorHandler.validateAddress(params.address, 'address');
                    if (pendingAddressError) {
                        return pendingAddressError;
                    }
                    
                    result = await this.nanoTransactions.getPendingBlocks(params.address);
                    break;
                case 'initializeAccount':
                    // Validate address parameter
                    if (!params || !params.address) {
                        return EnhancedErrorHandler.missingParameter('address', 'initializeAccount', {
                            address: "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn",
                            privateKey: "your_private_key_here"
                        });
                    }
                    
                    const initAddressError = EnhancedErrorHandler.validateAddress(params.address, 'address');
                    if (initAddressError) {
                        return initAddressError;
                    }
                    
                    // Validate privateKey parameter
                    if (!params.privateKey) {
                        return EnhancedErrorHandler.missingParameter('privateKey', 'initializeAccount', {
                            address: params.address,
                            privateKey: "your_64_character_hexadecimal_private_key"
                        });
                    }
                    
                    const initKeyError = EnhancedErrorHandler.validatePrivateKey(params.privateKey);
                    if (initKeyError) {
                        return initKeyError;
                    }
                    
                    result = await this.nanoTransactions.initializeAccount(params.address, params.privateKey);
                    break;
                case 'sendTransaction':
                    // Validate fromAddress parameter
                    if (!params || !params.fromAddress) {
                        return EnhancedErrorHandler.missingParameter('fromAddress', 'sendTransaction', {
                            fromAddress: "nano_3sender_address_here",
                            toAddress: "nano_3receiver_address_here",
                            amountRaw: "100000000000000000000000000000",
                            privateKey: "your_private_key_here"
                        });
                    }
                    
                    const fromAddressError = EnhancedErrorHandler.validateAddress(params.fromAddress, 'fromAddress');
                    if (fromAddressError) {
                        return fromAddressError;
                    }
                    
                    // Validate toAddress parameter
                    if (!params.toAddress) {
                        return EnhancedErrorHandler.missingParameter('toAddress', 'sendTransaction', {
                            fromAddress: params.fromAddress,
                            toAddress: "nano_3receiver_address_here",
                            amountRaw: "100000000000000000000000000000",
                            privateKey: "your_private_key_here"
                        });
                    }
                    
                    const toAddressError = EnhancedErrorHandler.validateAddress(params.toAddress, 'toAddress');
                    if (toAddressError) {
                        return toAddressError;
                    }
                    
                    // Validate amountRaw parameter
                    if (!params.amountRaw) {
                        return EnhancedErrorHandler.missingParameter('amountRaw', 'sendTransaction', {
                            fromAddress: params.fromAddress,
                            toAddress: params.toAddress,
                            amountRaw: "100000000000000000000000000000",
                            privateKey: "your_private_key_here"
                        });
                    }
                    
                    const amountError = EnhancedErrorHandler.validateAmountRaw(params.amountRaw, 'amountRaw');
                    if (amountError) {
                        return amountError;
                    }
                    
                    // Validate privateKey parameter
                    if (!params.privateKey) {
                        return EnhancedErrorHandler.missingParameter('privateKey', 'sendTransaction', {
                            fromAddress: params.fromAddress,
                            toAddress: params.toAddress,
                            amountRaw: params.amountRaw,
                            privateKey: "your_64_character_hexadecimal_private_key"
                        });
                    }
                    
                    const sendKeyError = EnhancedErrorHandler.validatePrivateKey(params.privateKey);
                    if (sendKeyError) {
                        return sendKeyError;
                    }
                    
                    result = await this.nanoTransactions.sendTransaction(
                        params.fromAddress,
                        params.privateKey,
                        params.toAddress,
                        params.amountRaw
                    );
                    break;
                case 'receiveAllPending':
                    // Validate address parameter
                    if (!params || !params.address) {
                        return EnhancedErrorHandler.missingParameter('address', 'receiveAllPending', {
                            address: "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn",
                            privateKey: "your_private_key_here"
                        });
                    }
                    
                    const receiveAddressError = EnhancedErrorHandler.validateAddress(params.address, 'address');
                    if (receiveAddressError) {
                        return receiveAddressError;
                    }
                    
                    // Validate privateKey parameter
                    if (!params.privateKey) {
                        return EnhancedErrorHandler.missingParameter('privateKey', 'receiveAllPending', {
                            address: params.address,
                            privateKey: "your_64_character_hexadecimal_private_key"
                        });
                    }
                    
                    const receiveKeyError = EnhancedErrorHandler.validatePrivateKey(params.privateKey);
                    if (receiveKeyError) {
                        return receiveKeyError;
                    }
                    
                    result = await this.nanoTransactions.receiveAllPending(params.address, params.privateKey);
                    break;
                case 'generateQrCode':
                    // Validate address parameter
                    if (!params || !params.address) {
                        return EnhancedErrorHandler.missingParameter('address', 'generateQrCode', {
                            address: "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn",
                            amount: "0.1"
                        });
                    }
                    
                    const qrAddressError = EnhancedErrorHandler.validateAddress(params.address, 'address');
                    if (qrAddressError) {
                        return qrAddressError;
                    }
                    
                    // Validate amount parameter (in NANO format)
                    if (!params.amount) {
                        return EnhancedErrorHandler.missingParameter('amount', 'generateQrCode', {
                            address: params.address,
                            amount: "0.1"
                        });
                    }
                    
                    if (typeof params.amount !== 'string') {
                        return {
                            success: false,
                            error: "Invalid amount parameter",
                            errorCode: "INVALID_AMOUNT_TYPE",
                            details: {
                                parameter: "amount",
                                providedValue: params.amount,
                                providedType: typeof params.amount,
                                expectedType: "string",
                                expectedFormat: "Decimal string in NANO (e.g., '0.1', '1.5')"
                            },
                            nextSteps: [
                                "Step 1: Provide amount as a string",
                                "Step 2: Amount should be in NANO format (decimal allowed)",
                                "Step 3: Examples: '0.1', '1.0', '5.5'",
                                "Step 4: Do NOT use raw format for QR codes"
                            ],
                            exampleRequest: {
                                jsonrpc: "2.0",
                                method: "generateQrCode",
                                params: {
                                    address: params.address,
                                    amount: "0.1"
                                },
                                id: 1
                            }
                        };
                    }
                    
                    // Validate amount is a valid decimal
                    if (!/^\d+\.?\d*$/.test(params.amount.trim())) {
                        return {
                            success: false,
                            error: "Invalid amount format for QR code",
                            errorCode: "INVALID_QR_AMOUNT_FORMAT",
                            details: {
                                parameter: "amount",
                                providedValue: params.amount,
                                expectedFormat: "Decimal string in NANO (e.g., '0.1', '1.5')",
                                issue: "Amount must be a valid decimal number"
                            },
                            nextSteps: [
                                "Step 1: Use decimal NANO format (not raw)",
                                "Step 2: Examples: '0.1', '1.0', '5.5', '100'",
                                "Step 3: No special characters except decimal point",
                                "Step 4: Amount must be positive"
                            ],
                            exampleRequest: {
                                jsonrpc: "2.0",
                                method: "generateQrCode",
                                params: {
                                    address: params.address,
                                    amount: "0.1"
                                },
                                id: 1
                            }
                        };
                    }
                    
                    result = await this.nanoTransactions.generateQrCode(params.address, params.amount);
                    break;
                case 'setupTestWallets':
                    result = await this.testWalletManager.generateTestWallets();
                    break;
                case 'getTestWallets':
                    const includePrivateKeys = params.includePrivateKeys !== undefined ? params.includePrivateKeys : true;
                    const wallets = await this.testWalletManager.getTestWallets(includePrivateKeys);
                    if (!wallets) {
                        result = {
                            exists: false,
                            message: 'No test wallets found. Use setupTestWallets to generate new wallets.'
                        };
                    } else {
                        result = {
                            exists: true,
                            ...wallets
                        };
                    }
                    break;
                case 'updateTestWalletBalance':
                    this.schemaValidator.validate(params, {
                        type: 'object',
                        required: ['walletIdentifier', 'balance'],
                        properties: {
                            walletIdentifier: { type: 'string' },
                            balance: { type: 'string' }
                        }
                    });
                    result = await this.testWalletManager.updateWalletBalance(params.walletIdentifier, params.balance);
                    break;
                case 'checkTestWalletsFunding':
                    result = await this.testWalletManager.checkFundingStatus();
                    break;
                case 'resetTestWallets':
                    result = await this.testWalletManager.resetTestWallets();
                    break;
                case 'convertBalance':
                    // Validate amount parameter
                    if (!params || !params.amount) {
                        return EnhancedErrorHandler.missingParameter('amount', 'convertBalance', {
                            amount: "0.1",
                            from: "nano",
                            to: "raw"
                        });
                    }
                    
                    if (typeof params.amount !== 'string') {
                        return {
                            success: false,
                            error: "Invalid amount parameter",
                            errorCode: "INVALID_AMOUNT_TYPE",
                            details: {
                                parameter: "amount",
                                providedType: typeof params.amount,
                                expectedType: "string"
                            },
                            nextSteps: [
                                "Step 1: Provide amount as a string",
                                "Step 2: Example: '0.1' or '100000000000000000000000000000'",
                                "Step 3: Do not use number type, use string"
                            ]
                        };
                    }
                    
                    // Validate from parameter
                    if (!params.from) {
                        return EnhancedErrorHandler.missingParameter('from', 'convertBalance', {
                            amount: params.amount,
                            from: "nano",
                            to: "raw"
                        });
                    }
                    
                    // Validate to parameter
                    if (!params.to) {
                        return EnhancedErrorHandler.missingParameter('to', 'convertBalance', {
                            amount: params.amount,
                            from: params.from,
                            to: "raw"
                        });
                    }
                    
                    const from = params.from.toLowerCase();
                    const to = params.to.toLowerCase();
                    
                    // Validate from and to values
                    if (!['nano', 'raw'].includes(from) || !['nano', 'raw'].includes(to)) {
                        return {
                            success: false,
                            error: "Invalid conversion units",
                            errorCode: "INVALID_CONVERSION_UNITS",
                            details: {
                                providedFrom: params.from,
                                providedTo: params.to,
                                allowedValues: ['nano', 'raw']
                            },
                            nextSteps: [
                                "Step 1: 'from' parameter must be either 'nano' or 'raw'",
                                "Step 2: 'to' parameter must be either 'nano' or 'raw'",
                                "Step 3: Supported conversions: nano→raw or raw→nano",
                                "Step 4: Parameter values are case-insensitive"
                            ],
                            exampleRequests: [
                                {
                                    description: "Convert NANO to raw",
                                    request: {
                                        jsonrpc: "2.0",
                                        method: "convertBalance",
                                        params: { amount: "0.1", from: "nano", to: "raw" },
                                        id: 1
                                    }
                                },
                                {
                                    description: "Convert raw to NANO",
                                    request: {
                                        jsonrpc: "2.0",
                                        method: "convertBalance",
                                        params: { amount: "100000000000000000000000000000", from: "raw", to: "nano" },
                                        id: 1
                                    }
                                }
                            ]
                        };
                    }
                    
                    if (from === to) {
                        return {
                            success: false,
                            error: "Conversion units are the same",
                            errorCode: "SAME_CONVERSION_UNITS",
                            details: {
                                from: from,
                                to: to,
                                issue: "Cannot convert to the same unit"
                            },
                            nextSteps: [
                                "Step 1: 'from' and 'to' must be different units",
                                "Step 2: Use 'nano' and 'raw' for conversion",
                                "Step 3: Example: from='nano' to='raw' or from='raw' to='nano'"
                            ]
                        };
                    }
                    
                    try {
                        if (from === 'nano' && to === 'raw') {
                            const raw = BalanceConverter.nanoToRaw(params.amount);
                            result = {
                                original: params.amount,
                                originalUnit: 'NANO',
                                converted: raw,
                                convertedUnit: 'raw',
                                formula: 'raw = NANO × 10^30'
                            };
                        } else if (from === 'raw' && to === 'nano') {
                            const nano = BalanceConverter.rawToNano(params.amount);
                            result = {
                                original: params.amount,
                                originalUnit: 'raw',
                                converted: nano,
                                convertedUnit: 'NANO',
                                formula: 'NANO = raw ÷ 10^30'
                            };
                        }
                    } catch (error) {
                        return {
                            success: false,
                            error: "Conversion failed",
                            errorCode: "CONVERSION_ERROR",
                            details: {
                                originalError: error.message,
                                amount: params.amount,
                                from: from,
                                to: to
                            },
                            nextSteps: [
                                "Step 1: Verify the amount format is correct",
                                "Step 2: For NANO: use decimal format (e.g., '0.1', '1.5')",
                                "Step 3: For raw: use integer string (e.g., '100000000000000000000000000000')",
                                "Step 4: Ensure amount is positive and within valid range"
                            ]
                        };
                    }
                    break;
                case 'getAccountStatus':
                    // Validate address parameter
                    if (!params || !params.address) {
                        return EnhancedErrorHandler.missingParameter('address', 'getAccountStatus', {
                            address: "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn"
                        });
                    }
                    
                    const statusAddressError = EnhancedErrorHandler.validateAddress(params.address, 'address');
                    if (statusAddressError) {
                        return statusAddressError;
                    }
                    
                    // Get comprehensive account status
                    let accountInfo;
                    try {
                        accountInfo = await this.nanoTransactions.getAccountInfo(params.address);
                    } catch (error) {
                        accountInfo = { error: 'Account not found' };
                    }
                    
                    const pendingBlocks = await this.nanoTransactions.getPendingBlocks(params.address);
                    const hasPending = pendingBlocks.blocks && Object.keys(pendingBlocks.blocks).length > 0;
                    let pendingCount = 0;
                    let totalPending = BigInt(0);
                    
                    if (hasPending) {
                        pendingCount = Object.keys(pendingBlocks.blocks).length;
                        for (const block of Object.values(pendingBlocks.blocks)) {
                            totalPending += BigInt(block.amount);
                        }
                    }
                    
                    const initialized = !accountInfo.error;
                    const balance = initialized ? accountInfo.balance : '0';
                    const canSend = initialized && BigInt(balance) > 0;
                    const canReceive = true; // Can always receive
                    const needsAction = [];
                    
                    if (!initialized && hasPending) {
                        needsAction.push({
                            action: 'initializeAccount',
                            reason: 'Account not initialized but has pending blocks',
                            priority: 'high'
                        });
                    }
                    
                    if (initialized && hasPending) {
                        needsAction.push({
                            action: 'receiveAllPending',
                            reason: `${pendingCount} pending block(s) waiting to be received`,
                            priority: 'medium'
                        });
                    }
                    
                    if (!initialized && !hasPending) {
                        needsAction.push({
                            action: 'fundAccount',
                            reason: 'Account has no balance and no pending blocks',
                            priority: 'high'
                        });
                    }
                    
                    result = {
                        address: params.address,
                        initialized: initialized,
                        balance: {
                            raw: balance,
                            nano: BalanceConverter.rawToNano(balance)
                        },
                        pending: {
                            count: pendingCount,
                            totalAmount: totalPending.toString(),
                            totalAmountNano: BalanceConverter.rawToNano(totalPending.toString())
                        },
                        capabilities: {
                            canSend: canSend,
                            canReceive: canReceive
                        },
                        needsAction: needsAction,
                        readyForTesting: initialized && canSend,
                        recommendations: needsAction.length === 0 
                            ? ['Account is ready for transactions'] 
                            : needsAction.map(a => `${a.priority.toUpperCase()}: ${a.action} - ${a.reason}`)
                    };
                    break;
                default:
                    return EnhancedErrorHandler.methodNotFound(method, MCP_TOOLS.map(t => t.name));
            }

            return {
                jsonrpc: "2.0",
                result,
                id
            };
        } catch (error) {
            // Determine error type and provide helpful template
            let errorCode = -32603; // Internal error
            let errorMessage = error.message || 'Internal server error';
            let helpfulInfo = {};

            // Check for schema validation errors (from SchemaValidator)
            if (error.code === -32602 || error.message === 'Invalid parameters') {
                errorCode = -32602; // Invalid params
                const method = request.method;
                
                // Extract validation details
                if (error.details && error.details.errors) {
                    errorMessage = 'Invalid parameters: ';
                    const missingFields = error.details.errors
                        .filter(e => e.message && e.message.includes('required'))
                        .map(e => e.params?.missingProperty || 'unknown');
                    
                    if (missingFields.length > 0) {
                        errorMessage += `Missing required field(s): ${missingFields.join(', ')}`;
                    } else {
                        errorMessage += error.details.errors.map(e => e.message).join(', ');
                    }
                }
                
                if (REQUEST_TEMPLATES[method]) {
                    helpfulInfo = {
                        correctFormat: REQUEST_TEMPLATES[method],
                        hint: `Please use the correct format shown in 'correctFormat'. Ensure all required parameters are included.`,
                        yourRequest: {
                            method: method,
                            params: request.params || {}
                        }
                    };
                }
            } 
            // Check for generic validation errors
            else if (error.message && (error.message.includes('required') || error.message.includes('Missing') || error.message.includes('Invalid'))) {
                errorCode = -32602; // Invalid params
                const method = request.method;
                
                if (REQUEST_TEMPLATES[method]) {
                    helpfulInfo = {
                        correctFormat: REQUEST_TEMPLATES[method],
                        hint: `Please use the correct format shown in 'correctFormat'. Ensure all required parameters are included.`
                    };
                }
            } 
            // Method not found
            else if (error.message && error.message.includes('not found')) {
                errorCode = -32601;
                helpfulInfo = {
                    availableMethods: Object.keys(REQUEST_TEMPLATES),
                    exampleRequest: REQUEST_TEMPLATES['generateWallet'],
                    hint: "Please use one of the available methods listed above. See 'exampleRequest' for proper JSON-RPC format."
                };
            }
            // Missing jsonrpc or invalid request structure
            else if (!request.method) {
                errorCode = -32600; // Invalid Request
                errorMessage = "Invalid JSON-RPC request. Missing 'method' field.";
                helpfulInfo = {
                    correctFormat: {
                        jsonrpc: "2.0",
                        method: "methodName",
                        params: { /* method parameters */ },
                        id: 1
                    },
                    availableMethods: Object.keys(REQUEST_TEMPLATES),
                    hint: "All requests must include: jsonrpc, method, params (if required), and id"
                };
            }

            return {
                jsonrpc: "2.0",
                error: {
                    code: errorCode,
                    message: errorMessage,
                    data: Object.keys(helpfulInfo).length > 0 ? helpfulInfo : undefined
                },
                id: request.id || null
            };
        }
    }

    /**
     * Starts the HTTP server
     * @returns {http.Server} The HTTP server instance
     * @throws {Error} When server fails to start
     */
    startHttp() {
        const app = express();
        app.use(cors());
        app.use(bodyParser.json());

        // Initialize the isolated pending receive interface
        const pendingReceiveInterface = require('./interfaces/pending-receive.interface');

        // Add isolated endpoint for pending receive operations
        app.post('/pending/receive', async (req, res) => {
            const request = {
                jsonrpc: "2.0",
                method: "pending/receive",
                params: req.body,
                id: Date.now()
            };
            const response = await pendingReceiveInterface.handleRequest(request);
            res.json(response);
        });



        // Swagger documentation
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

        // Serve privacy.html page
        app.get('/privacy.html', (req, res) => {
            const privacyPath = path.join(__dirname, '..', 'privacy.html');
            if (fs.existsSync(privacyPath)) {
                res.sendFile(privacyPath);
            } else {
                res.status(404).send('Privacy page not found');
            }
        });

        // GET endpoint for tools/list
        app.get('/tools/list', (req, res) => {
            res.json({
                jsonrpc: '2.0',
                result: {
                    tools: MCP_TOOLS
                },
                id: null
            });
        });

        // ====================================================================
        // JSON SCHEMA ENDPOINTS FOR AI AGENT AUTO-DISCOVERY
        // ====================================================================

        // GET complete JSON Schema
        app.get('/schema', (req, res) => {
            res.json(schemaProvider.getFullSchema());
        });

        // GET OpenAPI 3.0 specification
        app.get('/openapi.json', (req, res) => {
            res.json(schemaProvider.generateOpenApiSpec());
        });

        // GET TypeScript definitions
        app.get('/schema/typescript', (req, res) => {
            const tsPath = path.join(__dirname, '../schemas/mcp-tools.d.ts');
            if (fs.existsSync(tsPath)) {
                res.setHeader('Content-Type', 'text/plain');
                res.sendFile(tsPath);
            } else {
                res.status(404).json({ error: 'TypeScript definitions not found' });
            }
        });

        // GET schema for specific tool
        app.get('/schema/tools/:toolName', (req, res) => {
            const toolSchema = schemaProvider.getToolSchema(req.params.toolName);
            if (toolSchema) {
                res.json(toolSchema);
            } else {
                res.status(404).json({ 
                    error: 'Tool not found',
                    availableTools: schemaProvider.getToolNames()
                });
            }
        });

        // GET tools by category
        app.get('/schema/category/:category', (req, res) => {
            const tools = schemaProvider.getToolsByCategory(req.params.category);
            res.json({
                category: req.params.category,
                tools: tools,
                count: tools.length
            });
        });

        // GET all error codes
        app.get('/schema/errors', (req, res) => {
            res.json({
                errorCodes: schemaProvider.getErrorCodes(),
                errorSchema: schemaProvider.getFullSchema().errorSchema,
                count: schemaProvider.getErrorCodes().length
            });
        });

        // GET examples for a specific tool
        app.get('/schema/examples/:toolName', (req, res) => {
            const examples = schemaProvider.getExamples(req.params.toolName);
            if (examples) {
                res.json({
                    tool: req.params.toolName,
                    examples: examples
                });
            } else {
                res.status(404).json({
                    error: 'Tool not found or no examples available',
                    availableTools: schemaProvider.getToolNames()
                });
            }
        });

        // GET schema metadata
        app.get('/schema/metadata', (req, res) => {
            res.json(schemaProvider.getMetadata());
        });

        // POST validate parameters for a tool
        app.post('/schema/validate/:toolName', (req, res) => {
            const validation = schemaProvider.validateParams(req.params.toolName, req.body);
            res.json({
                tool: req.params.toolName,
                params: req.body,
                validation: validation
            });
        });

        // JSON-RPC endpoint at root path
        app.post('/', async (req, res) => {
            // Validate JSON-RPC request
            if (!req.body || !req.body.jsonrpc || req.body.jsonrpc !== '2.0' || !req.body.method) {
                res.json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32600,
                        message: 'Invalid Request'
                    },
                    id: req.body?.id || null
                });
                return;
            }

            const response = await this.handleRequest(req.body);
            res.json(response);
        });

        // Start server
        const server = http.createServer(app);
        server.listen(this.config.port, '0.0.0.0', () => {
            console.log(`NANO MCP Server running on port ${this.config.port}`);
            console.log(`API documentation available at http://0.0.0.0:${this.config.port}/api-docs`);
        });

        return server;
    }
}

// Helper function to determine content type
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };
    return contentTypes[ext] || 'text/plain';
}

module.exports = { NanoMCPServer };

// Start the server if this file is run directly
if (require.main === module) {
    const server = new NanoMCPServer();
    server.startHttp();
}
