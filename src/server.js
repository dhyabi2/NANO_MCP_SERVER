const http = require('http');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const { NanoTransactions } = require('../utils/nano-transactions');
const { SchemaValidator } = require('../utils/schema-validator');
const { TestWalletManager } = require('../utils/test-wallet-manager');
const { BalanceConverter } = require('../utils/balance-converter');
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
                    this.schemaValidator.validate(params, {
                        type: 'object',
                        required: ['address'],
                        properties: {
                            address: { type: 'string' }
                        }
                    });
                    const balanceInfo = await this.nanoTransactions.getAccountInfo(params.address);
                    result = {
                        balance: balanceInfo.balance || '0',
                        pending: balanceInfo.pending || '0'
                    };
                    break;
                case 'getAccountInfo':
                    this.schemaValidator.validate(params, {
                        type: 'object',
                        required: ['address'],
                        properties: {
                            address: { type: 'string' }
                        }
                    });
                    result = await this.nanoTransactions.getAccountInfo(params.address);
                    break;
                case 'getPendingBlocks':
                    this.schemaValidator.validate(params, {
                        type: 'object',
                        required: ['address'],
                        properties: {
                            address: { type: 'string' }
                        }
                    });
                    result = await this.nanoTransactions.getPendingBlocks(params.address);
                    break;
                case 'initializeAccount':
                    this.schemaValidator.validate(params, {
                        type: 'object',
                        required: ['address', 'privateKey'],
                        properties: {
                            address: { type: 'string' },
                            privateKey: { type: 'string' }
                        }
                    });
                    result = await this.nanoTransactions.initializeAccount(params.address, params.privateKey);
                    break;
                case 'sendTransaction':
                    this.schemaValidator.validate(params, {
                        type: 'object',
                        required: ['fromAddress', 'toAddress', 'amountRaw', 'privateKey'],
                        properties: {
                            fromAddress: { type: 'string' },
                            toAddress: { type: 'string' },
                            amountRaw: { type: 'string' },
                            privateKey: { type: 'string' }
                        }
                    });
                    result = await this.nanoTransactions.sendTransaction(
                        params.fromAddress,
                        params.privateKey,
                        params.toAddress,
                        params.amountRaw
                    );
                    break;
                case 'receiveAllPending':
                    this.schemaValidator.validate(params, {
                        type: 'object',
                        required: ['address', 'privateKey'],
                        properties: {
                            address: { type: 'string' },
                            privateKey: { type: 'string' }
                        }
                    });
                    result = await this.nanoTransactions.receiveAllPending(params.address, params.privateKey);
                    break;
                case 'generateQrCode':
                    this.schemaValidator.validate(params, {
                        type: 'object',
                        required: ['address', 'amount'],
                        properties: {
                            address: { type: 'string' },
                            amount: { type: 'string' }
                        }
                    });
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
                    this.schemaValidator.validate(params, {
                        type: 'object',
                        required: ['amount', 'from', 'to'],
                        properties: {
                            amount: { type: 'string' },
                            from: { type: 'string' },
                            to: { type: 'string' }
                        }
                    });
                    const from = params.from.toLowerCase();
                    const to = params.to.toLowerCase();
                    
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
                    } else {
                        throw new Error(`Invalid conversion: from="${from}" to="${to}". Must be nano→raw or raw→nano`);
                    }
                    break;
                case 'getAccountStatus':
                    this.schemaValidator.validate(params, {
                        type: 'object',
                        required: ['address'],
                        properties: {
                            address: { type: 'string' }
                        }
                    });
                    
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
                    throw new Error(`Method ${method} not found`);
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
