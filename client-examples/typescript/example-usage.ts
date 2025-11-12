/**
 * NANO MCP Client - Production Usage Examples
 * 
 * This file demonstrates real-world usage patterns for the NANO MCP Client
 */

import { NanoMcpClient, nanoToRaw, rawToNano, XNO } from './nano-mcp-client';

// ============================================================================
// EXAMPLE 1: Basic Wallet Generation and Balance Check
// ============================================================================

async function example1_BasicWallet() {
  console.log('\n=== Example 1: Basic Wallet Generation ===\n');
  
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  
  try {
    // Generate new wallet
    const wallet = await client.generateWallet();
    console.log('✅ Wallet generated:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey.substring(0, 10)}...`);
    console.log(`   Public Key: ${wallet.publicKey.substring(0, 10)}...`);
    console.log(`   Seed: ${wallet.seed.substring(0, 10)}...`);
    
    // Check balance
    const balance = await client.getBalance(wallet.address);
    console.log('\n✅ Balance:');
    console.log(`   Balance: ${balance.balanceNano} NANO (${balance.balance} raw)`);
    console.log(`   Pending: ${balance.pendingNano} NANO (${balance.pending} raw)`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 2: Account Status and Smart Initialization
// ============================================================================

async function example2_SmartAccountStatus() {
  console.log('\n=== Example 2: Smart Account Status ===\n');
  
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  
  const address = 'nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn';
  const privateKey = 'your_private_key_here';
  
  try {
    // Get comprehensive account status
    const status = await client.getAccountStatus(address);
    
    console.log('✅ Account Status:');
    console.log(`   Address: ${status.address}`);
    console.log(`   Initialized: ${status.initialized}`);
    console.log(`   Balance: ${status.balanceNano} NANO`);
    console.log(`   Pending Blocks: ${status.pendingCount}`);
    console.log(`   Pending Amount: ${status.totalPendingNano} NANO`);
    console.log(`   Can Send: ${status.canSend}`);
    
    // Smart action handler based on status
    if (status.needsAction.length > 0) {
      console.log('\n📋 Actions needed:');
      status.needsAction.forEach(action => {
        console.log(`   - ${action}`);
      });
      
      // Auto-execute recommended actions
      if (!status.initialized && status.pendingCount > 0) {
        console.log('\n🔄 Auto-initializing account...');
        const init = await client.initializeAccount(address, privateKey);
        console.log(`✅ Account initialized! Hash: ${init.hash}`);
      }
    } else {
      console.log('\n✅ Account is ready for transactions!');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 3: Sending Transaction with Auto-Retry
// ============================================================================

async function example3_SendWithRetry() {
  console.log('\n=== Example 3: Send Transaction (with auto-retry) ===\n');
  
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  
  const fromAddress = 'nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn';
  const toAddress = 'nano_1x7biz69cem95oo7gxkdkdbxsfs6ixkxx833fz3ps9qxh3uofa1hr8ejkizd';
  const privateKey = 'your_private_key_here';
  
  try {
    // Convert NANO to raw
    const amountNano = '0.001';
    const amountRaw = nanoToRaw(amountNano);
    console.log(`📤 Sending ${amountNano} NANO (${amountRaw} raw)`);
    console.log(`   From: ${fromAddress.substring(0, 15)}...`);
    console.log(`   To: ${toAddress.substring(0, 15)}...`);
    
    // Send with automatic retry on INSUFFICIENT_WORK or transient errors
    console.log('\n⏳ Sending transaction (may take 15-20 seconds for PoW)...');
    const result = await client.sendTransaction(
      fromAddress,
      toAddress,
      amountRaw,
      privateKey
    );
    
    console.log('\n✅ Transaction sent successfully!');
    console.log(`   Hash: ${result.hash}`);
    console.log(`   Explorer: https://nanolooker.com/block/${result.hash}`);
    
  } catch (error: any) {
    console.error('\n❌ Transaction failed:', error.message);
    // Error message includes nextSteps and related functions
  }
}

// ============================================================================
// EXAMPLE 4: Receiving Pending Blocks
// ============================================================================

async function example4_ReceivePending() {
  console.log('\n=== Example 4: Receive Pending Blocks ===\n');
  
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  
  const address = 'nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn';
  const privateKey = 'your_private_key_here';
  
  try {
    // Check for pending blocks first
    const status = await client.getAccountStatus(address);
    console.log(`📦 Pending blocks: ${status.pendingCount}`);
    console.log(`💰 Pending amount: ${status.totalPendingNano} NANO`);
    
    if (status.pendingCount === 0) {
      console.log('\n✅ No pending blocks to receive');
      return;
    }
    
    // Receive all pending blocks
    console.log('\n⏳ Receiving pending blocks (6-10 seconds each)...');
    const results = await client.receiveAllPending(address, privateKey);
    
    console.log(`\n✅ Received ${results.length} blocks!`);
    results.forEach((result, index) => {
      console.log(`   ${index + 1}. Hash: ${result.hash}`);
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 5: Complete Workflow (Generate → Fund → Send)
// ============================================================================

async function example5_CompleteWorkflow() {
  console.log('\n=== Example 5: Complete Workflow ===\n');
  
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  
  try {
    // Step 1: Generate two wallets
    console.log('1️⃣ Generating two wallets...');
    const wallet1 = await client.generateWallet();
    const wallet2 = await client.generateWallet();
    
    console.log(`   Wallet 1: ${wallet1.address}`);
    console.log(`   Wallet 2: ${wallet2.address}`);
    
    // Step 2: Check status
    console.log('\n2️⃣ Checking wallet 1 status...');
    const status = await client.getAccountStatus(wallet1.address);
    console.log(`   Initialized: ${status.initialized}`);
    console.log(`   Pending: ${status.pendingCount} blocks (${status.totalPendingNano} NANO)`);
    console.log(`   Can Send: ${status.canSend}`);
    
    // Step 3: Initialize if needed
    if (!status.initialized && status.pendingCount > 0) {
      console.log('\n3️⃣ Initializing wallet 1...');
      const init = await client.initializeAccount(wallet1.address, wallet1.privateKey);
      console.log(`   ✅ Initialized! Hash: ${init.hash}`);
    }
    
    // Step 4: Send transaction (only if funded)
    if (status.canSend && parseFloat(status.balanceNano) > 0) {
      console.log('\n4️⃣ Sending 0.001 NANO to wallet 2...');
      const tx = await client.sendTransaction(
        wallet1.address,
        wallet2.address,
        nanoToRaw('0.001'),
        wallet1.privateKey
      );
      console.log(`   ✅ Sent! Hash: ${tx.hash}`);
    } else {
      console.log('\n⚠️  Wallet 1 needs funding before sending');
      console.log(`   Fund this address: ${wallet1.address}`);
    }
    
  } catch (error: any) {
    console.error('\n❌ Workflow error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 6: Unit Conversion Helpers
// ============================================================================

async function example6_UnitConversion() {
  console.log('\n=== Example 6: Unit Conversion ===\n');
  
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  
  try {
    // Client-side conversion (instant, no API call)
    console.log('🔄 Client-side conversion:');
    const nanoAmount = '0.1';
    const rawAmount = nanoToRaw(nanoAmount);
    console.log(`   ${nanoAmount} NANO = ${rawAmount} raw`);
    console.log(`   ${rawAmount} raw = ${rawToNano(rawAmount)} NANO`);
    
    // Server-side conversion (uses MCP)
    console.log('\n🔄 Server-side conversion:');
    const result = await client.convertBalance('0.1', 'nano', 'raw');
    console.log(`   Original: ${result.original} ${result.from}`);
    console.log(`   Converted: ${result.converted} ${result.to}`);
    
    // Using constants
    console.log('\n📊 Common amounts:');
    console.log(`   1 NANO = ${XNO.ONE_NANO} raw`);
    console.log(`   0.1 NANO = ${XNO.POINT_ONE_NANO} raw`);
    console.log(`   0.01 NANO = ${XNO.POINT_ZERO_ONE_NANO} raw`);
    console.log(`   0.001 NANO = ${XNO.POINT_ZERO_ZERO_ONE_NANO} raw`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 7: Generate QR Code for Payment
// ============================================================================

async function example7_QrCode() {
  console.log('\n=== Example 7: QR Code Generation ===\n');
  
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  
  const address = 'nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn';
  
  try {
    // Generate QR code with amount
    const qr = await client.generateQrCode(address, '0.1');
    
    console.log('✅ QR Code generated:');
    console.log(`   URI: ${qr.nanoUri}`);
    console.log(`   Image: Base64 PNG (${qr.qrCode.length} chars)`);
    console.log('\n   Save to file:');
    console.log(`   echo "${qr.qrCode}" | base64 -d > payment-qr.png`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 8: Schema Discovery and Validation
// ============================================================================

async function example8_SchemaDiscovery() {
  console.log('\n=== Example 8: Schema Discovery ===\n');
  
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  
  try {
    // Get complete schema
    const schema = await client.getSchema();
    console.log('📖 Schema information:');
    console.log(`   Version: ${schema.version}`);
    console.log(`   Tools: ${schema.tools.length}`);
    console.log(`   Error codes: ${schema.errorSchema.properties.errorCode.enum.length}`);
    
    // Get specific tool schema
    const toolSchema = await client.getToolSchema('sendTransaction');
    console.log('\n📝 sendTransaction schema:');
    console.log(`   Category: ${toolSchema.category}`);
    console.log(`   Required params: ${toolSchema.inputSchema.required.join(', ')}`);
    console.log(`   Examples: ${toolSchema.examples.length}`);
    
    // Get examples
    const examples = await client.getExamples('sendTransaction');
    console.log('\n📚 Example requests:');
    console.log(`   Available: ${examples.examples.length}`);
    console.log(`   First example method: ${examples.examples[0].request.method}`);
    
    // Validate parameters
    const validation = await client.validateParams('sendTransaction', {
      fromAddress: 'invalid',
      toAddress: 'nano_...',
      amountRaw: '100',
      privateKey: 'short'
    });
    console.log('\n✅ Parameter validation:');
    console.log(`   Valid: ${validation.valid}`);
    if (!validation.valid) {
      console.log(`   Errors found: ${validation.errors.length}`);
      validation.errors.forEach(err => console.log(`     - ${err}`));
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 9: Error Handling with Guidance
// ============================================================================

async function example9_ErrorHandling() {
  console.log('\n=== Example 9: Error Handling ===\n');
  
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  
  try {
    // Intentionally trigger validation error
    await client.sendTransaction(
      'invalid_address',
      'nano_...',
      '100',
      'short_key'
    );
    
  } catch (error: any) {
    console.error('❌ Caught expected error:');
    console.error(error.message);
    // Error includes:
    // - Error code (INVALID_ADDRESS_FORMAT, etc.)
    // - Detailed description
    // - nextSteps array with guidance
    // - relatedFunctions to help resolve
    // - exampleRequest for copy-paste
  }
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

async function runAllExamples() {
  console.log('\n' + '='.repeat(80));
  console.log('NANO MCP CLIENT - PRODUCTION USAGE EXAMPLES');
  console.log('='.repeat(80));
  
  // Uncomment to run specific examples:
  
  // await example1_BasicWallet();
  // await example2_SmartAccountStatus();
  // await example3_SendWithRetry();
  // await example4_ReceivePending();
  // await example5_CompleteWorkflow();
  // await example6_UnitConversion();
  // await example7_QrCode();
  await example8_SchemaDiscovery();
  // await example9_ErrorHandling();
  
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLES COMPLETED');
  console.log('='.repeat(80) + '\n');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_BasicWallet,
  example2_SmartAccountStatus,
  example3_SendWithRetry,
  example4_ReceivePending,
  example5_CompleteWorkflow,
  example6_UnitConversion,
  example7_QrCode,
  example8_SchemaDiscovery,
  example9_ErrorHandling
};

