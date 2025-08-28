const http = require('http');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const { NanoTransactions } = require('../utils/nano-transactions');
const { SchemaValidator } = require('../utils/schema-validator');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const DEFAULT_PORT = 8080;

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
                default:
                    throw new Error(`Method ${method} not found`);
            }

            return {
                jsonrpc: "2.0",
                result,
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
