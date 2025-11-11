# NANO MCP Server - AI Agent Integration Guide

> **For AI Agents**: This server is designed specifically for autonomous agents. All errors are self-documenting with step-by-step guidance. No external documentation needed.

---

## 🤖 Quick Start for AI Agents

### Step 1: Install and Run (2 minutes)
```bash
cd NANO_MCP_SERVER
npm install
npm start
```
Server runs on: `http://localhost:8080`

### Step 2: Test Connection
```json
POST http://localhost:8080
{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
}
```

### Step 3: You're Ready!
The server responds with all available methods. Start using them immediately.

---

## 🎯 What This Server Does

**NANO MCP Server** provides JSON-RPC 2.0 API for NANO cryptocurrency operations with:
- ✅ **Self-documenting errors** - Every error tells you exactly what to do next
- ✅ **Helper functions** - Convert units, check account status automatically
- ✅ **Test wallet system** - Generate and manage test wallets for development
- ✅ **No external docs needed** - All information in API responses

**NANO Cryptocurrency Features:**
- Instant transactions (< 1 second)
- Zero fees
- Eco-friendly (minimal energy)
- Perfect for automated AI systems

---

## 📋 Available MCP Functions

### Core Functions (8)
1. `generateWallet` - Create new NANO wallet
2. `getBalance` - Check account balance
3. `getAccountInfo` - Get detailed account data
4. `getPendingBlocks` - List pending transactions
5. `initializeAccount` - Open/activate new account
6. `sendTransaction` - Send NANO (with enhanced errors)
7. `receiveAllPending` - Receive all pending blocks
8. `generateQrCode` - Create payment QR code

### Helper Functions (2) - For Autonomous Agents
9. **`convertBalance`** - Convert NANO ↔ raw units
10. **`getAccountStatus`** - One call shows: balance, pending, capabilities, what actions needed

### Test Wallet Functions (5)
11. `setupTestWallets` - Generate two test wallets
12. `getTestWallets` - Retrieve test wallet info
13. `updateTestWalletBalance` - Update wallet balance tracking
14. `checkTestWalletsFunding` - Check if wallets are ready
15. `resetTestWallets` - Delete and start fresh

---

## 🚀 Complete Workflow for AI Agents

### Workflow: Send NANO Transaction

```javascript
// Step 1: Check account status first (ALWAYS DO THIS)
POST http://localhost:8080
{
    "jsonrpc": "2.0",
    "method": "getAccountStatus",
    "params": {
        "address": "nano_your_address"
    },
    "id": 1
}

// Response shows:
// - initialized: true/false
// - balance: {raw, nano}
// - pending: {count, amount}
// - needsAction: [array of required actions]
// - readyForTesting: true/false

// Step 2: Handle any required actions
// If needsAction includes "initializeAccount":
{
    "jsonrpc": "2.0",
    "method": "initializeAccount",
    "params": {
        "address": "nano_your_address",
        "privateKey": "your_private_key"
    },
    "id": 2
}

// If needsAction includes "receiveAllPending":
{
    "jsonrpc": "2.0",
    "method": "receiveAllPending",
    "params": {
        "address": "nano_your_address",
        "privateKey": "your_private_key"
    },
    "id": 3
}

// Step 3: Convert amount to raw units
{
    "jsonrpc": "2.0",
    "method": "convertBalance",
    "params": {
        "amount": "0.1",
        "from": "nano",
        "to": "raw"
    },
    "id": 4
}
// Returns: {"converted": "100000000000000000000000000000"}

// Step 4: Send transaction
{
    "jsonrpc": "2.0",
    "method": "sendTransaction",
    "params": {
        "fromAddress": "nano_sender",
        "toAddress": "nano_recipient",
        "amountRaw": "100000000000000000000000000",
        "privateKey": "sender_private_key"
    },
    "id": 5
}

// Success: {"success": true, "hash": "..."}
// Error: Detailed error with nextSteps (see Error Handling section)
```

---

## ⚡ Quick Reference: Common Tasks

### Task 1: Generate New Wallet
```json
{"jsonrpc": "2.0", "method": "generateWallet", "params": {}, "id": 1}
```
Returns: `address`, `privateKey`, `publicKey`, `seed`

### Task 2: Check Balance
```json
{"jsonrpc": "2.0", "method": "getBalance", "params": {"address": "nano_xxx"}, "id": 1}
```
Returns: `balance` (raw), `pending` (raw)

