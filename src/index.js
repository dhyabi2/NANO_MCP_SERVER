#!/usr/bin/env node
import { NanoMCP } from './mcp.js';
import { MCPRequest } from './mcp-types.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';
import * as nanocurrency from 'nanocurrency';
import * as nanoWeb from 'nanocurrency-web';
import qrcode from 'qrcode-terminal';
import { Logger } from './logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { KeyManager } from './key-manager.js';
import { block } from 'nanocurrency-web';
import axios from 'axios';
import { WalletService } from './services/wallet-service.js';
import { runWalletTest } from './tests/wallet-test.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running in server-only mode
const isServerOnly = process.argv.includes('--server-only');

// Add at the very top after imports
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Only start the server if this file is run directly
const isMainModule = fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase();

if (isMainModule) {
    try {
        console.log('Starting NANO MCP Server...');
        const logger = new Logger(path.join(__dirname, 'logs'));
        const server = new NanoMCP();
        
        if (isServerOnly) {
            // Start the server and keep the process running
            try {
                console.log('Starting server in server-only mode...');
                await server.start();
                logger.log('SERVER_START', 'NANO MCP Server started successfully in server-only mode');
                console.log('\n🚀 NANO MCP Server is running in server-only mode');
                console.log('Press Ctrl+C to stop the server\n');

                // Keep the process running
                process.stdin.resume();

                // Handle various termination signals
                const shutdown = async (signal) => {
                    console.log(`\nReceived ${signal}. Shutting down NANO MCP Server...`);
                    logger.log('SERVER_STOP', `Server shutdown initiated by ${signal}`);
                    process.exit(0);
                };

                process.on('SIGINT', () => shutdown('SIGINT'));
                process.on('SIGTERM', () => shutdown('SIGTERM'));
                process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon restart

            } catch (error) {
                logger.logError('SERVER_START_ERROR', error);
                console.error('\n❌ Failed to start NANO MCP Server:', error.message);
                process.exit(1);
            }
        } else {
            // Start the server and run the wallet test
            await server.start();
            // Keep the process running
            process.stdin.resume();
        }
    } catch (error) {
        console.error('Critical error:', error);
        process.exit(1);
    }
}

// Export the NanoMCP class for programmatic usage
export { NanoMCP };

// Export the WalletService for programmatic usage
export { WalletService }; 