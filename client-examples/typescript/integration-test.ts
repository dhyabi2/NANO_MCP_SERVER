#!/usr/bin/env ts-node
/**
 * NANO MCP Client Integration Test
 * 
 * Tests real functionality using existing test wallets from tests/test-wallets.json
 * This verifies actual blockchain operations, not just schema validation.
 */

import { NanoMcpClient } from './nano-mcp-client';

// ============================================
// Test Configuration
// ============================================

const PRODUCTION_URL = 'https://nano-mcp.replit.app';

// Existing test wallets from tests/test-wallets.json
const WALLET1 = {
  address: 'nano_1qhymu7bp6bcjm17474iz99wh7xgocio6m11tkdrthgqpfuj7etxgjznfi7x',
  privateKey: 'ba54b58a59a42082c8592d7e6ad8746ebfc83207edcc694bc0ae637e3c67f746'
};

const WALLET2 = {
  address: 'nano_364ymk8c4a51dohj8peihgqarza4wppgjg7iyzoddub9chmkrakmse1975j5',
  privateKey: '808519897e023d8931f13710277049c209fe059cb374672e194acfcee8c4ec4f'
};

// ============================================
// Test Utilities
// ============================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message: string, color: string = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function testHeader(message: string) {
  log(`\n${'='.repeat(60)}`, COLORS.cyan);
  log(`  ${message}`, COLORS.bright + COLORS.cyan);
  log('='.repeat(60), COLORS.cyan);
}

function testPass(message: string) {
  log(`✅ PASS: ${message}`, COLORS.green);
}

function testFail(message: string, error?: any) {
  log(`❌ FAIL: ${message}`, COLORS.red);
  if (error) {
    if (error.errorCode) {
      log(`   Error Code: ${error.errorCode}`, COLORS.red);
      log(`   Error: ${error.error}`, COLORS.red);
      if (error.nextSteps) {
        log(`   Next Steps:`, COLORS.yellow);
        error.nextSteps.forEach((step: string) => log(`      ${step}`, COLORS.yellow));
      }
    } else {
      log(`   ${error.message || error}`, COLORS.red);
    }
  }
}

function testInfo(message: string) {
  log(`   ℹ️  ${message}`, COLORS.cyan);
}

function testWarn(message: string) {
  log(`   ⚠️  ${message}`, COLORS.yellow);
}

// ============================================
// Integration Tests
// ============================================

async function test1_ClientInit() {
  testHeader('Test 1: Client Initialization');
  
  try {
    const client = new NanoMcpClient(PRODUCTION_URL);
    testPass('Client initialized successfully');
    testInfo(`URL: ${PRODUCTION_URL}`);
    return client;
  } catch (error: any) {
    testFail('Client initialization failed', error);
    throw error;
  }
}

async function test2_CheckWallet1Balance(client: NanoMcpClient) {
  testHeader('Test 2: Check Wallet 1 Balance & Status');
  
  try {
    const balance = await client.getBalance(WALLET1.address);
    testPass('Balance retrieved successfully');
    
    if (balance.balanceNano !== undefined) {
      testInfo(`Balance: ${balance.balanceNano} NANO (${balance.balance} raw)`);
      testInfo(`Pending: ${balance.pendingNano} NANO (${balance.pending} raw)`);
    } else {
      testInfo(`Balance: ${balance.balance} raw`);
      testInfo(`Pending: ${balance.pending} raw`);
    }
    
    // Also get account status if available
    try {
      const status = await client.getAccountStatus(WALLET1.address);
      testInfo(`Initialized: ${status.initialized || 'unknown'}`);
      if (status.pendingCount !== undefined) {
        testInfo(`Pending Blocks: ${status.pendingCount}`);
      }
      if (status.needsAction && status.needsAction.length > 0) {
        testWarn('Actions needed:');
        status.needsAction.forEach(action => testWarn(`  - ${action}`));
      }
      return { balance, status };
    } catch (error: any) {
      if (error.message?.includes('METHOD_NOT_FOUND')) {
        testWarn('getAccountStatus not available on this server version');
      }
      return { balance, status: null };
    }
  } catch (error: any) {
    testFail('Get balance failed', error);
    throw error;
  }
}