### Task 3: Convert Units
```json
{"jsonrpc": "2.0", "method": "convertBalance", "params": {"amount": "0.1", "from": "nano", "to": "raw"}, "id": 1}
```
Returns: `converted` value with formula

### Task 4: Check Account Readiness
```json
{"jsonrpc": "2.0", "method": "getAccountStatus", "params": {"address": "nano_xxx"}, "id": 1}
```
Returns: Complete status + what to do next

---

## 🧠 Error Handling for AI Agents

### How Errors Work
**All errors include:**
- `errorCode` - Machine-readable code
- `error` - Human-readable message
- `details` - Specific context (current balance, amounts, etc.)
- `nextSteps` - Step-by-step remediation (array of strings)
- `relatedFunctions` - What functions to call next
- `exampleRequest` - Copy-paste ready example

### Example: Insufficient Balance Error

**Request:**
```json
{
    "jsonrpc": "2.0",
    "method": "sendTransaction",
    "params": {
        "fromAddress": "nano_xxx",
        "toAddress": "nano_yyy",
        "amountRaw": "1000000000000000000000000000",
        "privateKey": "key"
    },
    "id": 1
}
```

**Error Response:**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "success": false,
        "error": "Insufficient balance",
        "errorCode": "INSUFFICIENT_BALANCE",
        "details": {
            "address": "nano_xxx",
            "currentBalance": "80000000000000000000000000",
            "currentBalanceNano": "0.00016",
            "attemptedAmount": "1000000000000000000000000000",
            "attemptedAmountNano": "0.002",
            "shortfall": "920000000000000000000000000",
            "shortfallNano": "0.00184"
        },
        "nextSteps": [
            "Step 1: Check current balance using getBalance or getAccountInfo",
            "Step 2: Either reduce send amount to maximum 0.00016 NANO or less",
            "Step 3: Or fund account with additional 0.00184 NANO minimum",
            "Step 4: After funding, use receiveAllPending to process pending blocks",
            "Step 5: Retry your send transaction"
        ],
        "relatedFunctions": ["getBalance", "getAccountInfo", "receiveAllPending"],
        "exampleRequest": {
            "jsonrpc": "2.0",
            "method": "getBalance",
            "params": {"address": "nano_xxx"},
            "id": 1
        }
    },
    "id": 1
}
```

### Error Codes Reference

| Error Code | What It Means | Auto-Recoverable | Action |
|------------|---------------|------------------|--------|
| `INSUFFICIENT_BALANCE` | Not enough NANO | Yes | Reduce amount or fund account |
| `ACCOUNT_NOT_INITIALIZED` | Account not opened | Yes | Call initializeAccount |
| `ACCOUNT_NOT_INITIALIZED_NO_PENDING` | No funds available | No | Send NANO to address first |
| `PENDING_BLOCKS_NOT_RECEIVED` | Has pending blocks | Yes | Call receiveAllPending |
| `INVALID_AMOUNT_FORMAT` | Wrong units | Yes | Use convertBalance |
| `BLOCKCHAIN_ERROR` | Generic blockchain issue | Maybe | Check getAccountStatus |
| `VALIDATION_ERROR` | Invalid parameter | Yes | Fix per error message |

### Decision Tree for Error Handling

```
Receive Error
  |
  ├─> errorCode == "INSUFFICIENT_BALANCE"
  |     ├─> Check details.shortfall
  |     ├─> Option 1: Reduce amountRaw
  |     └─> Option 2: Fund account
  |
  ├─> errorCode == "ACCOUNT_NOT_INITIALIZED"
  |     ├─> Check details.hasPendingBlocks
  |     ├─> If true: Call initializeAccount
  |     └─> If false: Send NANO to address first
  |
  ├─> errorCode == "PENDING_BLOCKS_NOT_RECEIVED"
  |     └─> Call receiveAllPending
  |
  └─> Other errors
        └─> Follow nextSteps array
```

---

## 🧪 Test Wallet System (For Development)

### Quick Setup
```json
// 1. Generate test wallets
{"jsonrpc": "2.0", "method": "setupTestWallets", "params": {}, "id": 1}

// Response includes two wallets with addresses
// Copy addresses and fund them with test NANO

// 2. Check funding status
{"jsonrpc": "2.0", "method": "checkTestWalletsFunding", "params": {}, "id": 2}

