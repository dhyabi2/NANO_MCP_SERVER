import { NanoMCP } from '../mcp';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Wallet Integration Test', () => {
    let mcp: NanoMCP;
    
    beforeEach(() => {
        mcp = new NanoMCP({
            nodeUrl: 'https://rpc.nano.to',
            apiKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23'
        });
    });

    it('should perform a complete wallet test cycle', async () => {
        try {
            console.clear();
            console.log('\n=== Starting NANO Wallet Test ===\n');
            
            // Create first wallet
            console.log('1. Creating first wallet...\n');
            const wallet1 = await mcp.generateWallet();
            
            // Display wallet address prominently
            console.log('\n========================================');
            console.log('           WALLET ADDRESS');
            console.log('========================================');
            console.log(wallet1.address);
            console.log('========================================\n');

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
                    const balance = await mcp.getBalance(wallet1.address);
                    console.log('\nCurrent state:');
                    console.log('Balance:', balance.balance);
                    console.log('Pending:', balance.pending);
                    
                    if (balance.pending !== '0') {
                        console.log('\nPending transaction found! Attempting to receive...');
                        const receiveResult = await mcp.receivePending(wallet1.address, wallet1.privateKey);
                        console.log('Receive attempt result:', receiveResult);
                        
                        // Verify the receive worked by checking new balance
                        const newBalance = await mcp.getBalance(wallet1.address);
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
                    console.error('Error during balance check:', error);
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

            // Create second wallet
            console.log('\n2. Creating second wallet...');
            const wallet2 = await mcp.generateWallet();
            
            console.log('\n=== Wallet 2 Address ===');
            console.log(wallet2.address);

            // Get updated balance after receiving
            const updatedBalance1 = await mcp.getBalance(wallet1.address);
            console.log('\nWallet 1 Balance:', updatedBalance1);

            // Ensure pending transactions are received before sending
            console.log('\n3. Checking and receiving any pending transactions before sending...');
            await mcp.receivePending(wallet1.address, wallet1.privateKey);
            
            // Get final balance before sending
            const finalBalance1 = await mcp.getBalance(wallet1.address);
            console.log('Wallet 1 Final Balance before sending:', finalBalance1);

            // Send from wallet1 to wallet2
            console.log('\n4. Sending funds from Wallet 1 to Wallet 2...');
            const sendResult = await mcp.sendTransaction(
                wallet1.address,
                wallet1.privateKey,
                wallet2.address,
                finalBalance1.balance
            );

            expect(sendResult.success).toBe(true);
            console.log('Transaction successful! Hash:', sendResult.hash);

            // Wait for transaction to process and check periodically
            console.log('\nWaiting for transaction to process...');
            let received = false;
            for (let i = 0; i < 6; i++) {
                try {
                    await sleep(10000);
                    console.log('Checking wallet 2 for pending transactions...');
                    await mcp.receivePending(wallet2.address, wallet2.privateKey);
                    const balance2 = await mcp.getBalance(wallet2.address);
                    if (balance2.balance !== '0') {
                        received = true;
                        break;
                    }
                } catch (error) {
                    console.error('Error during transaction check:', error);
                }
            }

            // Check wallet2 balance
            const balance2 = await mcp.getBalance(wallet2.address);
            console.log('Wallet 2 Balance:', balance2);

            expect(received).toBe(true);

            // Send back to wallet1
            console.log('\n5. Sending funds back to Wallet 1...');
            const sendBackResult = await mcp.sendTransaction(
                wallet2.address,
                wallet2.privateKey,
                wallet1.address,
                balance2.balance
            );

            expect(sendBackResult.success).toBe(true);
            console.log('Transaction successful! Hash:', sendBackResult.hash);

            // Wait and check for receiving in wallet1
            console.log('\nWaiting for final transaction to process...');
            received = false;
            for (let i = 0; i < 6; i++) {
                try {
                    await sleep(10000);
                    console.log('Checking wallet 1 for pending transactions...');
                    await mcp.receivePending(wallet1.address, wallet1.privateKey);
                    const finalBalance = await mcp.getBalance(wallet1.address);
                    if (finalBalance.balance !== '0') {
                        received = true;
                        break;
                    }
                } catch (error) {
                    console.error('Error during final transaction check:', error);
                }
            }

            // Final balance check
            const finalBalance1After = await mcp.getBalance(wallet1.address);
            const finalBalance2 = await mcp.getBalance(wallet2.address);

            console.log('\n=== Final Balances ===');
            console.log('Wallet 1:', finalBalance1After);
            console.log('Wallet 2:', finalBalance2);

        } catch (error) {
            console.error('\nTest failed:', error);
            throw error;
        }
    }, 300000); // 5 minute timeout
}); 