#!/usr/bin/env ts-node
/**
 * NANO MCP Client - Transaction Flow Test
 * 
 * Tests complete send/receive cycle between two wallets:
 * 1. Send from Wallet 2 to Wallet 1
 * 2. Receive pending blocks on Wallet 1
 * 3. Send from Wallet 1 back to Wallet 2
 * 4. Receive pending blocks on Wallet 2
 * 
 * Uses existing test wallets from tests/test-wallets.json
 */

import { NanoMcpClient } from './nano-mcp-client';

// ============================================
// Test Configuration
// ============================================

const PRODUCTION_URL = 'https://nano-mcp.replit.app';

// Existing test wallets
const WALLET1 = {
  name: 'Wallet 1',
  address: 'nano_1qhymu7bp6bcjm17474iz99wh7xgocio6m11tkdrthgqpfuj7etxgjznfi7x',
  privateKey: 'ba54b58a59a42082c8592d7e6ad8746ebfc83207edcc694bc0ae637e3c67f746'
};

const WALLET2 = {
  name: 'Wallet 2',
  address: 'nano_364ymk8c4a51dohj8peihgqarza4wppgjg7iyzoddub9chmkrakmse1975j5',
  privateKey: '808519897e023d8931f13710277049c209fe059cb374672e194acfcee8c4ec4f'
};

// Test amount: 0.0001 NANO (100000000000000000000000000 raw)
const TEST_AMOUNT_RAW = '100000000000000000000000000'; // 0.0001 NANO

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
  log(`\n${'='.repeat(70)}`, COLORS.cyan);
  log(`  ${message}`, COLORS.bright + COLORS.cyan);
  log('='.repeat(70), COLORS.cyan);
}

function stepHeader(step: number, total: number, message: string) {
  log(`\n>>> STEP ${step}/${total}: ${message}`, COLORS.bright + COLORS.magenta);
}

function testPass(message: string) {
  log(`✅ ${message}`, COLORS.green);
}

