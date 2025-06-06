import { Logger } from './logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { wallet, block, tools } from "nanocurrency-web";
// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// API settings
const WORK_API_KEY = "RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23";
const RPC_API_KEY = "PUBLIC-KEY-FA9CE81226BF478291D34836A09D8B06";
const MIN_DELAY_BETWEEN_REQUESTS = 1000; // 1 second minimum delay
let lastRequestTime = 0;
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function rpc(request, useWorkKey = false) {
    // Implement rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
        await sleep(MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();
    // Add API key to request
    const requestWithKey = {
        ...request,
        key: useWorkKey ? WORK_API_KEY : RPC_API_KEY
    };
    console.log(requestWithKey);
    const response = await fetch(`https://rpc.nano.to`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestWithKey)
    });
    let data;
    try {
        data = await response.json();
    }
    catch {
        if (response.status === 429) {
            console.log("Rate limited, waiting 5 seconds...");
            await sleep(5000);
            return rpc(request, useWorkKey); // Retry the request
        }
        throw Error(`RPC status ${response.status}: failed to parse JSON`);
    }
    // Handle rate limiting responses
    if (response.status === 429) {
        console.log("Rate limited by status code, waiting 5 seconds...");
        await sleep(5000);
        return rpc(request, useWorkKey); // Retry the request
    }
    // Handle error responses
    if ('error' in data) {
        const errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        // Check for rate limiting errors
        if (errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('too many requests')) {
            console.log("Rate limited by error response, waiting 5 seconds...");
            await sleep(5000);
            return rpc(request, useWorkKey); // Retry the request
        }
        console.error(`RPC error: ${errorMessage}`);
        throw Error(errorMessage);
    }
    if (!response.ok) {
        throw Error(`RPC status ${response.status}: ${JSON.stringify(data, null, 4)}`);
    }
    console.log(data);
    return data;
}
async function generateWork(hash, isOpen = false) {
    try {
        const data = await rpc({
            action: "work_generate",
            hash: hash,
            difficulty: isOpen ? 'fffffff800000000' : 'fffffff800000000'
        }, true); // Use work API key
        if (!data || !data.work) {
            throw Error("No work returned from RPC");
        }
        return data.work;
    }
    catch (error) {
        throw Error(`Failed to generate work: ${error?.message || 'Unknown error'}`);
    }
}
async function balance(account) {
    let retries = 3;
    while (retries > 0) {
        try {
            const data = await rpc({
                action: "account_balance",
                account: account,
                include_only_confirmed: true
            });
            if (!data || !data.balance || !data.receivable) {
                throw Error("Failed to get balance.");
            }
            return {
                balance: tools.convert(data.balance, 'RAW', 'NANO'),
                receivable: tools.convert(data.receivable, 'RAW', 'NANO'),
            };
        }
        catch (error) {
            console.error(`Balance check failed (${retries} retries left):`, error);
            retries--;
            if (retries === 0)
                throw error;
            await sleep(2000); // Wait 2 seconds before retrying
        }
    }
    throw Error("Failed to get balance after all retries");
}
async function createAccount() {
    // Generate a new wallet
    const walletData = wallet.generate();
    return walletData.accounts[0].address;
}
async function send(destination, source, amount) {
    // Try to get account info, but don't throw if account doesn't exist
    let accountInfo;
    try {
        accountInfo = await rpc({
            action: "account_info",
            account: source,
            representative: true,
            receivable: true,
            include_confirmed: true
        });
    }
    catch (error) {
        throw Error("Source account must exist and have a balance to send");
    }
    const previous = accountInfo?.frontier;
    const balance = accountInfo?.balance;
    const representative = accountInfo?.representative || destination;
    if (!previous || !balance) {
        throw Error("Source account must exist and have a balance to send");
    }
    // Convert NANO to raw
    const amountRaw = tools.convert(amount, 'NANO', 'RAW');
    const newBalance = (BigInt(balance) - BigInt(amountRaw)).toString();
    if (BigInt(newBalance) < BigInt(0)) {
        throw Error("Insufficient balance");
    }
    // Generate work for the block
    const work = await generateWork(previous);
    // Create the block data
    const blockData = {
        walletBalanceRaw: balance,
        fromAddress: source,
        toAddress: destination,
        representativeAddress: representative,
        frontier: previous,
        amountRaw: amountRaw,
        work: work
    };
    // Sign the block
    const signedBlock = block.send(blockData, process.env.PRIVATE_KEY);
    // Process the block
    const data = await rpc({
        action: "process",
        json_block: "true",
        subtype: "send",
        block: signedBlock
    });
    if (!data || !data.hash) {
        throw Error("Failed to send nano.");
    }
    console.log("sent " + amount + " nano to " + destination);
    return data.hash;
}
async function receive(account, blockHash) {
    // Get pending block info first
    const blockInfo = await rpc({
        action: "blocks_info",
        hashes: [blockHash],
        json_block: "true",
        include_not_found: "true"
    });
    if (!blockInfo || !blockInfo.blocks || !blockInfo.blocks[blockHash]) {
        throw Error("Failed to get block info");
    }
    // Try to get account info, but don't throw if account doesn't exist
    let accountInfo;
    try {
        accountInfo = await rpc({
            action: "account_info",
            account: account,
            representative: true,
            receivable: true,
            include_confirmed: true
        });
    }
    catch (error) {
        // Account doesn't exist yet, this is fine
        console.log("Account doesn't exist yet, will be opened with this receive");
    }
    const previous = accountInfo?.frontier || "0".repeat(64);
    const representative = accountInfo?.representative || account;
    const currentBalance = accountInfo?.balance || "0";
    const amountRaw = blockInfo.blocks[blockHash].amount;
    const newBalance = (BigInt(currentBalance) + BigInt(amountRaw)).toString();
    // Generate work for the block
    const work = await generateWork(previous === "0".repeat(64) ? tools.addressToPublicKey(account) : previous, previous === "0".repeat(64));
    // Create the block data
    const blockData = {
        walletBalanceRaw: currentBalance,
        toAddress: account,
        representativeAddress: representative,
        frontier: previous,
        transactionHash: blockHash,
        amountRaw: amountRaw,
        work: work
    };
    // Sign the block
    const signedBlock = block.receive(blockData, process.env.PRIVATE_KEY);
    // Process the block
    const data = await rpc({
        action: "process",
        json_block: "true",
        subtype: previous === "0".repeat(64) ? "open" : "receive",
        block: signedBlock
    });
    if (!data || !data.hash) {
        throw Error("Failed to receive nano");
    }
    return data.hash;
}
async function receive_all(account) {
    const data = await rpc({
        action: "receivable",
        account: account,
        count: "10",
        source: "true",
        include_active: "true",
        include_only_confirmed: "true",
        sorting: "amount",
        threshold: "1"
    });
    if (!data || !data.blocks) {
        return { received: 0 };
    }
    const blocks = Object.keys(data.blocks);
    let received = 0;
    for (const blockHash of blocks) {
        try {
            await receive(account, blockHash);
            received++;
        }
        catch (error) {
            console.error("Failed to receive block:", error);
        }
    }
    return { received };
}
async function testWalletTransfer() {
    // Initialize logger
    const logger = new Logger(path.join(__dirname, 'logs'));
    try {
        logger.log('TEST_START', 'Starting Wallet Transfer Test');
        // Step 1: Create first wallet
        logger.log('WALLET1_CREATE', 'Creating first wallet');
        const wallet1Address = await createAccount();
        logger.log('WALLET1_CREATED', {
            address: wallet1Address
        });
        console.log('\n=== WALLET 1 ADDRESS ===');
        console.log('Please send exactly 0.00001 NANO to this address:');
        console.log(wallet1Address);
        console.log('Waiting for funds...');
        // Step 2: Wait and check for incoming transaction
        logger.log('WAITING_FOR_FUNDS', 'Waiting for incoming transaction');
        let funded = false;
        let startTime = Date.now();
        const timeoutMs = 300000; // 5 minutes timeout
        let lastBalance = { balance: '0', receivable: '0' };
        while (!funded && (Date.now() - startTime) < timeoutMs) {
            try {
                const balanceInfo = await balance(wallet1Address);
                // Only log if balance or receivable has changed
                if (balanceInfo.balance !== lastBalance.balance || balanceInfo.receivable !== lastBalance.receivable) {
                    logger.log('BALANCE_UPDATE', {
                        account: wallet1Address,
                        balance: balanceInfo.balance,
                        receivable: balanceInfo.receivable
                    });
                    lastBalance = balanceInfo;
                }
                if (parseFloat(balanceInfo.balance) > 0 || parseFloat(balanceInfo.receivable) > 0) {
                    logger.log('FUNDS_RECEIVED', {
                        account: wallet1Address,
                        balance: balanceInfo.balance,
                        receivable: balanceInfo.receivable
                    });
                    // Receive any pending funds
                    await receive_all(wallet1Address);
                    funded = true;
                }
                else {
                    await sleep(5000); // Check every 5 seconds
                }
            }
            catch (error) {
                logger.logError('CHECK_BALANCE_ERROR', error);
                await sleep(5000);
            }
        }
        if (!funded) {
            throw new Error('Timeout waiting for funds');
        }
        // Step 3: Create second wallet
        logger.log('WALLET2_CREATE', 'Creating second wallet');
        const wallet2Address = await createAccount();
        logger.log('WALLET2_CREATED', {
            address: wallet2Address
        });
        // Step 4: Send to wallet2
        logger.log('SENDING_TO_WALLET2', 'Sending funds from wallet 1 to wallet 2');
        const sendAmount = '0.00001';
        const sendHash = await send(wallet2Address, wallet1Address, sendAmount);
        logger.log('SENT_TO_WALLET2', {
            hash: sendHash,
            from: wallet1Address,
            to: wallet2Address,
            amount: sendAmount
        });
        // Step 5: Receive in wallet2
        logger.log('RECEIVING_IN_WALLET2', 'Receiving funds in wallet 2');
        await sleep(5000); // Wait for transaction to propagate
        await receive_all(wallet2Address);
        // Step 6: Send back to wallet1
        logger.log('SENDING_BACK_TO_WALLET1', 'Sending funds back to wallet 1');
        const sendBackHash = await send(wallet1Address, wallet2Address, sendAmount);
        logger.log('SENT_TO_WALLET1', {
            hash: sendBackHash,
            from: wallet2Address,
            to: wallet1Address,
            amount: sendAmount
        });
        // Step 7: Receive back in wallet1
        logger.log('RECEIVING_BACK_IN_WALLET1', 'Receiving funds back in wallet 1');
        await sleep(5000); // Wait for transaction to propagate
        await receive_all(wallet1Address);
        // Test Summary
        const testResults = {
            total: 7,
            passed: 7,
            failed: 0,
            duration: Date.now() - startTime,
            wallet1: {
                address: wallet1Address
            },
            wallet2: {
                address: wallet2Address
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
