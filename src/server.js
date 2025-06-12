const http = require('http');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const { NanoTransactions } = require('../utils/nano-transactions');
const { validateSchema } = require('../utils/schema-validator');
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
class MCPServer {
    constructor(config = {}) {
        this.port = config.port || DEFAULT_PORT;
        this.nanoTransactions = new NanoTransactions({
            apiUrl: config.apiUrl,
            rpcKey: config.rpcKey,
            defaultRepresentative: config.defaultRepresentative
        });
        this.server = null;
        this.app = express();
        
        // Add middleware
        this.app.use(bodyParser.json());
        
        // Add CORS middleware
        this.app.use((req, res, next) => {
            Object.entries(corsHeaders).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            if (req.method === 'OPTIONS') {
                res.sendStatus(204);
                return;
            }
            next();
        });

        // Serve Swagger UI
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
        }));

        // Handle JSON-RPC requests
        this.app.post('/', async (req, res) => {
            try {
                const requestData = req.body;
                let result;

                // Validate JSON-RPC 2.0 format
                if (!requestData.jsonrpc || requestData.jsonrpc !== '2.0' || !requestData.method) {
                    throw new Error('Invalid JSON-RPC 2.0 request');
                }

                switch(requestData.method) {
                    case 'initialize':
                        result = {
                            version: '1.0.0',
                            capabilities: {
                                methods: [
                                    'initialize',
                                    'generateWallet',
                                    'getBalance',
                                    'initializeAccount',
                                    'sendTransaction',
                                    'receiveAllPending',
                                    'getAccountInfo',
                                    'getPendingBlocks',
                                    'generateWork'
                                ]
                            }
                        };
                        break;

                    case 'generateWallet':
                        const wallet = await this.nanoTransactions.generateWallet();
                        result = {
                            publicKey: wallet.publicKey,
                            privateKey: wallet.privateKey,
                            address: wallet.address
                        };
                        break;

                    case 'getAccountInfo':
                        if (!requestData.params?.address) {
                            throw new Error('Address is required');
                        }
                        const info = await this.nanoTransactions.getAccountInfo(requestData.params.address);
                        result = info;
                        break;

                    case 'getPendingBlocks':
                        if (!requestData.params?.address) {
                            throw new Error('Address is required');
                        }
                        const pendingBlocks = await this.nanoTransactions.getPendingBlocks(requestData.params.address);
                        result = pendingBlocks;
                        break;

                    case 'generateWork':
                        if (!requestData.params?.hash) {
                            throw new Error('Hash is required');
                        }
                        const workResult = await this.nanoTransactions.generateWork(
                            requestData.params.hash,
                            requestData.params?.isOpen || false
                        );
                        result = { work: workResult };
                        break;

                    case 'getBalance':
                        if (!requestData.params?.address) {
                            throw new Error('Address is required');
                        }
                        const balance = await this.nanoTransactions.makeRequest('account_balance', {
                            account: requestData.params.address
                        });
                        result = {
                            balance: balance.balance,
                            pending: balance.pending
                        };
                        break;

                    case 'initializeAccount':
                        if (!requestData.params?.address || !requestData.params?.privateKey) {
                            throw new Error('Address and private key are required');
                        }
                        const accountInfo = await this.nanoTransactions.makeRequest('account_info', {
                            account: requestData.params.address,
                            representative: true
                        });
                        result = {
                            initialized: !accountInfo.error,
                            representative: accountInfo.representative
                        };
                        break;

                    case 'sendTransaction':
                        if (!requestData.params?.fromAddress || !requestData.params?.privateKey || 
                            !requestData.params?.toAddress || !requestData.params?.amountRaw) {
                            throw new Error('Missing required transaction parameters');
                        }
                        const sendResult = await this.nanoTransactions.sendTransaction(
                            requestData.params.fromAddress,
                            requestData.params.privateKey,
                            requestData.params.toAddress,
                            requestData.params.amountRaw
                        );
                        result = {
                            success: true,
                            hash: sendResult.hash,
                            amount: requestData.params.amountRaw,
                            balance: sendResult.balance
                        };
                        break;

                    case 'receiveAllPending':
                        if (!requestData.params?.address || !requestData.params?.privateKey) {
                            throw new Error('Address and private key are required');
                        }
                        const receiveResult = await this.nanoTransactions.receiveAllPending(
                            requestData.params.address,
                            requestData.params.privateKey
                        );
                        result = {
                            received: receiveResult.map(block => ({
                                hash: block.hash,
                                amount: block.amount,
                                source: block.source
                            }))
                        };
                        break;

                    default:
                        throw new Error(`Method ${requestData.method} not supported`);
                }

                res.json({
                    jsonrpc: '2.0',
                    result,
                    id: requestData.id
                });
            } catch (error) {
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: error.message
                    },
                    id: null
                });
            }
        });
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`MCP Server running on port ${this.port}`);
            console.log(`API documentation available at http://localhost:${this.port}/api-docs`);
        });
    }

    stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log('Server closed');
                    resolve();
                });
            });
        }
        return Promise.resolve();
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

module.exports = { MCPServer }; 