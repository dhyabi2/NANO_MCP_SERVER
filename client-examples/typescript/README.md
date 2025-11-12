# NANO MCP TypeScript Client - Production Ready

**Production-level TypeScript client for the NANO MCP Server** with full type safety, auto-retry, validation, and comprehensive error handling.

---

## ✨ Features

- ✅ **Full TypeScript Type Safety** - Auto-completion and compile-time checks
- ✅ **Auto-Retry Logic** - Handles `INSUFFICIENT_WORK` and transient errors
- ✅ **Client & Server Validation** - Validate before sending
- ✅ **JSON Schema Integration** - Auto-discovery and validation
- ✅ **Comprehensive Error Handling** - Errors include `nextSteps` and guidance
- ✅ **Production Timeouts** - 30s default, 60s for transactions
- ✅ **Helper Functions** - `nanoToRaw()`, `rawToNano()`, constants
- ✅ **Zero Configuration** - Works out of the box

---

## 🚀 Quick Start

### Installation

```typescript
// Copy nano-mcp-client.ts to your project
import { NanoMcpClient, nanoToRaw, rawToNano } from './nano-mcp-client';

const client = new NanoMcpClient('https://nano-mcp.replit.app');
```

### Basic Usage

```typescript
// Generate wallet
const wallet = await client.generateWallet();
console.log(wallet.address);

// Check balance
const balance = await client.getBalance(wallet.address);
console.log(`Balance: ${balance.balanceNano} NANO`);

// Send transaction (with auto-retry)
const tx = await client.sendTransaction(
  fromAddress,
  toAddress,
  nanoToRaw('0.001'), // Helper function
  privateKey
);
console.log(`Hash: ${tx.hash}`);
```

---

## 📖 Complete API Reference

### Wallet Operations

#### `generateWallet()`
Generate a new NANO wallet with address, private key, public key, and seed.

```typescript
const wallet = await client.generateWallet();
// Returns: { address, privateKey, publicKey, seed }
```

---

### Balance & Status

#### `getBalance(address)`
Get balance and pending amounts for an address.

```typescript
const balance = await client.getBalance('nano_...');
// Returns: { balance, balanceNano, pending, pendingNano }
```

#### `getAccountStatus(address)` ⭐ **RECOMMENDED**
Get comprehensive account status with actionable recommendations.

```typescript
const status = await client.getAccountStatus('nano_...');
// Returns: {
//   address, initialized, balance, balanceNano,
//   pendingCount, totalPending, totalPendingNano,
//   canSend, needsAction[], representative
// }

// Smart action handling
if (status.needsAction.length > 0) {
  console.log('Actions needed:', status.needsAction);
  // ["REQUIRED: Call initializeAccount", ...]
}
```

---

### Transactions

#### `initializeAccount(address, privateKey)`
Initialize (open) an account by receiving the first pending block.

**Important:** Account must have pending blocks first!

```typescript
const result = await client.initializeAccount(address, privateKey);
// Returns: { initialized, hash, balance, representative }
// Time: ~10-15 seconds (PoW generation)
```

#### `receiveAllPending(address, privateKey)`
Receive all pending blocks for an address.

```typescript
const results = await client.receiveAllPending(address, privateKey);
// Returns: [{ hash }, { hash }, ...]
// Time: ~6-10 seconds per block
```

#### `sendTransaction(fromAddress, toAddress, amountRaw, privateKey)` ⭐
Send NANO with **automatic retry** on transient errors.

```typescript
const tx = await client.sendTransaction(
  'nano_from...',
  'nano_to...',
  nanoToRaw('0.001'), // Convert NANO to raw
  privateKey
);
// Returns: { success: true, hash }
// Time: ~15-20 seconds (PoW generation)
// Retries: 3 attempts on INSUFFICIENT_WORK or server errors
```

**Features:**
- ✅ Client-side validation before sending
- ✅ Auto-retry on `INSUFFICIENT_WORK` (up to 3 times)
- ✅ Exponential backoff (2s, 4s, 8s)
- ✅ No retry on validation errors (fast fail)

---

### Utilities

#### `convertBalance(amount, from, to)`
Convert between NANO and raw units (server-side).

```typescript
const result = await client.convertBalance('0.1', 'nano', 'raw');
// Returns: { original, converted, from, to }
```

#### `nanoToRaw(amount)` - Helper Function
Convert NANO to raw (client-side, instant).

