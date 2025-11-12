/**
 * Comprehensive Test Suite for NANO MCP TypeScript Client
 * Tests all client methods against production server
 * 
 * Run: ts-node test-client.ts
 * Or: node test-client.js (if compiled)
 */

import { NanoMcpClient, nanoToRaw, rawToNano, XNO } from './nano-mcp-client';

// Test configuration
const TEST_SERVER = 'https://nano-mcp.replit.app';
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results
let passed = 0;
let failed = 0;
const failedTests: string[] = [];

// Helper functions
function log(message: string, color: string = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function testHeader(testName: string) {
  console.log('\n' + '='.repeat(80));
  log(`\n🧪 ${testName}`, COLORS.cyan);
  console.log('='.repeat(80));
}

function testPass(message: string) {
  log(`✅ PASS: ${message}`, COLORS.green);
  passed++;
}

function testFail(message: string, error?: any) {
  log(`❌ FAIL: ${message}`, COLORS.red);
  if (error) {
    log(`   Error: ${error.message}`, COLORS.red);
  }
  failed++;
  failedTests.push(message);
}

function testInfo(message: string) {
  log(`   ${message}`, COLORS.blue);
}

// ============================================================================
// TEST 1: Client Initialization
// ============================================================================

async function test1_ClientInitialization() {
  testHeader('Test 1: Client Initialization');
  
  try {
    const client = new NanoMcpClient(TEST_SERVER);
    testPass('Client instantiated successfully');
    testInfo(`Server URL: ${TEST_SERVER}`);
    return client;
  } catch (error: any) {
    testFail('Client initialization failed', error);
    throw error;
  }
}

// ============================================================================
// TEST 2: Generate Wallet
// ============================================================================

async function test2_GenerateWallet(client: NanoMcpClient) {
  testHeader('Test 2: Generate Wallet');
  
  try {
    const wallet = await client.generateWallet();
    
    // Validate response structure
    if (!wallet.address || typeof wallet.address !== 'string') {
      throw new Error('Invalid address in response');
    }
    if (!wallet.privateKey || wallet.privateKey.length !== 64) {
      throw new Error('Invalid private key (must be 64 chars)');
    }
    if (!wallet.publicKey || wallet.publicKey.length !== 64) {
      throw new Error('Invalid public key (must be 64 chars)');
    }
    if (!wallet.seed || wallet.seed.length !== 64) {
      throw new Error('Invalid seed (must be 64 chars)');
    }
    
    testPass('Wallet generated successfully');
    testInfo(`Address: ${wallet.address.substring(0, 20)}...`);
    testInfo(`Private Key: ${wallet.privateKey.substring(0, 10)}...`);
    testInfo(`Public Key: ${wallet.publicKey.substring(0, 10)}...`);
    testInfo(`Seed: ${wallet.seed.substring(0, 10)}...`);
    
    return wallet;
  } catch (error: any) {
    testFail('Generate wallet failed', error);
    throw error;
  }
}

// ============================================================================
// TEST 3: Get Balance
// ============================================================================

async function test3_GetBalance(client: NanoMcpClient, address: string) {
  testHeader('Test 3: Get Balance');
  
  try {
    const balance = await client.getBalance(address);
    
    // Validate response structure
    if (typeof balance.balance !== 'string') {
      throw new Error('Invalid balance format');
    }
    if (typeof balance.balanceNano !== 'string') {
      throw new Error('Invalid balanceNano format');
    }
    if (typeof balance.pending !== 'string') {
      throw new Error('Invalid pending format');
    }
    if (typeof balance.pendingNano !== 'string') {
      throw new Error('Invalid pendingNano format');
    }
    
    testPass('Balance retrieved successfully');
    testInfo(`Balance: ${balance.balanceNano} NANO (${balance.balance} raw)`);
    testInfo(`Pending: ${balance.pendingNano} NANO (${balance.pending} raw)`);
    
    return balance;
  } catch (error: any) {
    testFail('Get balance failed', error);
    throw error;
  }
}

// ============================================================================
// TEST 4: Get Account Status
// ============================================================================

async function test4_GetAccountStatus(client: NanoMcpClient, address: string) {
  testHeader('Test 4: Get Account Status');
  
  try {
    const status = await client.getAccountStatus(address);
    
    // Validate response structure
    if (typeof status.initialized !== 'boolean') {
      throw new Error('Invalid initialized field');
    }
    if (typeof status.canSend !== 'boolean') {
      throw new Error('Invalid canSend field');
    }
    if (!Array.isArray(status.needsAction)) {
      throw new Error('Invalid needsAction field');
    }
    
    testPass('Account status retrieved successfully');
    testInfo(`Initialized: ${status.initialized}`);
    testInfo(`Balance: ${status.balanceNano} NANO`);
    testInfo(`Pending: ${status.pendingCount} blocks (${status.totalPendingNano} NANO)`);
    testInfo(`Can Send: ${status.canSend}`);
    
    if (status.needsAction.length > 0) {
      testInfo('Actions needed:');
      status.needsAction.forEach(action => {
        testInfo(`  - ${action}`);
      });
    }
    
    return status;
  } catch (error: any) {
    testFail('Get account status failed', error);
    throw error;
  }
}

// ============================================================================
// TEST 5: Client-Side Validation (Invalid Address)
// ============================================================================

async function test5_ClientValidation(client: NanoMcpClient) {
  testHeader('Test 5: Client-Side Validation (Invalid Address)');
  
  try {
    // Should throw error before making network call
    await client.getBalance('invalid_address');
    testFail('Validation should have thrown error for invalid address');
  } catch (error: any) {
    if (error.message.includes('valid NANO address')) {
      testPass('Client-side validation caught invalid address');
      testInfo('Error message: ' + error.message.split('\n')[0]);
    } else {
      testFail('Unexpected error during validation', error);
    }
  }
}

// ============================================================================
// TEST 6: Convert Balance (Server-Side)
// ============================================================================

async function test6_ConvertBalance(client: NanoMcpClient) {
  testHeader('Test 6: Convert Balance (Server-Side)');
  
  try {
    const result = await client.convertBalance('0.1', 'nano', 'raw');
    
    // Validate response
    if (result.original !== '0.1') {
      throw new Error('Invalid original amount');
    }
    if (result.from !== 'nano' || result.to !== 'raw') {
      throw new Error('Invalid from/to units');
    }
    if (result.converted !== '100000000000000000000000000000') {
      throw new Error('Incorrect conversion result');
    }
    
    testPass('Balance conversion (nano → raw) successful');
    testInfo(`${result.original} ${result.from} = ${result.converted} ${result.to}`);
    
    // Test reverse conversion
    const reverse = await client.convertBalance(result.converted, 'raw', 'nano');
    testPass('Balance conversion (raw → nano) successful');
    testInfo(`${reverse.original} ${reverse.from} = ${reverse.converted} ${reverse.to}`);
    
  } catch (error: any) {
    testFail('Convert balance failed', error);
  }
}

// ============================================================================
// TEST 7: Helper Functions (Client-Side)
// ============================================================================

async function test7_HelperFunctions() {
  testHeader('Test 7: Helper Functions (Client-Side)');
  
  try {
    // Test nanoToRaw
    const raw = nanoToRaw('0.1');
    if (raw !== '100000000000000000000000000000') {
      throw new Error('nanoToRaw conversion incorrect');
    }
    testPass('nanoToRaw() conversion correct');
    testInfo(`0.1 NANO = ${raw} raw`);
    
    // Test rawToNano
    const nano = rawToNano('100000000000000000000000000000');
    if (nano !== '0.100000') {
      throw new Error('rawToNano conversion incorrect');
    }
    testPass('rawToNano() conversion correct');
    testInfo(`100000000000000000000000000000 raw = ${nano} NANO`);
    
    // Test constants
    if (XNO.ONE_NANO !== '1000000000000000000000000000000') {
      throw new Error('XNO.ONE_NANO constant incorrect');
    }
    testPass('XNO constants defined correctly');
    testInfo(`XNO.ONE_NANO = ${XNO.ONE_NANO}`);
    testInfo(`XNO.POINT_ONE_NANO = ${XNO.POINT_ONE_NANO}`);
    
  } catch (error: any) {
    testFail('Helper functions test failed', error);
  }
}

// ============================================================================
// TEST 8: Schema Discovery
// ============================================================================

async function test8_SchemaDiscovery(client: NanoMcpClient) {
  testHeader('Test 8: Schema Discovery');
  
  try {
    // Get complete schema
    const schema = await client.getSchema();
    
    if (!schema.tools || schema.tools.length === 0) {
      throw new Error('Schema has no tools defined');
    }
    
    testPass('Complete schema retrieved');
    testInfo(`Schema version: ${schema.version}`);
    testInfo(`Tools available: ${schema.tools.length}`);
    testInfo(`Error codes: ${schema.errorSchema?.properties?.errorCode?.enum?.length || 0}`);
    
    // Get specific tool schema
    const toolSchema = await client.getToolSchema('sendTransaction');
    
    if (toolSchema.name !== 'sendTransaction') {
      throw new Error('Tool schema name mismatch');
    }
    
    testPass('Tool-specific schema retrieved');
    testInfo(`Tool: ${toolSchema.name}`);
    testInfo(`Category: ${toolSchema.category}`);
    testInfo(`Required params: ${toolSchema.inputSchema.required.join(', ')}`);
    
    // Get examples
    const examples = await client.getExamples('generateWallet');
    
    if (!examples.examples || examples.examples.length === 0) {
      throw new Error('No examples found');
    }
    
    testPass('Examples retrieved');
    testInfo(`Tool: ${examples.tool}`);
    testInfo(`Examples available: ${examples.examples.length}`);
    
  } catch (error: any) {
    testFail('Schema discovery failed', error);
  }
}

// ============================================================================
// TEST 9: Parameter Validation (Server-Side)
// ============================================================================

async function test9_ParameterValidation(client: NanoMcpClient) {
  testHeader('Test 9: Parameter Validation (Server-Side)');
  
  try {
    // Test valid parameters
    const validParams = {
      fromAddress: 'nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn',
      toAddress: 'nano_1x7biz69cem95oo7gxkdkdbxsfs6ixkxx833fz3ps9qxh3uofa1hr8ejkizd',
      amountRaw: '1000000000000000000000000000',
      privateKey: '9f0e444c69f77a49bd0be89db92c38fe713e0963165cca12faf5712d7657120f'
    };
    
    const validResult = await client.validateParams('sendTransaction', validParams);
    
    if (!validResult.valid) {
      throw new Error('Valid parameters were rejected');
    }
    
    testPass('Valid parameters accepted');
    testInfo(`Validation result: ${validResult.valid}`);
    
    // Test invalid parameters
    const invalidParams = {
      fromAddress: 'invalid_address',
      toAddress: 'nano_...',
      amountRaw: '100',
      privateKey: 'short'
    };
    
    const invalidResult = await client.validateParams('sendTransaction', invalidParams);
    
    if (invalidResult.valid) {
      throw new Error('Invalid parameters were accepted');
    }
    if (invalidResult.errors.length === 0) {
      throw new Error('No validation errors returned for invalid params');
    }
    
    testPass('Invalid parameters rejected');
    testInfo(`Errors detected: ${invalidResult.errors.length}`);
    testInfo(`Sample error: ${invalidResult.errors[0].substring(0, 80)}...`);
    
  } catch (error: any) {
    testFail('Parameter validation failed', error);
  }
}

// ============================================================================
// TEST 10: Generate QR Code
// ============================================================================

async function test10_GenerateQrCode(client: NanoMcpClient, address: string) {
  testHeader('Test 10: Generate QR Code');
  
  try {
    const qr = await client.generateQrCode(address, '0.1');
    
    if (!qr.qrCode || typeof qr.qrCode !== 'string') {
      throw new Error('Invalid QR code data');
    }
    if (!qr.nanoUri || !qr.nanoUri.startsWith('nano:')) {
      throw new Error('Invalid NANO URI');
    }
    
    testPass('QR code generated successfully');
    testInfo(`NANO URI: ${qr.nanoUri}`);
    testInfo(`QR Code size: ${qr.qrCode.length} characters (base64)`);
    
  } catch (error: any) {
    testFail('Generate QR code failed', error);
  }
}

// ============================================================================
// TEST 11: Error Handling with Invalid Method
// ============================================================================

async function test11_ErrorHandling(client: NanoMcpClient) {
  testHeader('Test 11: Error Handling (Invalid Method)');
  
  try {
    // Call private method directly to test error handling
    await (client as any).callMCP('invalidMethod', {});
    testFail('Should have thrown error for invalid method');
  } catch (error: any) {
    if (error.message.includes('METHOD_NOT_FOUND') || error.message.includes('not found')) {
      testPass('Error handling works correctly for invalid method');
      testInfo('Error message includes guidance (as expected)');
    } else {
      testFail('Unexpected error format', error);
    }
  }
}

// ============================================================================
// TEST 12: TypeScript Type Safety (Compile-Time Check)
// ============================================================================

async function test12_TypeSafety() {
  testHeader('Test 12: TypeScript Type Safety');
  
  try {
    // These tests validate at compile-time, not runtime
    // If this code compiles, type safety is working
    
    const client = new NanoMcpClient(TEST_SERVER);
    
    // Type checks (these would fail to compile if types were wrong)
    const wallet: { address: string; privateKey: string; publicKey: string; seed: string } = 
      await client.generateWallet();
    
    const balance: { balance: string; balanceNano: string; pending: string; pendingNano: string } = 
      await client.getBalance(wallet.address);
    
    const status: { initialized: boolean; canSend: boolean; needsAction: string[] } = 
      await client.getAccountStatus(wallet.address);
    
    testPass('TypeScript type safety verified (compile-time)');
    testInfo('All method signatures type-check correctly');
    testInfo('Response types match expected interfaces');
    
  } catch (error: any) {
    testFail('Type safety verification failed', error);
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  log('NANO MCP CLIENT - COMPREHENSIVE TEST SUITE', COLORS.cyan);
  console.log('='.repeat(80));
  log(`\nTesting against: ${TEST_SERVER}`, COLORS.yellow);
  log('Started at: ' + new Date().toISOString(), COLORS.yellow);
  console.log('='.repeat(80));
  
  let client: NanoMcpClient;
  let wallet: any;
  
  try {
    // Test 1: Client Initialization
    client = await test1_ClientInitialization();
    
    // Test 2: Generate Wallet
    wallet = await test2_GenerateWallet(client);
    
    // Test 3: Get Balance
    await test3_GetBalance(client, wallet.address);
    
    // Test 4: Get Account Status
    await test4_GetAccountStatus(client, wallet.address);
    
    // Test 5: Client-Side Validation
    await test5_ClientValidation(client);
    
    // Test 6: Convert Balance
    await test6_ConvertBalance(client);
    
    // Test 7: Helper Functions
    await test7_HelperFunctions();
    
    // Test 8: Schema Discovery
    await test8_SchemaDiscovery(client);
    
    // Test 9: Parameter Validation
    await test9_ParameterValidation(client);
    
    // Test 10: Generate QR Code
    await test10_GenerateQrCode(client, wallet.address);
    
    // Test 11: Error Handling
    await test11_ErrorHandling(client);
    
    // Test 12: Type Safety
    await test12_TypeSafety();
    
  } catch (error: any) {
    log(`\n⚠️  Test suite stopped due to critical error: ${error.message}`, COLORS.red);
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  log('\n📊 TEST SUMMARY', COLORS.cyan);
  console.log('='.repeat(80));
  
  const total = passed + failed;
  const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
  
  log(`\nTotal Tests: ${total}`, COLORS.blue);
  log(`✅ Passed: ${passed}`, COLORS.green);
  log(`❌ Failed: ${failed}`, failed > 0 ? COLORS.red : COLORS.green);
  log(`Success Rate: ${successRate}%`, failed === 0 ? COLORS.green : COLORS.yellow);
  
  if (failed > 0) {
    log('\n❌ Failed Tests:', COLORS.red);
    failedTests.forEach(test => {
      log(`   - ${test}`, COLORS.red);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (failed === 0) {
    log('🎉 ALL TESTS PASSED! Client is working perfectly!', COLORS.green);
  } else {
    log('⚠️  Some tests failed. Please review the errors above.', COLORS.yellow);
  }
  
  console.log('='.repeat(80));
  log('\nCompleted at: ' + new Date().toISOString(), COLORS.yellow);
  console.log('='.repeat(80) + '\n');
  
  // Exit with appropriate code
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runAllTests };

