const { makeRPCCall, makeRPCCallWithRetry } = require('../utils/rpc-helper');

// RPC Server Configuration
const RPC_URL = 'https://node.somenano.com/proxy';

// Test account for verification
const TEST_ADDRESS = 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf';

/**
 * Test basic connectivity to the RPC server
 */
async function testConnectivity() {
    console.log('\n=== Testing RPC Server Connectivity ===');
    console.log(`Target: ${RPC_URL}`);
    
    try {
        console.log('\n[Test 1] Testing block_count...');
        const blockCountResult = await makeRPCCall(RPC_URL, {
            action: 'block_count'
        });
        console.log('✓ block_count successful');
        console.log('Response:', JSON.stringify(blockCountResult, null, 2));
        return true;
    } catch (error) {
        console.error('✗ Connectivity test failed:', error.message);
        return false;
    }
}

/**
 * Test version RPC call
 */
async function testVersion() {
    console.log('\n=== Testing version ===');
    
    try {
        const versionResult = await makeRPCCall(RPC_URL, {
            action: 'version'
        });
        console.log('✓ version successful');
        console.log('Response:', JSON.stringify(versionResult, null, 2));
        return true;
    } catch (error) {
        console.error('✗ version test failed:', error.message);
        return false;
    }
}

/**
 * Test account_info RPC call
 */
async function testAccountInfo() {
    console.log('\n=== Testing account_info ===');
    
    try {
        console.log(`Testing with address: ${TEST_ADDRESS}`);
        const accountInfoResult = await makeRPCCall(RPC_URL, {
            action: 'account_info',
            account: TEST_ADDRESS,
            representative: true,
            pending: true,
            weight: true
        });
        console.log('✓ account_info successful');
        console.log('Response:', JSON.stringify(accountInfoResult, null, 2));
        return true;
    } catch (error) {
        console.error('✗ account_info test failed:', error.message);
        return false;
    }
}

/**
 * Test pending blocks
 */
async function testPendingBlocks() {
    console.log('\n=== Testing pending blocks ===');
    
    try {
        const pendingResult = await makeRPCCall(RPC_URL, {
            action: 'pending',
            account: TEST_ADDRESS,
            count: 10
        });
        console.log('✓ pending blocks successful');
        console.log('Response:', JSON.stringify(pendingResult, null, 2));
        return true;
    } catch (error) {
        console.error('✗ pending blocks test failed:', error.message);
        return false;
    }
}

/**
 * Test work generation (if supported)
 */
async function testWorkGeneration() {
    console.log('\n=== Testing work generation ===');
    
    try {
        // Use a test hash
        const testHash = '0000000000000000000000000000000000000000000000000000000000000000';
        const workResult = await makeRPCCall(RPC_URL, {
            action: 'work_generate',
            hash: testHash
        });
        console.log('✓ work generation successful');
        console.log('Response:', JSON.stringify(workResult, null, 2));
        return true;
    } catch (error) {
        console.error('✗ work generation test failed:', error.message);
        console.log('Note: Work generation may not be supported on this node');
        return false;
    }
}

/**
 * Test with retry logic
 */
async function testWithRetry() {
    console.log('\n=== Testing with retry logic ===');
    
    try {
        const result = await makeRPCCallWithRetry(RPC_URL, {
            action: 'block_count'
        }, null, 3);
        console.log('✓ Retry test successful');
        console.log('Response:', JSON.stringify(result, null, 2));
        return true;
    } catch (error) {
        console.error('✗ Retry test failed:', error.message);
        return false;
    }
}

/**
 * Test account_balance
 */
async function testAccountBalance() {
    console.log('\n=== Testing account_balance ===');
    
    try {
        const balanceResult = await makeRPCCall(RPC_URL, {
            action: 'account_balance',
            account: TEST_ADDRESS
        });
        console.log('✓ account_balance successful');
        console.log('Response:', JSON.stringify(balanceResult, null, 2));
        return true;
    } catch (error) {
        console.error('✗ account_balance test failed:', error.message);
        return false;
    }
}

/**
 * Test representatives
 */
async function testRepresentatives() {
    console.log('\n=== Testing representatives ===');
    
    try {
        const repsResult = await makeRPCCall(RPC_URL, {
            action: 'representatives',
            count: 10
        });
        console.log('✓ representatives successful');
        console.log('Response:', JSON.stringify(repsResult, null, 2));
        return true;
    } catch (error) {
        console.error('✗ representatives test failed:', error.message);
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('========================================');
    console.log('RPC Server Test Suite');
    console.log(`Target Server: ${RPC_URL}`);
    console.log('========================================');
    
    const results = {
        connectivity: false,
        version: false,
        accountInfo: false,
        accountBalance: false,
        pendingBlocks: false,
        representatives: false,
        workGeneration: false,
        retry: false
    };
    
    try {
        // Test 1: Basic connectivity
        results.connectivity = await testConnectivity();
        
        // Test 2: Version
        results.version = await testVersion();
        
        // Test 3: Account balance
        results.accountBalance = await testAccountBalance();
        
        // Test 4: Account info
        results.accountInfo = await testAccountInfo();
        
        // Test 5: Pending blocks
        results.pendingBlocks = await testPendingBlocks();
        
        // Test 6: Representatives
        results.representatives = await testRepresentatives();
        
        // Test 7: Work generation (may fail)
        results.workGeneration = await testWorkGeneration();
        
        // Test 8: Retry logic
        results.retry = await testWithRetry();
        
    } catch (error) {
        console.error('\n✗ Critical error during testing:', error);
    }
    
    // Print summary
    console.log('\n========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Connectivity:        ${results.connectivity ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Version:             ${results.version ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Account Balance:     ${results.accountBalance ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Account Info:        ${results.accountInfo ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Pending Blocks:      ${results.pendingBlocks ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Representatives:     ${results.representatives ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Work Generation:     ${results.workGeneration ? '✓ PASS' : '✗ FAIL (may be expected)'}`);
    console.log(`Retry Logic:         ${results.retry ? '✓ PASS' : '✗ FAIL'}`);
    
    const passedTests = Object.values(results).filter(r => r).length;
    const totalTests = Object.keys(results).length;
    
    console.log('\n========================================');
    console.log(`Results: ${passedTests}/${totalTests} tests passed`);
    console.log('========================================');
    
    if (results.connectivity) {
        console.log('\n✓ RPC Server is accessible and responding');
        console.log(`✓ Working RPC URL: ${RPC_URL}`);
    } else {
        console.log('\n✗ RPC Server is not accessible or not responding correctly');
    }
}

// Run tests
runAllTests().catch(console.error);