// 3. When both funded, start testing!
```

### Test Wallet Workflow
```
setupTestWallets
     ↓
Fund addresses (external)
     ↓
initializeAccount (both wallets)
     ↓
updateTestWalletBalance (both wallets)
     ↓
checkTestWalletsFunding
     ↓
Ready for send/receive testing!
```

---

## 💡 Decision Tree: Complete Transaction Flow

```
START
  |
  v
Call: getAccountStatus(address)
  |
  ├─> initialized: false
  |   |
  |   ├─> hasPendingBlocks: true
  |   |   └─> Call: initializeAccount
  |   |
  |   └─> hasPendingBlocks: false
  |       └─> STOP: Fund account first
  |
  └─> initialized: true
      |
      ├─> pendingCount > 0
      |   └─> Call: receiveAllPending
      |
      └─> canSend: true
          |
          v
      Call: convertBalance(amount, "nano", "raw")
          |
          v
      Call: sendTransaction(...)
          |
          ├─> success: true
          |   └─> DONE!
          |
          └─> success: false
              └─> Parse errorCode
                  └─> Follow nextSteps in error response
```

---

## 📊 Unit Conversion (Important!)

**NANO uses TWO units:**
- **NANO** (decimal, e.g., "0.1") - Human-readable
- **raw** (integer string) - Blockchain uses this

**Conversion:**
- 1 NANO = 10³⁰ raw
- Always use raw for `amountRaw` parameter

**Quick Reference:**
| NANO | Raw |
|------|-----|
| 0.000001 | 1000000000000000000000000 |
| 0.001 | 1000000000000000000000000000 |
| 0.01 | 10000000000000000000000000000 |
| 0.1 | 100000000000000000000000000000 |
| 1.0 | 1000000000000000000000000000000 |

**Use convertBalance function:**
```json
{"jsonrpc": "2.0", "method": "convertBalance", "params": {"amount": "0.1", "from": "nano", "to": "raw"}, "id": 1}
```

---

## 🔧 Setup and Configuration

### Installation
```bash
# Clone or download
cd NANO_MCP_SERVER

# Install dependencies
npm install

