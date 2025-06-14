const http = require('http');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const { NanoTransactions } = require('../utils/nano-transactions');
const { SchemaValidator } = require('../utils/schema-validator');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

const DEFAULT_PORT = 8080;

// CORS headers configuration
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400' // 24 hours
};

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
 * NANO MCP (NANO Cryptocurrency) Server implementation
 * Provides a JSON-RPC 2.0 interface for interacting with the NANO network
 * Supports both HTTP and stdio transports
 */
class NanoMCPServer {
    /**
     * Creates a new NANO MCP Server instance
     * @param {Object} config - Server configuration
     * @param {number} [config.port=8080] - HTTP server port
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
                case 'initialize':
                    result = {
                        version: "1.0.0",
                        capabilities: {
                            methods: [
                                "initialize",
                                "generateWallet",
                                "getBalance",
                                "initializeAccount",
                                "sendTransaction",
                                "receiveAllPending",
                                "getAccountInfo",
                                "getPendingBlocks"
                            ]
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
                        params.toAddress,
                        params.amountRaw,
                        params.privateKey
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
        app.use(bodyParser.json());
        
        // Swagger documentation
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

        // JSON-RPC endpoint
        app.post('/', async (req, res) => {
            const response = await this.handleRequest(req.body);
            res.json(response);
        });

        // Start server
        const server = http.createServer(app);
        server.listen(this.config.port, () => {
            console.log(`NANO MCP Server running on port ${this.config.port}`);
            console.log(`API documentation available at http://localhost:${this.config.port}/api-docs`);
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