import dotenv from 'dotenv';
import { WalletService } from '../wallet/wallet-service';
import qrcode from 'qrcode-terminal';
import { beforeAll, afterAll, describe, expect, jest, test } from '@jest/globals';

dotenv.config();

jest.setTimeout(240000); // 4 minutes timeout

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function printWalletInfo(wallet: any) {
    console.log('\n============================================================');
    console.log('                     WALLET DETAILS                          ');
    console.log('============================================================');
    console.log('Address:', wallet.address);
    console.log('Public Key:', wallet.publicKey);
    console.log('Private Key:', wallet.privateKey);
    console.log('Seed:', wallet.seed);
    console.log('============================================================\n');
}

function printDebugInfo(message: string, data: any) {
    console.log('\n[DEBUG]', message);
    console.log(JSON.stringify(data, null, 2));
    console.log('------------------------------------------------------------\n');
}

describe('NANO Wallet Tests', () => {
    let walletService: WalletService;
    let wallet1: any;
    let wallet2: any;
    let cleanupInterval: ReturnType<typeof setInterval> | null = null;

    beforeAll(() => {
        walletService = new WalletService();
    });

    afterAll(() => {
        if (cleanupInterval) {
            clearInterval(cleanupInterval);
        }
    });

    test('Full wallet scenario test', async () => {
        try {
            console.clear();
            console.log('\n=== Starting NANO Wallet Test ===\n');
            
            // Create first wallet with validation
            console.log('1. Creating first wallet...\n');
            wallet1 = await walletService.generateWallet();
            expect(wallet1).toBeTruthy();
            expect(wallet1.address).toBeTruthy();
            
            // Verify the generated wallet
            const isValid1 = await walletService.keyManager.verifyKeyPair(wallet1.privateKey, wallet1.publicKey);
            expect(isValid1).toBe(true);
            
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

            cleanupInterval = setInterval(() => {
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
                    console.error('Error during balance check:', error instanceof Error ? error.message : 'Unknown error');
                }

                if (!receivedFunds) {
                    await sleep(10000);
                    timeLeft -= 10;
                }
            }
            
            clearInterval(cleanupInterval);
            cleanupInterval = null;
            
            if (!receivedFunds) {
                throw new Error('No funds received within the timeout period.');
            }

            // Create second wallet with validation
            console.log('\n2. Creating second wallet...');
            wallet2 = await walletService.generateWallet();
            expect(wallet2).toBeTruthy();
            expect(wallet2.address).toBeTruthy();
            
            // Verify the second wallet
            const isValid2 = await walletService.keyManager.verifyKeyPair(wallet2.privateKey, wallet2.publicKey);
            expect(isValid2).toBe(true);
            
            console.log('\n=== Wallet 2 Address ===');
            console.log(wallet2.address);

            // Get updated balance after receiving
            const updatedBalance1 = await walletService.getBalance(wallet1.address);
            console.log('\nWallet 1 Balance:', updatedBalance1);
            expect(updatedBalance1.balance).not.toBe('0');

            // Ensure pending transactions are received before sending
            console.log('\n3. Checking and receiving any pending transactions before sending...');
            await walletService.receivePending(wallet1.address, wallet1.privateKey);
            
            // Get final balance before sending
            const finalBalance1 = await walletService.getBalance(wallet1.address);
            console.log('Wallet 1 Final Balance before sending:', finalBalance1);
            expect(finalBalance1.balance).not.toBe('0');

            // Send from wallet1 to wallet2
            console.log('\n4. Sending funds from Wallet 1 to Wallet 2...');
            const sendResult = await walletService.sendTransaction(
                wallet1.address,
                wallet1.privateKey,
                wallet2.address,
                finalBalance1.balance
            );

            expect(sendResult.success).toBe(true);
            expect(sendResult.hash).toBeTruthy();
            console.log('Transaction successful! Hash:', sendResult.hash);

            // Wait for transaction to process and check periodically
            console.log('\nWaiting for transaction to process...');
            let received = false;
            for (let i = 0; i < 6 && !received; i++) {
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
                    console.error('Error during transaction check:', error instanceof Error ? error.message : 'Unknown error');
                }
            }

            // Check wallet2 balance
            const balance2 = await walletService.getBalance(wallet2.address);
            console.log('Wallet 2 Balance:', balance2);
            expect(balance2.balance).not.toBe('0');

            if (!received) {
                throw new Error('Failed to receive funds in wallet 2.');
            }

            // Send back to wallet1
            console.log('\n5. Sending funds back to Wallet 1...');
            const sendBackResult = await walletService.sendTransaction(
                wallet2.address,
                wallet2.privateKey,
                wallet1.address,
                balance2.balance
            );

            expect(sendBackResult.success).toBe(true);
            expect(sendBackResult.hash).toBeTruthy();
            console.log('Transaction successful! Hash:', sendBackResult.hash);

            // Wait and check for receiving in wallet1
            console.log('\nWaiting for final transaction to process...');
            received = false;
            for (let i = 0; i < 6 && !received; i++) {
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
                    console.error('Error during final transaction check:', error instanceof Error ? error.message : 'Unknown error');
                }
            }

            // Final balance check
            const finalBalance1After = await walletService.getBalance(wallet1.address);
            const finalBalance2 = await walletService.getBalance(wallet2.address);

            console.log('\n=== Final Balances ===');
            console.log('Wallet 1:', finalBalance1After);
            console.log('Wallet 2:', finalBalance2);

            expect(finalBalance1After.balance).not.toBe('0');
            expect(finalBalance2.balance).toBe('0');

        } catch (error) {
            if (cleanupInterval) {
                clearInterval(cleanupInterval);
                cleanupInterval = null;
            }
            console.error('\nTest failed:', error instanceof Error ? error.message : 'Unknown error');
            console.error('Stack trace:', error instanceof Error ? error.stack : '');
            throw error;
        }
    });
}); 