```typescript
const raw = nanoToRaw('0.1');
// Returns: "100000000000000000000000000000"
```

#### `rawToNano(amount)` - Helper Function
Convert raw to NANO (client-side, instant).

```typescript
const nano = rawToNano('100000000000000000000000000000');
// Returns: "0.100000"
```

#### Constants
```typescript
import { XNO } from './nano-mcp-client';

XNO.ONE_NANO          // "1000000000000000000000000000000"
XNO.POINT_ONE_NANO    // "100000000000000000000000000000"
XNO.POINT_ZERO_ONE_NANO  // "10000000000000000000000000000"
```

#### `generateQrCode(address, amount?)`
Generate QR code for payment request.

```typescript
const qr = await client.generateQrCode('nano_...', '0.1');
// Returns: { qrCode: "base64...", nanoUri: "nano:nano_...?amount=..." }
```

---

### Schema Discovery

#### `getSchema()`
Get complete JSON Schema for all tools.

```typescript
const schema = await client.getSchema();
// Returns: { version, tools[], errorSchema, metadata }
```

#### `getToolSchema(toolName)`
Get schema for a specific tool.

```typescript
const toolSchema = await client.getToolSchema('sendTransaction');
// Returns: { name, category, inputSchema, responseSchema, examples, ... }
```

#### `getExamples(toolName)`
Get copy-paste ready examples for a tool.

```typescript
const examples = await client.getExamples('generateWallet');
// Returns: { tool, examples: [{ request, response }] }
```

#### `validateParams(method, params)`
Validate parameters before sending (pre-flight check).

```typescript
const validation = await client.validateParams('sendTransaction', {
  fromAddress: 'nano_...',
  toAddress: 'nano_...',
  amountRaw: '1000000000000000000000000000',
  privateKey: '9f0e...'
});
// Returns: { valid: true/false, errors: [] }
```

---

## 🎯 Usage Examples

### Example 1: Complete Workflow

```typescript
import { NanoMcpClient, nanoToRaw } from './nano-mcp-client';

async function completeWorkflow() {
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  
  try {
    // 1. Generate wallet
    const wallet = await client.generateWallet();
    console.log('Wallet:', wallet.address);
    
    // 2. Check status
    const status = await client.getAccountStatus(wallet.address);
    console.log('Initialized:', status.initialized);
    console.log('Can Send:', status.canSend);
    
    // 3. Initialize if needed
    if (!status.initialized && status.pendingCount > 0) {
      const init = await client.initializeAccount(
        wallet.address,
        wallet.privateKey
      );
      console.log('Initialized! Hash:', init.hash);
    }
    
    // 4. Send transaction
    if (status.canSend) {
      const tx = await client.sendTransaction(
        wallet.address,
        'nano_1x7biz69cem95oo7gxkdkdbxsfs6ixkxx833fz3ps9qxh3uofa1hr8ejkizd',
        nanoToRaw('0.001'),
        wallet.privateKey
      );
      console.log('Transaction hash:', tx.hash);
    }
    
  } catch (error: any) {
    // Error includes nextSteps and guidance
    console.error('Error:', error.message);
  }
}
```

### Example 2: Smart Status Handling

```typescript
async function smartStatusHandling() {
  const client = new NanoMcpClient('https://nano-mcp.replit.app');
  const status = await client.getAccountStatus(address);
  
  // Automatically handle recommended actions
  if (status.needsAction.length > 0) {
    console.log('Actions needed:');
    status.needsAction.forEach(action => {
      console.log(`  - ${action}`);
    });
    
    // Example action: Initialize if needed
    if (!status.initialized && status.pendingCount > 0) {
      await client.initializeAccount(address, privateKey);
    }
  }
}
```

### Example 3: Error Handling with Guidance

```typescript
try {
  await client.sendTransaction(from, to, amount, key);
} catch (error: any) {
  console.error(error.message);
  // Error format:
  // [INSUFFICIENT_BALANCE] Insufficient balance
  // Details: { address, currentBalance, attemptedAmount, shortfall }
  // 
  // Next Steps:
  //   - Step 1: Check current balance using getBalance
  //   - Step 2: Reduce amount or fund account
  //   - Step 3: Retry transaction
  //
  // Related Functions: getBalance, getAccountInfo
}
```

### Example 4: Pre-Flight Validation

