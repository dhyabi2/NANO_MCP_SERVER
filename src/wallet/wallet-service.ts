import dotenv from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';
import * as nanocurrency from 'nanocurrency';
import * as nanoWeb from 'nanocurrency-web';
import qrcode from 'qrcode-terminal';
import { Logger } from '../utils/logger';
import path from 'path';
import { fileURLToPath } from 'url';
import { KeyManager } from './key-manager';
import { block } from 'nanocurrency-web';
import axios from 'axios';

dotenv.config();

// Use CommonJS __dirname directly
const __dirname = path.resolve();

export class WalletService {
    private apiUrl: string;
    private apiKey: string;
    private logger: Logger;
    public keyManager: KeyManager;

    constructor() {
        this.apiUrl = 'https://rpc.nano.to';
        this.apiKey = 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23';
        this.logger = new Logger(path.join(__dirname, 'logs'));
        this.keyManager = new KeyManager(this.logger);
    }

    async makeRpcCall(action: string, params = {}) {
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
            } catch (err) {
                const error = err as Error;
                this.logger.logError('RPC_PARSE_ERROR', { 
                    error: error.message, 
                    responseText: text 
                });
                throw new Error(`Failed to parse response: ${text}`);
            }

            this.logger.log('RPC_RESPONSE', data);
            return data;
        } catch (err) {
            const error = err as Error;
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

    async initializeAccount(address: string, privateKey: string) {
        try {
            console.log('\nInitializing account:', address);
            
            // Verify the private key format
            if (!this.keyManager.validateKeyFormat(privateKey)) {
                throw new Error('Invalid private key format provided for initialization');
            }

            // Check if account already exists
            const accountInfo = await this.makeRpcCall('account_info', {
                account: address,
                representative: true,
                receivable: true
            });

            if (!accountInfo.error) {
                console.log('Account already initialized');
                return;
            }

            // Generate public key using nanocurrency-web instead
            const wallet = await nanoWeb.wallet.generate(privateKey);
            const publicKey = wallet.accounts[0].publicKey;
            
            // Verify key pair
            const isValid = await this.keyManager.verifyKeyPair(privateKey, publicKey);
            if (!isValid) {
                throw new Error('Key pair verification failed during initialization');
            }

            // Generate work for account opening
            const work = await this.makeRpcCall('work_generate', {
                hash: publicKey,
                difficulty: 'fffffff800000000'
            });

            if (!work || !work.work) {
                throw new Error('Failed to generate work for account opening');
            }

            // Create open block
            const openBlock = {
                type: 'state',
                account: address,
                previous: '0'.repeat(64),
                representative: address,
                balance: '0',
                link: publicKey,
                work: work.work
            };

            // Sign using KeyManager
            const signResult = await this.keyManager.signBlock(openBlock, privateKey);
            
            // Process the open block
            const processResult = await this.makeRpcCall('process', {
                json_block: 'true',
                subtype: 'open',
                block: signResult
            });

            console.log('Account initialized successfully');
            return processResult;
        } catch (err) {
            const error = err as Error;
            this.logger.logError('ACCOUNT_INIT_ERROR', error);
            console.error('Account Initialization Error:', error);
            throw error;
        }
    }

    async getBalance(address: string) {
        try {
            const formattedAddress = address.replace('xrb_', 'nano_');
            console.log('\nChecking balance for address:', formattedAddress);
            
            const data = await this.makeRpcCall('account_balance', { 
                account: formattedAddress,
                include_only_confirmed: true
            });
            
            return {
                balance: data.balance || '0',
                pending: data.pending || data.receivable || '0'
            };
        } catch (err) {
            const error = err as Error;
            if (error.message.includes('Account not found')) {
                console.log('Account not opened yet, returning zero balance');
                return { balance: '0', pending: '0' };
            }
            throw error;
        }
    }

    async generateWork(hash: string) {
        console.log('Generating work for hash:', hash);
        const data = await this.makeRpcCall('work_generate', { hash });
        console.log('Work generated:', data.work);
        return data.work;
    }

    async receivePending(address: string, privateKey: string) {
        try {
            const formattedAddress = address.replace('xrb_', 'nano_');
            console.log('\nChecking pending blocks for:', formattedAddress);
            
            const pendingData = await this.makeRpcCall('pending', {
                account: formattedAddress,
                threshold: '1',
                source: true,
                include_active: true,
                include_only_confirmed: true
            });

            if (!pendingData.blocks || Object.keys(pendingData.blocks).length === 0) {
                console.log('No pending blocks found');
                return { received: 0 };
            }

            console.log('\nFound pending blocks:', Object.keys(pendingData.blocks));
            let receivedCount = 0;

            for (const blockHash of Object.keys(pendingData.blocks)) {
                try {
                    // Get block info
                    const blockInfo = await this.makeRpcCall('blocks_info', {
                        hashes: [blockHash],
                        json_block: 'true',
                        pending: true,
                        source: true
                    });

                    if (!blockInfo || !blockInfo.blocks || !blockInfo.blocks[blockHash]) {
                        console.error('Failed to get block info for:', blockHash);
                        continue;
                    }

                    // Get current account info
                    const accountInfo = await this.makeRpcCall('account_info', {
                        account: formattedAddress,
                        representative: true
                    }).catch(() => null);

                    const previous = accountInfo?.frontier || '0'.repeat(64);
                    const representative = accountInfo?.representative || formattedAddress;
                    const currentBalance = accountInfo?.balance || '0';
                    const amountRaw = blockInfo.blocks[blockHash].amount;

                    // Generate work
                    const workHash = previous === '0'.repeat(64) ? 
                        (await nanoWeb.wallet.generate(privateKey)).accounts[0].publicKey : 
                        previous;
                    
                    const workData = await this.makeRpcCall('work_generate', {
                        hash: workHash,
                        difficulty: previous === '0'.repeat(64) ? 
                            'fffffff800000000' : 
                            'fffffe0000000000'
                    });

                    if (!workData || !workData.work) {
                        throw new Error('Failed to generate work');
                    }

                    // Prepare block data for receive
                    const blockData = {
                        walletBalanceRaw: currentBalance,
                        fromAddress: blockInfo.blocks[blockHash].source,
                        toAddress: formattedAddress,
                        representativeAddress: representative,
                        frontier: previous,
                        amountRaw: amountRaw,
                        work: workData.work,
                        transactionHash: blockHash
                    };

                    // Sign the block using nanocurrency-web
                    const signedBlock = block.receive(blockData, privateKey);

                    // Process the receive block
                    const processResult = await this.makeRpcCall('process', {
                        json_block: 'true',
                        subtype: previous === '0'.repeat(64) ? 'open' : 'receive',
                        block: signedBlock
                    });

                    if (processResult && processResult.hash) {
                        console.log('Successfully received block:', blockHash);
                        receivedCount++;
                    }
                } catch (err) {
                    const error = err as Error;
                    console.error('Error receiving block:', blockHash, error);
                }
            }

            return { received: receivedCount };
        } catch (err) {
            const error = err as Error;
            console.error('Receive Error:', error);
            throw error;
        }
    }

    async sendTransaction(fromAddress: string, privateKey: string, toAddress: string, amountRaw: string) {
        try {
            const formattedFromAddress = fromAddress.replace('xrb_', 'nano_');
            const formattedToAddress = toAddress.replace('xrb_', 'nano_');

            // Get account info for current balance and frontier
            const accountInfo = await this.makeRpcCall('account_info', {
                account: formattedFromAddress,
                representative: true,
                json_block: 'true'
            });
            
            if (accountInfo.error) {
                if (accountInfo.error === 'Account not found') {
                    throw new Error('Account has no previous blocks. Please make sure it has received some NANO first.');
                }
                throw new Error(accountInfo.error);
            }

            // Generate work
            const workData = await this.makeRpcCall('work_generate', {
                hash: accountInfo.frontier,
                difficulty: 'fffffff800000000'  // Higher difficulty for send blocks
            });

            if (!workData || !workData.work) {
                throw new Error('Failed to generate work');
            }

            // Prepare block data
            const blockData = {
                walletBalanceRaw: accountInfo.balance,
                fromAddress: formattedFromAddress,
                toAddress: formattedToAddress,
                representativeAddress: accountInfo.representative,
                frontier: accountInfo.frontier,
                amountRaw: amountRaw,
                work: workData.work
            };

            // Sign the block using nanocurrency-web
            const signedBlock = block.send(blockData, privateKey);

            // Process the block
            const processData = await this.makeRpcCall('process', {
                json_block: 'true',
                subtype: 'send',
                block: signedBlock
            });
            
            if (processData.error) {
                throw new Error(processData.error);
            }

            return { success: true, hash: processData.hash };
        } catch (err) {
            const error = err as Error;
            console.error('Send Transaction Error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create an instance and export
const walletService = new WalletService();
export default walletService; 