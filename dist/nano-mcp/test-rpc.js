import fetch from 'node-fetch';
import { checkAddress, convert, Unit } from 'nanocurrency';
// Default RPC endpoint
const DEFAULT_RPC_URL = 'https://node.somenano.com/proxy';
// RPC helper function with improved error handling
async function rpcCall(action, params = {}, rpcUrl = DEFAULT_RPC_URL) {
    console.log(`Making RPC call: ${action}`, params);
    try {
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...params }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        console.log('RPC Response:', data);
        if (data.error) {
            throw new Error(`RPC error: ${data.error}`);
        }
        return data;
    }
    catch (error) {
        console.error(`Failed to execute RPC call ${action}:`, error.message);
        throw error;
    }
}
// Test functions
async function testAccountBalance() {
    console.log('\nTesting account_balance...');
    const account = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
    const result = await rpcCall('account_balance', { account });
    // Convert raw to NANO
    const balanceNano = convert(result.balance, {
        from: Unit.raw,
        to: Unit.NANO,
    });
    console.log('Balance in NANO:', balanceNano);
    return result;
}
async function testAccountInfo() {
    console.log('\nTesting account_info...');
    const account = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
    return await rpcCall('account_info', { account });
}
async function testBlockCount() {
    console.log('\nTesting block_count...');
    return await rpcCall('block_count');
}
async function testVersion() {
    console.log('\nTesting version...');
    return await rpcCall('version');
}
async function testRepresentatives() {
    console.log('\nTesting representatives_online...');
    return await rpcCall('representatives_online');
}
// Run tests
async function runTests() {
    try {
        console.log('Starting RPC tests...\n');
        const tests = [
            testBlockCount,
            testAccountBalance,
            testAccountInfo,
            testVersion,
            testRepresentatives
        ];
        for (const test of tests) {
            try {
                await test();
            }
            catch (error) {
                console.error(`Test ${test.name} failed:`, error.message);
            }
            console.log('-------------------');
        }
        console.log('\nRPC tests completed.');
    }
    catch (error) {
        console.error('Test suite failed:', error.message);
    }
}
runTests();
