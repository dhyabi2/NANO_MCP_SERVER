import dotenv from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';
import * as nanocurrency from 'nanocurrency';
import qrcode from 'qrcode-terminal';
import { Logger } from '../logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { KeyManager } from '../key-manager.js';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WalletService {
    constructor() {
        this.apiUrl = 'https://rpc.nano.to';
        this.apiKey = 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23';
        this.logger = new Logger(path.join(__dirname, '../logs'));
        this.keyManager = new KeyManager(this.logger);
    }

    async makeRpcCall(action, params = {}) {
        try {
            this.logger.log('RPC_CALL', { action, params });
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    action,
                    ...params
                })
            });

            const text = await response.text();
            this.logger.log('RPC_RESPONSE_RAW', text);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
            }

            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (parseError) {
                this.logger.logError('RPC_PARSE_ERROR', { 
                    error: parseError.message, 
                    responseText: text 
                });
                throw new Error(`Failed to parse response: ${text}`);
            }

            this.logger.log('RPC_RESPONSE', data);
            return data;
        } catch (error) {
            this.logger.logError('RPC_ERROR', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async generateWallet() {
        try {
            // Use KeyManager to generate the wallet
            const wallet = await this.keyManager.generateKeyPair();
            
            console.log('\nGenerated new wallet:');
            console.log('Public Key:', wallet.publicKey);
            console.log('Address:', wallet.address);
            
            return wallet;
        } catch (error) {
            this.logger.logError('WALLET_GENERATION_ERROR', error);
            throw error;
        }
    }

    async initializeAccount(address, privateKey) {
        try {
            console.log('\nInitializing account:', address);
            
            // Verify the key pair
            if (!this.keyManager.validateKeyFormat(privateKey)) {
                throw new Error('Invalid private key format');
            }

            // Get account info
            const accountInfo = await this.makeRpcCall('account_info', {
                account: address,
                representative: true
            }).catch(() => null);

            if (!accountInfo) {
                console.log('Account not yet initialized. Waiting for first transaction...');
            } else {
                console.log('Account already initialized');
                console.log('Balance:', nanocurrency.convert(accountInfo.balance, { from: 'raw', to: 'NANO' }), 'NANO');
            }

            return {
                address,
                initialized: !!accountInfo,
                balance: accountInfo ? accountInfo.balance : '0'
            };
        } catch (error) {
            this.logger.logError('ACCOUNT_INITIALIZATION_ERROR', error);
            throw error;
        }
    }

    async getBalance(address) {
        try {
            const response = await this.makeRpcCall('account_balance', {
                account: address,
                include_only_confirmed: true
            });

            const balance = response.balance || '0';
            const pending = response.pending || '0';
            const receivable = response.receivable || '0';

            return {
                balance,
                pending,
                receivable,
                balance_nano: nanocurrency.convert(balance, { from: 'raw', to: 'NANO' }),
                pending_nano: nanocurrency.convert(pending, { from: 'raw', to: 'NANO' }),
                receivable_nano: nanocurrency.convert(receivable, { from: 'raw', to: 'NANO' })
            };
        } catch (error) {
            this.logger.logError('BALANCE_CHECK_ERROR', error);
            throw error;
        }
    }

    async receivePending(address, privateKey) {
        try {
            // Verify the key pair
            if (!this.keyManager.validateKeyFormat(privateKey)) {
                throw new Error('Invalid private key format');
            }

            // Get pending blocks
            const { blocks } = await this.makeRpcCall('pending', {
                account: address,
                threshold: '1',
                source: true,
                include_active: true,
                include_only_confirmed: true
            });

            if (!blocks || blocks.length === 0) {
                console.log('No pending transactions found');
                return { received: [] };
            }

            // Get block info for each pending block
            const blockInfo = await this.makeRpcCall('blocks_info', {
                hashes: blocks,
                json_block: 'true',
                pending: true,
                source: true
            });

            // Get current account info
            const accountInfo = await this.makeRpcCall('account_info', {
                account: address,
                representative: true
            }).catch(() => null);

            const received = [];

            for (const blockHash of blocks) {
                try {
                    const block = blockInfo.blocks[blockHash];
                    const amount = block.amount;
                    const sourceAccount = block.source_account;

                    // Prepare receive block
                    const receiveBlock = {
                        type: 'state',
                        account: address,
                        previous: accountInfo ? accountInfo.frontier : '0'.repeat(64),
                        representative: address,
                        balance: (BigInt(accountInfo ? accountInfo.balance : '0') + BigInt(amount)).toString(),
                        link: blockHash
                    };

                    // Generate work
                    const workHash = accountInfo ? accountInfo.frontier : nanocurrency.derivePublicKey(privateKey);
                    const { work } = await this.makeRpcCall('work_generate', {
                        hash: workHash,
                        difficulty: 'fffffff800000000'
                    });

                    receiveBlock.work = work;

                    // Sign the block
                    const signedBlock = this.keyManager.signBlock(receiveBlock, privateKey);

                    // Process the block
                    const processResponse = await this.makeRpcCall('process', {
                        json_block: 'true',
                        subtype: accountInfo ? 'receive' : 'open',
                        block: signedBlock.block
                    });

                    received.push({
                        hash: processResponse.hash,
                        amount,
                        source: sourceAccount
                    });

                    // Update account info for next iteration
                    accountInfo.frontier = processResponse.hash;
                    accountInfo.balance = receiveBlock.balance;

                } catch (error) {
                    this.logger.logError('RECEIVE_BLOCK_ERROR', {
                        blockHash,
                        error: error.message
                    });
                    throw error;
                }
            }

            return { received };
        } catch (error) {
            this.logger.logError('RECEIVE_ERROR', error);
            throw error;
        }
    }

    async sendTransaction(fromAddress, privateKey, toAddress, amountRaw) {
        try {
            console.log('\nSending transaction:');
            console.log('From:', fromAddress);
            console.log('To:', toAddress);
            console.log('Amount:', nanocurrency.convert(amountRaw, { from: 'raw', to: 'NANO' }), 'NANO');

            // Verify addresses
            if (!nanocurrency.checkAddress(fromAddress)) {
                throw new Error('Invalid sender address');
            }
            if (!nanocurrency.checkAddress(toAddress)) {
                throw new Error('Invalid recipient address');
            }

            // Verify the key pair
            if (!this.keyManager.validateKeyFormat(privateKey)) {
                throw new Error('Invalid private key format');
            }

            // Get account info
            const accountInfo = await this.makeRpcCall('account_info', {
                account: fromAddress,
                representative: true,
                json_block: 'true'
            });

            // Check balance
            if (BigInt(accountInfo.balance) < BigInt(amountRaw)) {
                throw new Error('Insufficient balance');
            }

            // Calculate new balance
            const newBalance = (BigInt(accountInfo.balance) - BigInt(amountRaw)).toString();

            // Prepare send block
            const sendBlock = {
                type: 'state',
                account: fromAddress,
                previous: accountInfo.frontier,
                representative: accountInfo.representative,
                balance: newBalance,
                link: nanocurrency.derivePublicKey(toAddress)
            };

            // Generate work
            const { work } = await this.makeRpcCall('work_generate', {
                hash: accountInfo.frontier,
                difficulty: 'fffffff800000000'
            });

            sendBlock.work = work;

            // Sign the block
            const signedBlock = this.keyManager.signBlock(sendBlock, privateKey);

            // Process the block
            const processResponse = await this.makeRpcCall('process', {
                json_block: 'true',
                subtype: 'send',
                block: signedBlock.block
            });

            console.log('Transaction sent successfully!');
            console.log('Block hash:', processResponse.hash);

            return {
                success: true,
                hash: processResponse.hash,
                amount: amountRaw,
                balance: newBalance
            };

        } catch (error) {
            this.logger.logError('SEND_TRANSACTION_ERROR', error);
            console.error('Send Transaction Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
} 