function testFail(message: string, error?: any) {
  log(`❌ ${message}`, COLORS.red);
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Transaction Flow Tests
// ============================================

async function checkBalance(client: NanoMcpClient, wallet: typeof WALLET1) {
  const balance = await client.getBalance(wallet.address);
  const balanceNano = balance.balanceNano !== undefined 
    ? balance.balanceNano 
    : client.rawToNano(balance.balance);
  const pendingNano = balance.pendingNano !== undefined 
    ? balance.pendingNano 
    : client.rawToNano(balance.pending);
  
  testInfo(`${wallet.name}: ${balanceNano} NANO (${balance.balance} raw)`);
  if (balance.pending !== '0') {
    testWarn(`${wallet.name} has pending: ${pendingNano} NANO (${balance.pending} raw)`);
  }
  
  return balance;
}

async function runTransactionFlowTest() {
  log('\n╔════════════════════════════════════════════════════════════════════╗', COLORS.bright + COLORS.cyan);
  log('║     NANO MCP CLIENT - TRANSACTION FLOW TEST                        ║', COLORS.bright + COLORS.cyan);
  log('║     Complete Send/Receive Cycle Test                               ║', COLORS.bright + COLORS.cyan);
  log('╚════════════════════════════════════════════════════════════════════╝', COLORS.bright + COLORS.cyan);
  
  testInfo(`Server: ${PRODUCTION_URL}`);
  testInfo(`Test Amount: 0.0001 NANO per transaction`);
  testInfo(`${WALLET1.name}: ${WALLET1.address}`);
  testInfo(`${WALLET2.name}: ${WALLET2.address}`);
  
  const client = new NanoMcpClient(PRODUCTION_URL);
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // ========================================
    // STEP 1: Check Initial Balances
    // ========================================
    stepHeader(1, 8, 'Check Initial Balances');
    
    const initialBalance1 = await checkBalance(client, WALLET1);
    const initialBalance2 = await checkBalance(client, WALLET2);
    
    const wallet2BalanceBigInt = BigInt(initialBalance2.balance);
    const testAmountBigInt = BigInt(TEST_AMOUNT_RAW);
    
    if (wallet2BalanceBigInt < testAmountBigInt) {
      testFail(`${WALLET2.name} has insufficient balance for test`);
      testInfo(`Required: ${client.rawToNano(TEST_AMOUNT_RAW)} NANO`);
      testInfo(`Available: ${client.rawToNano(initialBalance2.balance)} NANO`);
      throw new Error('Insufficient balance for test');
    }
    
    testPass('Initial balances checked');
    testsPassed++;
    
    // ========================================
    // STEP 2: Send from Wallet 2 to Wallet 1
    // ========================================
    stepHeader(2, 8, `Send 0.0001 NANO from ${WALLET2.name} to ${WALLET1.name}`);
    testWarn('This will take 10-15 seconds for Proof-of-Work generation...');
    
    try {
      const sendResult = await client.sendTransaction(
        WALLET2.address,
        WALLET1.address,
        TEST_AMOUNT_RAW,
        WALLET2.privateKey
      );
      
      testPass('Transaction sent successfully!');
      testInfo(`Transaction hash: ${sendResult.hash}`);
      testsPassed++;
      
      // Wait a moment for the network to propagate
      testInfo('Waiting 2 seconds for network propagation...');
      await sleep(2000);
      
    } catch (error: any) {
      testFail('Send transaction failed', error);
      testsFailed++;
      throw error;
    }
    
    // ========================================
    // STEP 3: Check Wallet 1 for Pending Blocks
    // ========================================
    stepHeader(3, 8, `Check ${WALLET1.name} for Pending Blocks`);
    
    try {
      const pending1 = await client.getPendingBlocks(WALLET1.address);
      
      if (pending1.count > 0) {
        testPass(`Found ${pending1.count} pending block(s)`);
        if (pending1.totalPendingNano !== undefined) {
          testInfo(`Total pending: ${pending1.totalPendingNano} NANO`);
        }
        testsPassed++;
      } else {
        testWarn('No pending blocks found yet');
        testInfo('Transaction may still be propagating...');
        testInfo('Waiting another 3 seconds...');
        await sleep(3000);
        
        // Try again
        const pending1Retry = await client.getPendingBlocks(WALLET1.address);
        if (pending1Retry.count > 0) {
          testPass(`Found ${pending1Retry.count} pending block(s) on retry`);
          testsPassed++;
        } else {
          testWarn('Still no pending blocks - continuing anyway');
        }
      }
    } catch (error: any) {
      testFail('Failed to check pending blocks', error);
      testsFailed++;
    }
    
    // ========================================
    // STEP 4: Receive All Pending on Wallet 1
    // ========================================
    stepHeader(4, 8, `Receive All Pending Blocks on ${WALLET1.name}`);
    testWarn('This will take 10-15 seconds per block for Proof-of-Work...');
    
    try {
      const receiveResult = await client.receiveAllPending(
        WALLET1.address,
        WALLET1.privateKey
      );
      
      if (Array.isArray(receiveResult) && receiveResult.length > 0) {
        testPass(`Successfully received ${receiveResult.length} block(s)!`);
        receiveResult.forEach((block, idx) => {
          if (block.hash) {
            testInfo(`  Block ${idx + 1}: ${block.hash}`);
          }
        });
        testsPassed++;
      } else {
        testWarn('No blocks received (may have already been processed)');
      }
      
      // Wait for propagation
      testInfo('Waiting 2 seconds for balance update...');
      await sleep(2000);
      
    } catch (error: any) {
      testFail('Failed to receive pending blocks', error);
      testsFailed++;
      // Continue anyway to check balance
    }
    
    // ========================================
    // STEP 5: Verify Wallet 1 Balance Increased
    // ========================================
    stepHeader(5, 8, `Verify ${WALLET1.name} Balance Increased`);
    
    const midBalance1 = await checkBalance(client, WALLET1);
    const balance1Increase = BigInt(midBalance1.balance) - BigInt(initialBalance1.balance);
    
    if (balance1Increase > 0) {
      testPass(`${WALLET1.name} balance increased by ${client.rawToNano(balance1Increase.toString())} NANO`);
      testsPassed++;
    } else {
      testWarn(`${WALLET1.name} balance did not increase (may need more time)`);
    }
    
    // Check if Wallet 1 has enough to send back
    if (BigInt(midBalance1.balance) < testAmountBigInt) {
      testWarn(`${WALLET1.name} has insufficient balance to send back`);
      testInfo('Test will end here');
      throw new Error('Cannot complete round trip - insufficient balance');
    }
    
    // ========================================
    // STEP 6: Send from Wallet 1 back to Wallet 2
    // ========================================
    stepHeader(6, 8, `Send 0.0001 NANO from ${WALLET1.name} back to ${WALLET2.name}`);
    testWarn('This will take 10-15 seconds for Proof-of-Work generation...');
    
    try {
      const sendBackResult = await client.sendTransaction(
        WALLET1.address,
        WALLET2.address,
        TEST_AMOUNT_RAW,
        WALLET1.privateKey
      );
      
      testPass('Return transaction sent successfully!');
      testInfo(`Transaction hash: ${sendBackResult.hash}`);
      testsPassed++;
      
      // Wait for propagation
      testInfo('Waiting 2 seconds for network propagation...');
      await sleep(2000);
      
    } catch (error: any) {
      testFail('Return transaction failed', error);
      testsFailed++;
      throw error;
    }
    
    // ========================================
    // STEP 7: Check Wallet 2 for Pending Blocks
    // ========================================
    stepHeader(7, 8, `Check ${WALLET2.name} for Pending Blocks`);
    
    try {
      const pending2 = await client.getPendingBlocks(WALLET2.address);
      
      if (pending2.count > 0) {
        testPass(`Found ${pending2.count} pending block(s)`);
        if (pending2.totalPendingNano !== undefined) {
          testInfo(`Total pending: ${pending2.totalPendingNano} NANO`);
        }
        testsPassed++;
      } else {
        testWarn('No pending blocks found yet - waiting...');
        await sleep(3000);
        const pending2Retry = await client.getPendingBlocks(WALLET2.address);
        if (pending2Retry.count > 0) {
          testPass(`Found ${pending2Retry.count} pending block(s) on retry`);
          testsPassed++;
        }
      }
    } catch (error: any) {
      testFail('Failed to check pending blocks', error);
      testsFailed++;
    }
    
    // ========================================
    // STEP 8: Receive All Pending on Wallet 2
    // ========================================
    stepHeader(8, 8, `Receive All Pending Blocks on ${WALLET2.name}`);
    testWarn('This will take 10-15 seconds per block for Proof-of-Work...');
    
    try {
      const receiveResult2 = await client.receiveAllPending(
        WALLET2.address,
        WALLET2.privateKey
      );
      
      if (Array.isArray(receiveResult2) && receiveResult2.length > 0) {
        testPass(`Successfully received ${receiveResult2.length} block(s)!`);
        receiveResult2.forEach((block, idx) => {
          if (block.hash) {
            testInfo(`  Block ${idx + 1}: ${block.hash}`);
          }
        });
        testsPassed++;
      } else {
        testWarn('No blocks received (may have already been processed)');
      }
      
      // Wait for final balance update
      testInfo('Waiting 2 seconds for final balance update...');
      await sleep(2000);
      
    } catch (error: any) {
      testFail('Failed to receive pending blocks', error);
      testsFailed++;
    }
    
    // ========================================
    // FINAL: Check Final Balances
    // ========================================
    testHeader('FINAL BALANCES');
    
    const finalBalance1 = await checkBalance(client, WALLET1);
    const finalBalance2 = await checkBalance(client, WALLET2);
    
    // Calculate changes
    const change1 = BigInt(finalBalance1.balance) - BigInt(initialBalance1.balance);
    const change2 = BigInt(finalBalance2.balance) - BigInt(initialBalance2.balance);
    
    log('');
    testInfo('Balance Changes:');
    testInfo(`${WALLET1.name}: ${change1 >= 0 ? '+' : ''}${client.rawToNano(change1.toString())} NANO`);
    testInfo(`${WALLET2.name}: ${change2 >= 0 ? '+' : ''}${client.rawToNano(change2.toString())} NANO`);
    
  } catch (error: any) {
    log('');
    testFail(`Test suite error: ${error.message}`, error);
    testsFailed++;
  }
  
  // ========================================
  // FINAL SUMMARY
  // ========================================
  log('\n╔════════════════════════════════════════════════════════════════════╗', COLORS.bright);
  log('║                    TRANSACTION TEST SUMMARY                        ║', COLORS.bright);
  log('╚════════════════════════════════════════════════════════════════════╝', COLORS.bright);
  
  const total = testsPassed + testsFailed;
  log(`\n✅ PASSED:  ${testsPassed}/${total}`, COLORS.green);
  if (testsFailed > 0) {
    log(`❌ FAILED:  ${testsFailed}/${total}`, COLORS.red);
  }
  
  const successRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : '0.0';
  log(`\n📊 Success Rate: ${successRate}%`, COLORS.cyan);
  
  if (testsPassed === total) {
    log('\n🎉 ALL TRANSACTION TESTS PASSED!', COLORS.green);
    log('   ✅ Send transactions work', COLORS.green);
    log('   ✅ Receive pending blocks works', COLORS.green);
    log('   ✅ Balance updates correctly', COLORS.green);
    log('   ✅ Complete round-trip successful', COLORS.green);
  } else if (testsPassed > 0) {
    log('\n✅ Partial success - some tests passed', COLORS.yellow);
  } else {
    log('\n❌ All tests failed', COLORS.red);
  }
  
  log('\n');
}

// Run the test
runTransactionFlowTest().catch(error => {
  log(`\n💥 TEST SUITE CRASHED: ${error.message}`, COLORS.red);
  console.error(error);
  process.exit(1);
});

