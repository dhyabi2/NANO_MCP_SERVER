import dotenv from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';
import * as nanocurrency from 'nanocurrency';
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
                privateKey
            };
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        console.log('\n=== Starting NANO Wallet Test ===\n');
        // Create first wallet
        console.log('1. Creating first wallet...');
        const wallet1 = await walletService.generateWallet();
        console.log('\n=== Wallet 1 Address (Send your tip here) ===');
        console.log(wallet1.address);
        console.log('\nWaiting 1 minute for your tip...');
        console.log('Please send 0.00001 NANO to the address above\n');
        // Wait for 1 minute
        let timeLeft = 60;
        const interval = setInterval(() => {
            process.stdout.write(`Time remaining: ${timeLeft} seconds\r`);
            timeLeft--;
        }, 1000);
        await sleep(60000);
        clearInterval(interval);
        console.log('\n\n2. Checking balance and receiving pending transactions...');
        // Check balance and receive pending
        const balance1 = await walletService.getBalance(wallet1.address);
        console.log('Initial balance:', balance1);
        // Receive pending transactions
        await walletService.receivePending(wallet1.address, wallet1.privateKey);
        // Create second wallet
        console.log('\n3. Creating second wallet...');
        const wallet2 = await walletService.generateWallet();
        console.log('\n=== Wallet 2 Address ===');
        console.log(wallet2.address);
        // Get updated balance after receiving
        const updatedBalance1 = await walletService.getBalance(wallet1.address);
        console.log('\nWallet 1 Updated Balance:', updatedBalance1);
        // Send from wallet1 to wallet2
        console.log('\n4. Sending funds from Wallet 1 to Wallet 2...');
        const sendResult = await walletService.sendTransaction(wallet1.address, wallet1.privateKey, wallet2.address, updatedBalance1.balance);
        if (sendResult.success) {
            console.log('Transaction successful! Hash:', sendResult.hash);
        }
        else {
            console.log('Transaction failed:', sendResult.error);
        }
        // Wait for transaction to process
        console.log('\nWaiting for transaction to process...');
        await sleep(5000);
        // Receive in wallet2
        console.log('\n5. Receiving funds in Wallet 2...');
        await walletService.receivePending(wallet2.address, wallet2.privateKey);
        // Check wallet2 balance
        const balance2 = await walletService.getBalance(wallet2.address);
        console.log('Wallet 2 Balance:', balance2);
        // Send back to wallet1
        console.log('\n6. Sending funds back to Wallet 1...');
        const sendBackResult = await walletService.sendTransaction(wallet2.address, wallet2.privateKey, wallet1.address, balance2.balance);
        if (sendBackResult.success) {
            console.log('Transaction successful! Hash:', sendBackResult.hash);
        }
        else {
            console.log('Transaction failed:', sendBackResult.error);
        }
        // Wait for transaction to process
        console.log('\nWaiting for transaction to process...');
        await sleep(5000);
        // Receive back in wallet1
        console.log('\n7. Receiving funds back in Wallet 1...');
        await walletService.receivePending(wallet1.address, wallet1.privateKey);
        // Final balance check
        const finalBalance1 = await walletService.getBalance(wallet1.address);
        const finalBalance2 = await walletService.getBalance(wallet2.address);
        console.log('\n=== Final Balances ===');
        console.log('Wallet 1:', finalBalance1);
        console.log('Wallet 2:', finalBalance2);
    }
    catch (error) {
        console.error('\nTest failed:', error);
    }
}
// Run the wallet test
console.clear(); // Clear the console before starting
runWalletTest();