```typescript
// Validate before sending (saves time and prevents errors)
const validation = await client.validateParams('sendTransaction', {
  fromAddress: 'nano_...',
  toAddress: 'nano_...',
  amountRaw: '1000000000000000000000000000',
  privateKey: '9f0e...'
});

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  // ["Parameter 'fromAddress' does not match expected pattern", ...]
  return;
}

// Proceed with transaction
await client.sendTransaction(...);
```

---

## ⚙️ Configuration

### Custom Server URL

```typescript
const client = new NanoMcpClient('http://localhost:8080');
```

### Timeouts

The client uses production-tested timeouts:
- **Default operations:** 30 seconds
- **Transactions (PoW):** 60 seconds
- **Auto-retry delays:** 2s, 4s, 8s (exponential backoff)

---

## 🔒 Security Best Practices

### Private Key Handling

```typescript
// ❌ NEVER do this
const privateKey = 'hardcoded_key_here';

// ✅ Use environment variables
const privateKey = process.env.NANO_PRIVATE_KEY!;

// ✅ Or secure key management
import { getSecureKey } from './key-manager';
const privateKey = await getSecureKey('wallet1');
```

### Validation

```typescript
// Client validates automatically
try {
  await client.sendTransaction(
    'invalid_address', // ❌ Caught before network call
    'nano_...',
    '100',
    'short_key' // ❌ Caught before network call
  );
} catch (error) {
  // Error: fromAddress must be a valid NANO address
}
```

---

## 🧪 Testing

Run the example usage file:

```bash
# Install dependencies (if not already installed)
npm install node-fetch

# Run examples
ts-node example-usage.ts
```

Or test individual examples:

```typescript
import { example1_BasicWallet } from './example-usage';
await example1_BasicWallet();
```

---

## 📊 Performance Notes

| Operation | Average Duration | Timeout |
|-----------|-----------------|---------|
| `generateWallet()` | < 100ms | 30s |
| `getBalance()` | < 500ms | 30s |
| `getAccountStatus()` | < 1s | 30s |
| `initializeAccount()` | 10-15s | 60s |
| `receiveAllPending()` | 6-10s per block | 60s |
| `sendTransaction()` | 15-20s | 60s |
| `convertBalance()` | < 100ms | 30s |

**Note:** Transaction times include Proof-of-Work (PoW) generation, which is CPU-intensive.

---

## ❌ Common Errors & Solutions

### `INSUFFICIENT_BALANCE`
**Error:** Not enough NANO to send
**Solution:** Check balance with `getAccountStatus()`, fund account, or reduce amount

### `INSUFFICIENT_WORK`
**Error:** PoW doesn't meet difficulty threshold
**Solution:** **Simply retry** - client auto-retries 3 times

### `ACCOUNT_NOT_INITIALIZED`
**Error:** Account not opened yet
**Solution:** Call `initializeAccount()` first (requires pending blocks)

### `INVALID_ADDRESS_FORMAT`
**Error:** Address format is wrong
**Solution:** Ensure address starts with `nano_` or `xrb_` and is 60-65 characters

### `INVALID_PRIVATE_KEY_LENGTH`
**Error:** Private key is not 64 characters
**Solution:** Ensure private key is exactly 64 hexadecimal characters

---

## 📚 Additional Resources

- **Full API Documentation:** `../../README.md`
- **Error Handling Guide:** `../../docs/AI_AGENT_ERROR_HANDLING.md`
- **JSON Schema Guide:** `../../docs/JSON_SCHEMA_AI_AGENT_GUIDE.md`
- **Production Server:** https://nano-mcp.replit.app
- **GitHub Repository:** https://github.com/dhyabi2/NANO_MCP_SERVER

---

## 🤝 Support

If you encounter issues:
1. Check the error message - it includes `nextSteps` and `relatedFunctions`
2. Validate parameters using `validateParams()` before sending
3. Check account status with `getAccountStatus()`
4. Review examples in `example-usage.ts`

---

## ✅ Summary

**This TypeScript client provides:**
- ✅ Production-ready with auto-retry and proper timeouts
- ✅ Full type safety with TypeScript
- ✅ Client & server-side validation
- ✅ Comprehensive error handling with guidance
- ✅ JSON Schema integration for auto-discovery
- ✅ Helper functions for unit conversion
- ✅ Zero configuration required

**Perfect for:**
- Production applications
- AI agent integration
- Type-safe development
- Enterprise use cases

---

**🚀 Start building with NANO in minutes, not hours!**