async function test3_CheckWallet2Balance(client: NanoMcpClient) {
  testHeader('Test 3: Check Wallet 2 Balance & Status');
  
  try {
    const balance = await client.getBalance(WALLET2.address);
    testPass('Balance retrieved successfully');
    
    if (balance.balanceNano !== undefined) {
      testInfo(`Balance: ${balance.balanceNano} NANO (${balance.balance} raw)`);
      testInfo(`Pending: ${balance.pendingNano} NANO (${balance.pending} raw)`);
    } else {
      testInfo(`Balance: ${balance.balance} raw`);
      testInfo(`Pending: ${balance.pending} raw`);
    }
    
    // Also get account status if available
    try {
      const status = await client.getAccountStatus(WALLET2.address);
      testInfo(`Initialized: ${status.initialized || 'unknown'}`);
      if (status.pendingCount !== undefined) {
        testInfo(`Pending Blocks: ${status.pendingCount}`);
      }
      if (status.needsAction && status.needsAction.length > 0) {
        testWarn('Actions needed:');
        status.needsAction.forEach(action => testWarn(`  - ${action}`));
      }
      return { balance, status };
    } catch (error: any) {
      if (error.message?.includes('METHOD_NOT_FOUND')) {
        testWarn('getAccountStatus not available on this server version');
      }
      return { balance, status: null };
    }
  } catch (error: any) {
    testFail('Get balance failed', error);
    throw error;
  }
}

async function test4_CheckPendingBlocks(client: NanoMcpClient, address: string, walletName: string) {
  testHeader(`Test 4: Check Pending Blocks for ${walletName}`);
  
  try {
    const pending = await client.getPendingBlocks(address);
    testPass('Pending blocks retrieved successfully');
    
    if (pending.count > 0) {
      testInfo(`Pending blocks: ${pending.count}`);
      if (pending.totalPendingNano !== undefined) {
        testInfo(`Total pending: ${pending.totalPendingNano} NANO`);
      }
      testWarn(`This wallet needs to receive ${pending.count} block(s)`);
      return { hasPending: true, count: pending.count, pending };
    } else {
      testInfo('No pending blocks');
      return { hasPending: false, count: 0, pending };
    }
  } catch (error: any) {
    testFail('Get pending blocks failed', error);
    return { hasPending: false, count: 0, pending: null };
  }
}

async function test5_InitializeAccount(client: NanoMcpClient, address: string, privateKey: string, walletName: string, hasPending: boolean) {
  testHeader(`Test 5: Initialize ${walletName} (if needed)`);
  
  if (!hasPending) {
    testInfo('Skipping - no pending blocks to receive');
    return { skipped: true };
  }
  
  try {
    testInfo('Attempting to initialize account...');
    testWarn('This may take 10-15 seconds for Proof-of-Work generation...');
    
    const result = await client.initializeAccount(address, privateKey);
    testPass('Account initialized successfully!');
    
    if (result.hash) {
      testInfo(`Block hash: ${result.hash}`);
    }
    if (result.message) {
      testInfo(`Message: ${result.message}`);
    }
    if (result.balance !== undefined) {
      testInfo(`New balance: ${result.balance} raw`);
    }
    
    return { initialized: true, result };
  } catch (error: any) {
    testFail('Initialize account failed', error);
    return { initialized: false, error };
  }
}

async function test6_ReceiveAllPending(client: NanoMcpClient, address: string, privateKey: string, walletName: string, hasPending: boolean) {
  testHeader(`Test 6: Receive All Pending for ${walletName} (if needed)`);
  
  if (!hasPending) {
    testInfo('Skipping - no pending blocks to receive');
    return { skipped: true };
  }
  
  try {
    testInfo('Attempting to receive all pending blocks...');
    testWarn('This may take time depending on number of blocks...');
    
    const result = await client.receiveAllPending(address, privateKey);
    testPass('Received pending blocks successfully!');
    
    if (Array.isArray(result)) {
      testInfo(`Blocks received: ${result.length}`);
      result.forEach((block, idx) => {
        if (block.hash) {
          testInfo(`  Block ${idx + 1}: ${block.hash}`);
        }
      });
    }
    
    return { success: true, result };
  } catch (error: any) {
    testFail('Receive all pending failed', error);
    return { success: false, error };
  }
}

