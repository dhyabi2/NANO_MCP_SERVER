const { makeRPCCall, makeRPCCallWithRetry } = require('../utils/rpc-helper');
const http = require('http');
const https = require('https');
const net = require('net');

// RPC Server Configuration
const RPC_IP = '92.113.148.61';
const RPC_PORT = 45000;
const RPC_URL_HTTP = `http://${RPC_IP}:${RPC_PORT}`;
const RPC_URL_HTTPS = `https://${RPC_IP}:${RPC_PORT}`;

// Test account for verification (using a known Nano address)
const TEST_ADDRESS = 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf';

/**
 * Test TCP port connectivity
 */
async function testPortConnectivity() {
    console.log('\n=== Testing TCP Port Connectivity ===');
    console.log(`Testing connection to ${RPC_IP}:${RPC_PORT}...`);
    
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = 5000;
        
        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
            console.log('✓ Port is open and accepting connections');
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            console.log('✗ Connection timeout - port may be closed or firewalled');
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', (error) => {
            console.log(`✗ Connection error: ${error.message}`);
            console.log(`  Error code: ${error.code}`);
            if (error.code === 'ECONNREFUSED') {
                console.log('  → Server is not listening on this port or is not running');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('  → Connection timed out - port may be firewalled');
            } else if (error.code === 'EHOSTUNREACH') {
                console.log('  → Host is unreachable');
            }
            resolve(false);
        });
        
        socket.connect(RPC_PORT, RPC_IP);
    });
}

/**
 * Test basic connectivity to the RPC server (tries both HTTP and HTTPS)
 */
async function testConnectivity() {
    console.log('\n=== Testing RPC Server Connectivity ===');
    
    // Try HTTP first
    console.log(`\n[Test 1a] Testing HTTP: ${RPC_URL_HTTP}`);
    try {
        const blockCountResult = await makeRPCCall(RPC_URL_HTTP, {
            action: 'block_count'
        });
        console.log('✓ HTTP connection successful');
        console.log('Response:', JSON.stringify(blockCountResult, null, 2));
        return { success: true, protocol: 'http', url: RPC_URL_HTTP };
    } catch (error) {
        console.log(`✗ HTTP failed: ${error.message}`);
    }
    
    // Try HTTPS
    console.log(`\n[Test 1b] Testing HTTPS: ${RPC_URL_HTTPS}`);
    try {
        const blockCountResult = await makeRPCCall(RPC_URL_HTTPS, {
            action: 'block_count'
        });
        console.log('✓ HTTPS connection successful');
        console.log('Response:', JSON.stringify(blockCountResult, null, 2));
        return { success: true, protocol: 'https', url: RPC_URL_HTTPS };
    } catch (error) {
        console.log(`✗ HTTPS failed: ${error.message}`);
    }
    
    return { success: false, protocol: null, url: null };
}

/**
 * Test account_info RPC call
 */
