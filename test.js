import dotenv from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';
import * as nanocurrency from 'nanocurrency';
import { WalletService } from 'nano-mcp';

dotenv.config();

class WalletService {
    constructor() {
        this.apiUrl = process.env.XNO_API_URL || 'https://proxy.nanos.cc/proxy';
        this.rpcKey = process.env.RPC_KEY || 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23';
    }

    async generateWallet() {
        try {
            const seed = crypto.randomBytes(32).toString('hex');
            const privateKey = nanocurrency.deriveSecretKey(seed, 0);
            const publicKey = nanocurrency.derivePublicKey(privateKey);
            const address = nanocurrency.deriveAddress(publicKey);
            
            return {
                address,
                privateKey,
                publicKey
            };
        } catch (error) {
            console.error('Wallet Generation Error:', error);
            throw error;
        }
    }

    async getBalance(address) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.rpcKey
                },
                body: JSON.stringify({
                    action: 'account_balance',
                    account: address
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            return {
                balance: data.balance,
                pending: data.pending
            };
        } catch (error) {
            console.error('Balance Check Error:', error);
            return { balance: '0', pending: '0' };
        }
    }

    async receivePending(address, privateKey) {
        try {
            const pendingResponse = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.rpcKey
                },
                body: JSON.stringify({
                    action: 'pending',
                    account: address,
                    threshold: '1',
                    source: true
                })
            });

            const pendingData = await pendingResponse.json();

            if (!pendingData.blocks || Object.keys(pendingData.blocks).length === 0) {
                return { received: 0 };
            }

            let receivedCount = 0;
            for (const [hash, details] of Object.entries(pendingData.blocks)) {
                const receiveResponse = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': this.rpcKey
                    },
                    body: JSON.stringify({
                        action: 'receive',
                        wallet: address,
                        account: address,
                        block: hash,
                        private_key: privateKey
                    })
                });

                const receiveData = await receiveResponse.json();
                if (!receiveData.error) {
                    receivedCount++;
                }
            }

            return { received: receivedCount };
        } catch (error) {
            console.error('Receive Pending Error:', error);
            return { received: 0 };
        }
    }

    async sendTransaction(fromAddress, privateKey, toAddress, amountRaw) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.rpcKey
                },
                body: JSON.stringify({
                    action: 'send',
                    wallet: fromAddress,
                    source: fromAddress,
                    destination: toAddress,
                    amount: amountRaw,
                    private_key: privateKey
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            return { success: true, hash: data.block };
        } catch (error) {
            console.error('Send Transaction Error:', error);
            return { success: false, error: error.message };
        }
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWallet() {
    try {
        console.log('Initializing WalletService...');
        const walletService = new WalletService();
        
        // Generate a new wallet
        console.log('\nGenerating new wallet...');
        const wallet = await walletService.generateWallet();
        
        console.log('\nWallet generated successfully:');
        console.log('Address:', wallet.address);
        console.log('Public Key:', wallet.publicKey);
        
        // Check balance
        console.log('\nChecking balance...');
        const balance = await walletService.getBalance(wallet.address);
        console.log('Balance:', balance);
        
        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

async function testEndpoints() {
    const url = 'http://localhost:3000';
    const headers = { 'Content-Type': 'application/json' };

    try {
        // Test initialize
        console.log('\nTesting initialize endpoint:');
        const initResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ method: 'initialize', params: {} })
        });
        console.log(await initResponse.json());

        // Test generateWallet
        console.log('\nTesting generateWallet endpoint:');
        const wallet1Response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ method: 'generateWallet', params: {} })
        });
        const wallet1 = await wallet1Response.json();
        console.log('Wallet 1:', wallet1);

        // Test getBalance
        console.log('\nTesting getBalance endpoint:');
        const balanceResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                method: 'getBalance', 
                params: { address: wallet1.address }
            })
        });
        console.log(await balanceResponse.json());

        // Generate second wallet
        console.log('\nGenerating second wallet:');
        const wallet2Response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ method: 'generateWallet', params: {} })
        });
        const wallet2 = await wallet2Response.json();
        console.log('Wallet 2:', wallet2);

        // Test sendTransaction
        console.log('\nTesting sendTransaction endpoint:');
        const sendResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                method: 'sendTransaction', 
                params: {
                    fromAddress: wallet1.address,
                    privateKey: wallet1.privateKey,
                    toAddress: wallet2.address,
                    amountRaw: '1000000000000000000000000000'  // 1 NANO
                }
            })
        });
        console.log(await sendResponse.json());

        // Test receivePending
        console.log('\nTesting receivePending endpoint:');
        const receiveResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                method: 'receivePending', 
                params: {
                    address: wallet2.address,
                    privateKey: wallet2.privateKey
                }
            })
        });
        console.log(await receiveResponse.json());

    } catch (error) {
        console.error('Error testing endpoints:', error);
    }
}

console.log('Starting NANO MCP API Tests...');
testEndpoints(); 