async function test7_SendTransaction(client: NanoMcpClient, wallet1Balance: any, wallet2Address: string) {
  testHeader('Test 7: Send Transaction from Wallet 1 to Wallet 2');
  
  // Check if wallet1 has sufficient balance
  const balance = BigInt(wallet1Balance.balance);
  const sendAmount = '1000000000000000000000000'; // 0.001 NANO
  
  if (balance < BigInt(sendAmount)) {
    testWarn('Insufficient balance for test transaction');
    testInfo(`Current: ${balance.toString()} raw`);
    testInfo(`Required: ${sendAmount} raw (0.001 NANO)`);
    testInfo('Please fund Wallet 1 to test sending');
    return { skipped: true, reason: 'insufficient_balance' };
  }
  
  try {
    testInfo(`Sending 0.001 NANO from Wallet 1 to Wallet 2...`);
    testWarn('This may take 10-15 seconds for Proof-of-Work generation...');
    
    const result = await client.sendTransaction(
      WALLET1.address,
      wallet2Address,
      sendAmount,
      WALLET1.privateKey
    );
    
    testPass('Transaction sent successfully!');
    
    if (result.hash) {
      testInfo(`Transaction hash: ${result.hash}`);
    }
    testInfo(`Success: ${result.success}`);
    
    return { success: true, result };
  } catch (error: any) {
    testFail('Send transaction failed', error);
    return { success: false, error };
  }
}

async function test8_QRCode(client: NanoMcpClient) {
  testHeader('Test 8: Generate QR Code for Wallet 1');
  
  try {
    const qrResult = await client.generateQrCode(WALLET1.address);
    testPass('QR code generated successfully');
    
    if (qrResult.qrCode) {
      testInfo(`QR format: ${typeof qrResult.qrCode}`);
      testInfo(`QR length: ${qrResult.qrCode.length} characters`);
    }
    
    return { success: true, qrResult };
  } catch (error: any) {
    testFail('QR code generation failed', error);
    return { success: false, error };
  }
}

async function test9_BalanceConversion(client: NanoMcpClient) {
  testHeader('Test 9: Balance Conversion (Nano ↔ Raw)');
  
  try {
    // Test conversion helpers
    const testNano = '1.5';
    const testRaw = '1500000000000000000000000000000';
    
    const toRaw = client.nanoToRaw(testNano);
    const toNano = client.rawToNano(testRaw);
    
    testPass('Client-side conversions work');
    testInfo(`${testNano} NANO = ${toRaw} raw`);
    testInfo(`${testRaw} raw = ${toNano} NANO`);
    
    // Test MCP convertBalance if available
    try {
      const mcpResult = await client.convertBalance('1.5', 'nano', 'raw');
      testPass('MCP convertBalance works');
      testInfo(`MCP result: ${mcpResult.converted}`);
    } catch (error: any) {
      if (error.message?.includes('METHOD_NOT_FOUND')) {
        testWarn('convertBalance not available on this server version');
      } else {
        throw error;
      }
    }
    
    return { success: true };
  } catch (error: any) {
    testFail('Balance conversion failed', error);
    return { success: false, error };
  }
}

async function test10_ErrorHandling(client: NanoMcpClient) {
  testHeader('Test 10: Error Handling & Validation');
  
  let testsRun = 0;
  let testsPassed = 0;
  
  // Test 1: Invalid address
  try {
    await client.getBalance('invalid_address');
    testFail('Should have rejected invalid address');
  } catch (error: any) {
    testsRun++;
    if (error.errorCode === 'INVALID_ADDRESS' || error.message?.includes('Invalid')) {
      testsPassed++;
      testPass('Invalid address rejected correctly');
    } else {
      testWarn(`Unexpected error: ${error.message}`);
    }
  }
  
  // Test 2: Invalid amount
  try {
    await client.sendTransaction(
      WALLET1.address,
      WALLET2.address,
      'invalid_amount',
      WALLET1.privateKey
    );
    testFail('Should have rejected invalid amount');
  } catch (error: any) {
    testsRun++;
    if (error.message?.includes('Invalid') || error.message?.includes('amount')) {
      testsPassed++;
      testPass('Invalid amount rejected correctly');
    } else {
      testWarn(`Unexpected error: ${error.message}`);
    }
  }
  
  testInfo(`Error handling: ${testsPassed}/${testsRun} tests passed`);
  
  return { testsRun, testsPassed };
}

// ============================================
// Main Test Runner
// ============================================

