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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WalletService {
    constructor() {
        this.apiUrl = 'https://rpc.nano.to';
        this.apiKey = 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23';
        this.logger = new Logger(path.join(__dirname, 'logs'));
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

            // Generate public key
            const publicKey = nanocurrency.derivePublicKey(privateKey);
            
            // Verify key pair
            if (!this.keyManager.verifyKeyPair(privateKey, publicKey)) {
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
            const signResult = this.keyManager.signBlock(openBlock, privateKey);
            
            // Process the open block
            const processResult = await this.makeRpcCall('process', {
                json_block: 'true',
                subtype: 'open',
                block: signResult.block
            });

            console.log('Account initialized successfully');
            return processResult;
        } catch (error) {
            this.logger.logError('ACCOUNT_INIT_ERROR', error);
            console.error('Account Initialization Error:', error);
            throw error;
        }
    }

    async getBalance(address) {
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
        } catch (error) {
            if (error.message.includes('Account not found')) {
                console.log('Account not opened yet, returning zero balance');
                return { balance: '0', pending: '0' };
            }
            throw error;
        }
    }

    async generateWork(hash) {
        console.log('Generating work for hash:', hash);
        const data = await this.makeRpcCall('work_generate', { hash });
        console.log('Work generated:', data.work);
        return data.work;
    }

    async receivePending(address, privateKey) {
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
                        nanocurrency.derivePublicKey(privateKey) : 
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
                } catch (error) {
                    console.error('Error receiving block:', blockHash, error);
                }
            }

            return { received: receivedCount };
        } catch (error) {
            console.error('Receive Error:', error);
            throw error;
        }
    }

    async sendTransaction(fromAddress, privateKey, toAddress, amountRaw) {
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
        } catch (error) {
            console.error('Send Transaction Error:', error);
            return { success: false, error: error.message };
        }
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWalletTest() {
    const walletService = new WalletService();
    
    try {
        console.clear();
        console.log('\n=== Starting NANO Wallet Test ===\n');
        
        // Create first wallet with validation
        console.log('1. Creating first wallet...\n');
        const wallet1 = await walletService.generateWallet();
        
        // Verify the generated wallet
        if (!walletService.keyManager.verifyKeyPair(wallet1.privateKey, wallet1.publicKey)) {
            throw new Error('Generated wallet verification failed');
        }
        
        // Create payment URL with amount
        const amount = '0.00001';
        const paymentUrl = `nano:${wallet1.address}?amount=${amount}`;
        const qrUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(paymentUrl)}`;
        
        // Display wallet address prominently
        console.log('\n========================================');
        console.log('           WALLET ADDRESS');
        console.log('========================================');
        console.log(wallet1.address);
        console.log('========================================\n');

        // Display QR code and links
        console.log('QR Code URL (click or copy to browser):');
        console.log(qrUrl);
        console.log('\nPayment URL (for mobile wallets):');
        console.log(paymentUrl);
        
        console.log('\nPlease send exactly 0.00001 NANO to this address');
        console.log('\nStarting 4-minute countdown with checks every 10 seconds...\n');

        // Wait for 4 minutes with periodic checks
        let timeLeft = 240;
        let receivedFunds = false;
        const interval = setInterval(() => {
            process.stdout.write(`Time remaining: ${timeLeft} seconds\r`);
            timeLeft--;
        }, 1000);
        
        // Check for pending transactions every 10 seconds
        while (timeLeft > 0 && !receivedFunds) {
            try {
                // Check balance and pending
                const balance = await walletService.getBalance(wallet1.address);
                console.log('\nCurrent state:');
                console.log('Balance:', balance.balance);
                console.log('Pending:', balance.pending);
                
                if (balance.pending !== '0') {
                    console.log('\nPending transaction found! Attempting to receive...');
                    const receiveResult = await walletService.receivePending(wallet1.address, wallet1.privateKey);
                    console.log('Receive attempt result:', receiveResult);
                    
                    // Verify the receive worked by checking new balance
                    const newBalance = await walletService.getBalance(wallet1.address);
                    console.log('\nNew state after receive:');
                    console.log('Balance:', newBalance.balance);
                    console.log('Pending:', newBalance.pending);
                    
                    if (newBalance.balance !== '0') {
                        console.log('\nSuccessfully received funds!');
                        receivedFunds = true;
                        break;
                    }
                } else {
                    console.log('No pending transactions yet.');
                }
            } catch (error) {
                console.error('Error during balance check:', error.message);
                // Continue checking despite errors
            }

            // Wait 10 seconds before next check
            await sleep(10000);
            timeLeft -= 10;
        }
        
        clearInterval(interval);
        
        if (!receivedFunds) {
            console.log('\n\nNo funds received within the timeout period. Test cannot continue.');
            return;
        }

        // Create second wallet with validation
        console.log('\n2. Creating second wallet...');
        const wallet2 = await walletService.generateWallet();
        
        // Verify the second wallet
        if (!walletService.keyManager.verifyKeyPair(wallet2.privateKey, wallet2.publicKey)) {
            throw new Error('Second wallet verification failed');
        }
        
        console.log('\n=== Wallet 2 Address ===');
        console.log(wallet2.address);

        // Get updated balance after receiving
        const updatedBalance1 = await walletService.getBalance(wallet1.address);
        console.log('\nWallet 1 Balance:', updatedBalance1);

        // Ensure pending transactions are received before sending
        console.log('\n3. Checking and receiving any pending transactions before sending...');
        await walletService.receivePending(wallet1.address, wallet1.privateKey);
        
        // Get final balance before sending
        const finalBalance1 = await walletService.getBalance(wallet1.address);
        console.log('Wallet 1 Final Balance before sending:', finalBalance1);

        // Send from wallet1 to wallet2
        console.log('\n4. Sending funds from Wallet 1 to Wallet 2...');
        const sendResult = await walletService.sendTransaction(
            wallet1.address,
            wallet1.privateKey,
            wallet2.address,
            finalBalance1.balance
        );

        if (sendResult.success) {
            console.log('Transaction successful! Hash:', sendResult.hash);
        } else {
            console.log('Transaction failed:', sendResult.error);
            return;
        }

        // Wait for transaction to process and check periodically
        console.log('\nWaiting for transaction to process...');
        let received = false;
        for (let i = 0; i < 6; i++) {
            try {
                await sleep(10000);
                console.log('Checking wallet 2 for pending transactions...');
                await walletService.receivePending(wallet2.address, wallet2.privateKey);
                const balance2 = await walletService.getBalance(wallet2.address);
                if (balance2.balance !== '0') {
                    received = true;
                    break;
                }
            } catch (error) {
                console.error('Error during transaction check:', error.message);
                // Continue checking despite errors
            }
        }

        // Check wallet2 balance
        const balance2 = await walletService.getBalance(wallet2.address);
        console.log('Wallet 2 Balance:', balance2);

        if (!received) {
            console.log('Failed to receive funds in wallet 2. Test cannot continue.');
            return;
        }

        // Send back to wallet1
        console.log('\n5. Sending funds back to Wallet 1...');
        const sendBackResult = await walletService.sendTransaction(
            wallet2.address,
            wallet2.privateKey,
            wallet1.address,
            balance2.balance
        );

        if (sendBackResult.success) {
            console.log('Transaction successful! Hash:', sendBackResult.hash);
        } else {
            console.log('Transaction failed:', sendBackResult.error);
            return;
        }

        // Wait and check for receiving in wallet1
        console.log('\nWaiting for final transaction to process...');
        received = false;
        for (let i = 0; i < 6; i++) {
            try {
                await sleep(10000);
                console.log('Checking wallet 1 for pending transactions...');
                await walletService.receivePending(wallet1.address, wallet1.privateKey);
                const finalBalance = await walletService.getBalance(wallet1.address);
                if (finalBalance.balance !== '0') {
                    received = true;
                    break;
                }
            } catch (error) {
                console.error('Error during final transaction check:', error.message);
                // Continue checking despite errors
            }
        }

        // Final balance check
        const finalBalance1After = await walletService.getBalance(wallet1.address);
        const finalBalance2 = await walletService.getBalance(wallet2.address);

        console.log('\n=== Final Balances ===');
        console.log('Wallet 1:', finalBalance1After);
        console.log('Wallet 2:', finalBalance2);

    } catch (error) {
        console.error('\nTest failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the wallet test
console.clear(); // Clear the console before starting
runWalletTest();

// Create an instance and export
const walletService = new WalletService();
export default walletService; 