async function testAccountInfo(rpcUrl) {
    console.log('\n=== Testing account_info ===');
    
    if (!rpcUrl) {
        console.log('✗ Skipping - no working RPC URL found');
        return false;
    }
    
    try {
        console.log(`Testing with address: ${TEST_ADDRESS}`);
        const accountInfoResult = await makeRPCCall(rpcUrl, {
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
 * Test version RPC call
 */
async function testVersion(rpcUrl) {
    console.log('\n=== Testing version ===');
    
    if (!rpcUrl) {
        console.log('✗ Skipping - no working RPC URL found');
        return false;
    }
    
    try {
        const versionResult = await makeRPCCall(rpcUrl, {
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
 * Test pending blocks
 */
async function testPendingBlocks(rpcUrl) {
    console.log('\n=== Testing pending blocks ===');
    
    if (!rpcUrl) {
        console.log('✗ Skipping - no working RPC URL found');
        return false;
    }
    
    try {
        const pendingResult = await makeRPCCall(rpcUrl, {
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
async function testWorkGeneration(rpcUrl) {
    console.log('\n=== Testing work generation ===');
    
    if (!rpcUrl) {
        console.log('✗ Skipping - no working RPC URL found');
        return false;
    }
    
    try {
        // Use a test hash
        const testHash = '0000000000000000000000000000000000000000000000000000000000000000';
        const workResult = await makeRPCCall(rpcUrl, {
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
async function testWithRetry(rpcUrl) {
    console.log('\n=== Testing with retry logic ===');
    
    if (!rpcUrl) {
        console.log('✗ Skipping - no working RPC URL found');
        return false;
    }
    
    try {
        const result = await makeRPCCallWithRetry(rpcUrl, {
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
 * Test RPC with custom timeout
 */
async function testWithCustomTimeout(rpcUrl) {
    console.log('\n=== Testing custom timeout ===');
    
    if (!rpcUrl) {
        console.log('✗ Skipping - no working RPC URL found');
        return false;
    }
    
    return new Promise((resolve, reject) => {
        const url = require('url');
        const parsedUrl = url.parse(rpcUrl);
        const httpModule = parsedUrl.protocol === 'https:' ? https : http;
        
        const requestBody = JSON.stringify({
            action: 'block_count'
        });
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname || '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            timeout: 5000, // 5 second timeout
            rejectUnauthorized: false // Allow self-signed certificates for HTTPS
        };
        
        const req = httpModule.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonResponse = JSON.parse(responseData);
                    console.log('✓ Custom timeout test successful');
                    console.log('Response:', JSON.stringify(jsonResponse, null, 2));
                    resolve(true);
                } catch (error) {
                    console.error('✗ Failed to parse response:', error.message);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('✗ Request error:', error.message);
            reject(error);
        });
        
        req.on('timeout', () => {
            console.error('✗ Request timeout');
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.write(requestBody);
        req.end();
    });
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('========================================');
    console.log('RPC Server Test Suite');
    console.log(`Target Server: ${RPC_IP}:${RPC_PORT}`);
    console.log('========================================');
    
    const results = {
        portConnectivity: false,
        connectivity: false,
        version: false,
        accountInfo: false,
        pendingBlocks: false,
        workGeneration: false,
        retry: false,
        customTimeout: false
    };
    
    let workingRpcUrl = null;
    
    try {
        // Test 0: TCP port connectivity
        results.portConnectivity = await testPortConnectivity();
        
        // Test 1: Basic connectivity (tries HTTP and HTTPS)
        const connectivityResult = await testConnectivity();
        results.connectivity = connectivityResult.success;
        workingRpcUrl = connectivityResult.url;
        
        if (workingRpcUrl) {
            console.log(`\n✓ Found working RPC URL: ${workingRpcUrl}`);
            
            // Test 2: Version
            results.version = await testVersion(workingRpcUrl);
            
            // Test 3: Account info
            results.accountInfo = await testAccountInfo(workingRpcUrl);
            
            // Test 4: Pending blocks
            results.pendingBlocks = await testPendingBlocks(workingRpcUrl);
            
            // Test 5: Work generation (may fail)
            results.workGeneration = await testWorkGeneration(workingRpcUrl);
            
            // Test 6: Retry logic
            results.retry = await testWithRetry(workingRpcUrl);
            
            // Test 7: Custom timeout
            results.customTimeout = await testWithCustomTimeout(workingRpcUrl);
        } else {
            console.log('\n✗ No working RPC URL found. Skipping RPC-specific tests.');
        }
        
    } catch (error) {
        console.error('\n✗ Critical error during testing:', error);
    }
    
    // Print summary
    console.log('\n========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Port Connectivity:   ${results.portConnectivity ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`RPC Connectivity:   ${results.connectivity ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Version:             ${results.version ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Account Info:        ${results.accountInfo ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Pending Blocks:      ${results.pendingBlocks ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Work Generation:     ${results.workGeneration ? '✓ PASS' : '✗ FAIL (may be expected)'}`);
    console.log(`Retry Logic:         ${results.retry ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Custom Timeout:      ${results.customTimeout ? '✓ PASS' : '✗ FAIL'}`);
    
    const passedTests = Object.values(results).filter(r => r).length;
    const totalTests = Object.keys(results).length;
    
    console.log('\n========================================');
    console.log(`Results: ${passedTests}/${totalTests} tests passed`);
    console.log('========================================');
    
    if (workingRpcUrl) {
        console.log(`\n✓ Working RPC URL: ${workingRpcUrl}`);
        console.log('✓ RPC Server is accessible and responding');
    } else {
        console.log('\n✗ RPC Server is not accessible');
        console.log('\nPossible issues:');
        console.log('  1. Server is not running');
        console.log('  2. Port is firewalled');
        console.log('  3. Server is behind a VPN/proxy');
        console.log('  4. Incorrect IP address or port');
        console.log('  5. Server requires authentication');
    }
}

// Run tests
runAllTests().catch(console.error);