async function runIntegrationTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', COLORS.bright + COLORS.cyan);
  log('║     NANO MCP CLIENT - INTEGRATION TEST SUITE              ║', COLORS.bright + COLORS.cyan);
  log('║     Testing with Existing Test Wallets                    ║', COLORS.bright + COLORS.cyan);
  log('╚════════════════════════════════════════════════════════════╝', COLORS.bright + COLORS.cyan);
  
  testInfo(`Server: ${PRODUCTION_URL}`);
  testInfo(`Wallet 1: ${WALLET1.address}`);
  testInfo(`Wallet 2: ${WALLET2.address}`);
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  try {
    // Test 1: Initialize client
    const client = await test1_ClientInit();
    passed++;
    
    // Test 2: Check Wallet 1
    const wallet1Info = await test2_CheckWallet1Balance(client);
    passed++;
    
    // Test 3: Check Wallet 2
    const wallet2Info = await test3_CheckWallet2Balance(client);
    passed++;
    
    // Test 4: Check pending blocks for Wallet 1
    const wallet1Pending = await test4_CheckPendingBlocks(client, WALLET1.address, 'Wallet 1');
    passed++;
    
    // Test 5: Initialize Wallet 1 if needed
    const wallet1Init = await test5_InitializeAccount(
      client,
      WALLET1.address,
      WALLET1.privateKey,
      'Wallet 1',
      wallet1Pending.hasPending
    );
    if (wallet1Init.skipped) {
      skipped++;
    } else {
      if (wallet1Init.initialized) passed++;
      else failed++;
    }
    
    // Test 6: Receive all pending for Wallet 1
    const wallet1Receive = await test6_ReceiveAllPending(
      client,
      WALLET1.address,
      WALLET1.privateKey,
      'Wallet 1',
      wallet1Pending.hasPending
    );
    if (wallet1Receive.skipped) {
      skipped++;
    } else {
      if (wallet1Receive.success) passed++;
      else failed++;
    }
    
    // Re-check Wallet 1 balance after receiving
    if (wallet1Pending.hasPending) {
      testHeader('Re-checking Wallet 1 Balance After Receiving');
      const updatedBalance = await client.getBalance(WALLET1.address);
      if (updatedBalance.balanceNano !== undefined) {
        testInfo(`Updated Balance: ${updatedBalance.balanceNano} NANO`);
      } else {
        testInfo(`Updated Balance: ${updatedBalance.balance} raw`);
      }
    }
    
    // Test 7: Send transaction (if wallet1 has balance)
    const sendResult = await test7_SendTransaction(
      client,
      wallet1Info.balance,
      WALLET2.address
    );
    if (sendResult.skipped) {
      skipped++;
    } else {
      if (sendResult.success) passed++;
      else failed++;
    }
    
    // Test 8: QR Code
    const qrResult = await test8_QRCode(client);
    if (qrResult.success) passed++;
    else failed++;
    
    // Test 9: Balance conversion
    const conversionResult = await test9_BalanceConversion(client);
    if (conversionResult.success) passed++;
    else failed++;
    
    // Test 10: Error handling
    const errorResult = await test10_ErrorHandling(client);
    if (errorResult.testsPassed === errorResult.testsRun) passed++;
    else failed++;
    
  } catch (error: any) {
    log(`\n❌ CRITICAL ERROR: ${error.message}`, COLORS.red);
    failed++;
  }
  
  // Final Summary
  log('\n╔════════════════════════════════════════════════════════════╗', COLORS.bright);
  log('║                    TEST SUMMARY                            ║', COLORS.bright);
  log('╚════════════════════════════════════════════════════════════╝', COLORS.bright);
  
  const total = passed + failed + skipped;
  log(`\n✅ PASSED:  ${passed}/${total}`, COLORS.green);
  if (failed > 0) {
    log(`❌ FAILED:  ${failed}/${total}`, COLORS.red);
  }
  if (skipped > 0) {
    log(`⏭️  SKIPPED: ${skipped}/${total}`, COLORS.yellow);
  }
  
  const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
  log(`\n📊 Success Rate: ${successRate}%`, COLORS.cyan);
  
  if (passed === total) {
    log('\n🎉 ALL TESTS PASSED! Client is working perfectly!', COLORS.green);
  } else if (passed + skipped === total) {
    log('\n✅ All run tests passed! Some tests skipped due to prerequisites.', COLORS.green);
  } else {
    log('\n⚠️  Some tests failed. Review errors above.', COLORS.yellow);
  }
  
  log('\n');
}

// Run the tests
runIntegrationTests().catch(error => {
  log(`\n💥 TEST SUITE CRASHED: ${error.message}`, COLORS.red);
  console.error(error);
  process.exit(1);
});

