import { NanoTransactions } from '../src/utils/nano-transactions';
import { isValidXNOAddress, isValidPrivateKey, isValidWork } from '../src/helpers/validators';
import dotenv from 'dotenv';
dotenv.config();
async function testNanoUtils() {
    console.log('\n=== NANO Utils Test Suite ===\n');
    const nano = new NanoTransactions({
        apiUrl: process.env.RPC_URL || 'https://rpc.nano.to/',
        rpcKey: process.env.RPC_KEY,
        gpuKey: process.env.GPU_KEY || 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23'
    });
    // Test 1: Validation Functions
    console.log('Test 1: Validation Functions');
    try {
        const validAddress = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
        const invalidAddress = 'invalid_address';
        console.log('Valid address:', isValidXNOAddress(validAddress));
        console.log('Invalid address:', isValidXNOAddress(invalidAddress));
        const validPrivateKey = 'A000000000000000000000000000000000000000000000000000000000000000';
        const invalidPrivateKey = 'invalid_key';
        console.log('Valid private key:', isValidPrivateKey(validPrivateKey));
        console.log('Invalid private key:', isValidPrivateKey(invalidPrivateKey));
    }
    catch (error) {
        console.error('Validation test failed:', error);
    }
    // Test 2: Generate Work
    console.log('\nTest 2: Generate Work');
    try {
        const hash = '000000000000000000000000000000000000000000000000000000000000000A';
        const work = await nano.generateWork(hash);
        console.log('Generated work:', work);
        console.log('Work is valid:', isValidWork(work));
    }
    catch (error) {
        console.error('Work generation failed:', error);
    }
    // Test 3: Get Account Info
    console.log('\nTest 3: Get Account Info');
    try {
        const account = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
        const info = await nano.getAccountInfo(account);
        console.log('Account info:', info);
    }
    catch (error) {
        console.error('Get account info failed:', error);
    }
    // Test 4: Get Pending Blocks
    console.log('\nTest 4: Get Pending Blocks');
    try {
        const account = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
        const pending = await nano.getPendingBlocks(account);
        console.log('Pending blocks:', pending);
    }
    catch (error) {
        console.error('Get pending blocks failed:', error);
    }
    // Test 5: Create Open Block (requires private key and source block)
    if (process.env.TEST_OPEN === 'true') {
        console.log('\nTest 5: Create Open Block');
        try {
            const address = process.env.TEST_ADDRESS;
            const privateKey = process.env.TEST_PRIVATE_KEY;
            const sourceBlock = process.env.TEST_SOURCE_BLOCK;
            const sourceAmount = process.env.TEST_SOURCE_AMOUNT || '0.0001';
            if (!address || !privateKey || !sourceBlock) {
                throw new Error('Missing required environment variables for open block test');
            }
            const result = await nano.createOpenBlock(address, privateKey, sourceBlock, sourceAmount);
            console.log('Open block result:', result);
        }
        catch (error) {
            console.error('Open block creation failed:', error);
        }
    }
    // Test 6: Send Transaction (requires funding)
    if (process.env.TEST_SEND === 'true') {
        console.log('\nTest 6: Send Transaction');
        try {
            const fromAddress = process.env.SOURCE_ADDRESS;
            const privateKey = process.env.SOURCE_PRIVATE_KEY;
            const toAddress = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
            const amount = '0.00001';
            if (!fromAddress || !privateKey) {
                throw new Error('Missing required environment variables for send test');
            }
            const accountInfo = await nano.getAccountInfo(fromAddress);
            if (accountInfo.error) {
                throw new Error(`Failed to get account info: ${accountInfo.error}`);
            }
            const result = await nano.createSendBlock(fromAddress, privateKey, toAddress, amount, accountInfo);
            console.log('Send transaction result:', result);
        }
        catch (error) {
            console.error('Send transaction failed:', error);
        }
    }
    // Test 7: Receive Transaction (requires pending blocks)
    if (process.env.TEST_RECEIVE === 'true') {
        console.log('\nTest 7: Receive Transaction');
        try {
            const address = process.env.RECEIVE_ADDRESS;
            const privateKey = process.env.RECEIVE_PRIVATE_KEY;
            if (!address || !privateKey) {
                throw new Error('Missing required environment variables for receive test');
            }
            const result = await nano.receiveAllPending(address, privateKey);
            console.log('Receive transaction result:', result);
        }
        catch (error) {
            console.error('Receive transaction failed:', error);
        }
    }
    console.log('\n=== NANO Utils Test Suite Complete ===');
}
testNanoUtils().catch(error => {
    console.error('\nError during utils test:', error);
    process.exit(1);
});
