import { wallet, tools, block } from 'nanocurrency-web';
import { Logger } from './logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function testWalletTransfer() {
    // Initialize logger
    const logger = new Logger(path.join(__dirname, 'logs'));
    try {
        logger.log('TEST_START', 'Starting Wallet Transfer Test');
        // Step 1: Create first wallet
        logger.log('WALLET1_CREATE', 'Creating first wallet');
        const wallet1 = await wallet.generate();
        const wallet1Account = wallet1.accounts[0];
        logger.log('WALLET1_CREATED', {
            address: wallet1Account.address,
            publicKey: wallet1Account.publicKey
        });
        console.log('\n=== WALLET 1 ADDRESS ===');
        console.log('Please send exactly 0.00001 NANO to this address:');
        console.log(wallet1Account.address);
        console.log('Waiting for funds...');
        // Step 2: Wait and check for incoming transaction
        logger.log('WAITING_FOR_FUNDS', 'Waiting for incoming transaction');
        let funded = false;
        let startTime = Date.now();
        const timeoutMs = 60000; // 1 minute timeout
        while (!funded && (Date.now() - startTime) < timeoutMs) {
            try {
                const response = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'account_info',
                        account: wallet1Account.address
                    })
                });
                const data = await response.json();
                if (data.balance) {
                    const balanceNano = tools.convert(data.balance, 'RAW', 'NANO');
                    logger.log('FUNDS_RECEIVED', {
                        account: wallet1Account.address,
                        balance: balanceNano
                    });
                    funded = true;
                }
                else {
                    await sleep(5000); // Check every 5 seconds
                    process.stdout.write('.');
                }
            }
            catch (error) {
                logger.logError('CHECK_BALANCE_ERROR', error);
                await sleep(5000);
                process.stdout.write('x');
            }
        }
        if (!funded) {
            throw new Error('Timeout waiting for funds');
        }
        // Step 3: Create second wallet
        logger.log('WALLET2_CREATE', 'Creating second wallet');
        const wallet2 = await wallet.generate();
        const wallet2Account = wallet2.accounts[0];
        logger.log('WALLET2_CREATED', {
            address: wallet2Account.address,
            publicKey: wallet2Account.publicKey
        });
        // Step 4: Get pending blocks for wallet1
        logger.log('CHECKING_PENDING', 'Checking pending blocks for wallet 1');
        const pendingResponse = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'pending',
                account: wallet1Account.address,
                count: '1',
                source: true
            })
        });
        const pendingData = await pendingResponse.json();
        if (!pendingData.blocks || Object.keys(pendingData.blocks).length === 0) {
            throw new Error('No pending blocks found');
        }
        // Step 5: Receive the pending block
        logger.log('RECEIVING_BLOCK', 'Receiving pending block in wallet 1');
        const [blockHash, blockInfo] = Object.entries(pendingData.blocks)[0];
        const receiveBlockData = {
            walletBalanceRaw: '0',
            toAddress: wallet1Account.address,
            representativeAddress: process.env.REPRESENTATIVE || 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou',
            frontier: '0000000000000000000000000000000000000000000000000000000000000000',
            transactionHash: blockHash,
            amountRaw: blockInfo.amount
        };
        const signedReceiveBlock = block.receive(receiveBlockData, wallet1Account.privateKey);
        const processReceiveResponse = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'process',
                json_block: 'true',
                subtype: 'receive',
                block: signedReceiveBlock
            })
        });
        const receiveResult = await processReceiveResponse.json();
        logger.log('BLOCK_RECEIVED', {
            hash: receiveResult.hash
        });
        // Step 6: Send to wallet2
        logger.log('SENDING_TO_WALLET2', 'Sending funds from wallet 1 to wallet 2');
        const accountInfoResponse = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'account_info',
                account: wallet1Account.address
            })
        });
        const accountInfo = await accountInfoResponse.json();
        const sendBlockData = {
            walletBalanceRaw: accountInfo.balance,
            fromAddress: wallet1Account.address,
            toAddress: wallet2Account.address,
            representativeAddress: accountInfo.representative,
            frontier: accountInfo.frontier,
            amountRaw: tools.convert('0.00001', 'NANO', 'RAW')
        };
        const signedSendBlock = block.send(sendBlockData, wallet1Account.privateKey);
        const processSendResponse = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'process',
                json_block: 'true',
                subtype: 'send',
                block: signedSendBlock
            })
        });
        const sendResult = await processSendResponse.json();
        logger.log('SENT_TO_WALLET2', {
            hash: sendResult.hash,
            from: wallet1Account.address,
            to: wallet2Account.address,
            amount: '0.00001'
        });
        // Step 7: Receive in wallet2
        logger.log('RECEIVING_IN_WALLET2', 'Receiving funds in wallet 2');
        await sleep(5000); // Wait for transaction to propagate
        const pending2Response = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'pending',
                account: wallet2Account.address,
                count: '1',
                source: true
            })
        });
        const pending2Data = await pending2Response.json();
        if (!pending2Data.blocks || Object.keys(pending2Data.blocks).length === 0) {
            throw new Error('No pending blocks found for wallet 2');
        }
        const [blockHash2, blockInfo2] = Object.entries(pending2Data.blocks)[0];
        const receiveBlock2Data = {
            walletBalanceRaw: '0',
            toAddress: wallet2Account.address,
            representativeAddress: process.env.REPRESENTATIVE || 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou',
            frontier: '0000000000000000000000000000000000000000000000000000000000000000',
            transactionHash: blockHash2,
            amountRaw: blockInfo2.amount
        };
        const signedReceiveBlock2 = block.receive(receiveBlock2Data, wallet2Account.privateKey);
        const processReceive2Response = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'process',
                json_block: 'true',
                subtype: 'receive',
                block: signedReceiveBlock2
            })
        });
        const receive2Result = await processReceive2Response.json();
        logger.log('RECEIVED_IN_WALLET2', {
            hash: receive2Result.hash
        });
        // Step 8: Send back to wallet1
        logger.log('SENDING_BACK_TO_WALLET1', 'Sending funds back to wallet 1');
        const account2InfoResponse = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'account_info',
                account: wallet2Account.address
            })
        });
        const account2Info = await account2InfoResponse.json();
        const sendBack2Data = {
            walletBalanceRaw: account2Info.balance,
            fromAddress: wallet2Account.address,
            toAddress: wallet1Account.address,
            representativeAddress: account2Info.representative,
            frontier: account2Info.frontier,
            amountRaw: tools.convert('0.00001', 'NANO', 'RAW')
        };
        const signedSendBack2Block = block.send(sendBack2Data, wallet2Account.privateKey);
        const processSendBack2Response = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'process',
                json_block: 'true',
                subtype: 'send',
                block: signedSendBack2Block
            })
        });
        const sendBack2Result = await processSendBack2Response.json();
        logger.log('SENT_TO_WALLET1', {
            hash: sendBack2Result.hash,
            from: wallet2Account.address,
            to: wallet1Account.address,
            amount: '0.00001'
        });
        // Step 9: Receive back in wallet1
        logger.log('RECEIVING_BACK_IN_WALLET1', 'Receiving funds back in wallet 1');
        await sleep(5000); // Wait for transaction to propagate
        const pending3Response = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'pending',
                account: wallet1Account.address,
                count: '1',
                source: true
            })
        });
        const pending3Data = await pending3Response.json();
        if (!pending3Data.blocks || Object.keys(pending3Data.blocks).length === 0) {
            throw new Error('No pending blocks found for final receive');
        }
        const [blockHash3, blockInfo3] = Object.entries(pending3Data.blocks)[0];
        const receiveBlock3Data = {
            walletBalanceRaw: accountInfo.balance,
            toAddress: wallet1Account.address,
            representativeAddress: accountInfo.representative,
            frontier: accountInfo.frontier,
            transactionHash: blockHash3,
            amountRaw: blockInfo3.amount
        };
        const signedReceiveBlock3 = block.receive(receiveBlock3Data, wallet1Account.privateKey);
        const processReceive3Response = await fetch(process.env.NODE_URL || 'https://proxy.nanos.cc/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'process',
                json_block: 'true',
                subtype: 'receive',
                block: signedReceiveBlock3
            })
        });
        const receive3Result = await processReceive3Response.json();
        logger.log('RECEIVED_BACK_IN_WALLET1', {
            hash: receive3Result.hash
        });
        // Test Summary
        const testResults = {
            total: 9,
            passed: 9,
            failed: 0,
            duration: Date.now() - startTime,
            wallet1: {
                address: wallet1Account.address,
                privateKey: wallet1Account.privateKey
            },
            wallet2: {
                address: wallet2Account.address
            }
        };
        logger.summarize(testResults);
        logger.log('TEST_COMPLETE', 'Wallet Transfer Test completed successfully');
    }
    catch (error) {
        logger.logError('TEST_FAILURE', error);
        throw error;
    }
}
// Run the test
testWalletTransfer().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