# Run server
npm start
```

### Environment Variables (Optional)
```bash
MCP_PORT=8080                    # Server port (default: 8080)
MCP_TRANSPORT=http               # Transport type (default: http)
NANO_RPC_URL=https://...         # NANO RPC node (has default)
NANO_REPRESENTATIVE=nano_xxx     # Representative (has default)
```

### Testing
```bash
# Run tests (21 tests for test wallet system)
npm test
```

---

## 📚 Complete Function Reference

### generateWallet
**Purpose:** Create new NANO wallet
**Parameters:** None
**Returns:** `address`, `privateKey`, `publicKey`, `seed`
```json
{"jsonrpc": "2.0", "method": "generateWallet", "params": {}, "id": 1}
```

### getBalance
**Purpose:** Check account balance
**Parameters:** `address`
**Returns:** `balance` (raw), `pending` (raw)
```json
{"jsonrpc": "2.0", "method": "getBalance", "params": {"address": "nano_xxx"}, "id": 1}
```

### getAccountInfo
**Purpose:** Get detailed account information
**Parameters:** `address`
**Returns:** `frontier`, `balance`, `representative`, `block_count`, etc.
```json
{"jsonrpc": "2.0", "method": "getAccountInfo", "params": {"address": "nano_xxx"}, "id": 1}
```

### getPendingBlocks
**Purpose:** List pending (unreceived) transactions
**Parameters:** `address`
**Returns:** Object with pending blocks and amounts
```json
{"jsonrpc": "2.0", "method": "getPendingBlocks", "params": {"address": "nano_xxx"}, "id": 1}
```

### initializeAccount
**Purpose:** Open/activate new account (first receive)
**Parameters:** `address`, `privateKey`
**Returns:** `initialized`, `blockHash`, `balance`, etc.
```json
{"jsonrpc": "2.0", "method": "initializeAccount", "params": {"address": "nano_xxx", "privateKey": "key"}, "id": 1}
```

### sendTransaction
**Purpose:** Send NANO to another address
**Parameters:** `fromAddress`, `toAddress`, `amountRaw`, `privateKey`
**Returns:** `success`, `hash` OR enhanced error
```json
{"jsonrpc": "2.0", "method": "sendTransaction", "params": {"fromAddress": "nano_xxx", "toAddress": "nano_yyy", "amountRaw": "100000000000000000000000000", "privateKey": "key"}, "id": 1}
```

### receiveAllPending
**Purpose:** Receive all pending transactions
**Parameters:** `address`, `privateKey`
**Returns:** Array of received blocks
```json
{"jsonrpc": "2.0", "method": "receiveAllPending", "params": {"address": "nano_xxx", "privateKey": "key"}, "id": 1}
```

### generateQrCode
**Purpose:** Create QR code for payment
**Parameters:** `address`, `amount` (in NANO)
**Returns:** `qrCode` (base64), `paymentString`
```json
{"jsonrpc": "2.0", "method": "generateQrCode", "params": {"address": "nano_xxx", "amount": "0.1"}, "id": 1}
```

### convertBalance (Helper)
**Purpose:** Convert between NANO and raw units
**Parameters:** `amount`, `from` ("nano"/"raw"), `to` ("nano"/"raw")
**Returns:** `converted`, `formula`
```json
{"jsonrpc": "2.0", "method": "convertBalance", "params": {"amount": "0.1", "from": "nano", "to": "raw"}, "id": 1}
```

### getAccountStatus (Helper)
**Purpose:** Comprehensive account readiness check
**Parameters:** `address`
**Returns:** `initialized`, `balance`, `pending`, `capabilities`, `needsAction`, `recommendations`
```json
{"jsonrpc": "2.0", "method": "getAccountStatus", "params": {"address": "nano_xxx"}, "id": 1}
```

---

## 🎓 Best Practices for AI Agents

### ✅ DO:
1. **Always check account status first** using `getAccountStatus`
2. **Convert amounts** using `convertBalance` before transactions
3. **Parse errorCode** for programmatic error handling
4. **Follow nextSteps** array in error responses
5. **Receive pending blocks** before sending transactions

### ❌ DON'T:
1. Skip account status checks
2. Use NANO values directly in `amountRaw` (must be raw units)
3. Ignore error `nextSteps` - they guide recovery
4. Assume account is ready - always verify
5. Parse error message strings (use `errorCode` instead)

---

## 🔒 Security Notes

1. **Private Keys**: Never log or expose private keys
2. **Test vs Production**: Use test wallets for development
3. **RPC Node**: Default public node provided (rate limited)
4. **Validation**: All inputs validated by server

---

## 📖 Additional Documentation

Located in `NANO_MCP_SERVER/`:
- **AUTONOMOUS_AGENT_INTEGRATION_GUIDE.md** - Complete integration guide
- **TEST_WALLET_INTEGRATION.md** - Test wallet documentation
- **AUTONOMOUS_AGENT_ERROR_ENHANCEMENT.md** - Error handling details
- **examples/test-wallet-usage.json** - Request examples

---

## 🎉 Why This Server is AI Agent-Friendly

✅ **Self-documenting** - Every error explains itself
✅ **Helper functions** - Convert, status check built-in
✅ **Structured responses** - Easy to parse JSON
✅ **Machine-readable codes** - Error codes for programmatic handling
✅ **Actionable guidance** - Every error includes nextSteps
✅ **No external docs needed** - All info in responses
✅ **Fast integration** - 5-10 minutes to first transaction

---

## 🚀 Integration Speed

| Task | Time Required |
|------|---------------|
| Install and run | 2 minutes |
| First transaction | 5-10 minutes |
| Complete integration | < 30 minutes |

**vs Traditional NANO integration: 1-2 hours minimum**

---

## ⚡ Quick Test (Copy-Paste)

```bash
# 1. Start server
cd NANO_MCP_SERVER && npm start

# 2. In another terminal, test:
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'

# 3. You should see list of available methods
```

---

## 📞 Support

**For AI Agents:**
- All errors include remediation steps
- Use `getAccountStatus` to diagnose issues
- Check `errorCode` for specific problems
- Follow `nextSteps` in error responses

**For Developers:**
- GitHub Issues: [Create issue](https://github.com/dhyabi2/NANO_MCP_SERVER/issues)
- Documentation: See files in `NANO_MCP_SERVER/docs/`

---

## 🎊 Ready to Start!

You have everything you need. The server guides you through every step with self-documenting errors.

**First command to run:**
```bash
cd NANO_MCP_SERVER && npm start
```

**Server will be ready on:** `http://localhost:8080`

**Start with:** `{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}`

**Good luck with your NANO integration!** 🚀
