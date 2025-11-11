# NANO MCP Server - AI Agent Integration Guide

> **For AI Agents**: This server is designed specifically for autonomous agents. All errors are self-documenting with step-by-step guidance. No external documentation needed.

---

## 🌐 Production Server URL

**USE THIS URL:** `https://nano-mcp.replit.app`

**All requests go to:** `https://nano-mcp.replit.app` (POST requests with JSON-RPC 2.0 format)

**Quick Example:**
```bash
curl -X POST https://nano-mcp.replit.app \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

---

## 🤖 Quick Start for AI Agents

### Production Server (RECOMMENDED)
**Server URL:** `https://nano-mcp.replit.app`

**No installation needed!** The server is already running. Just start making requests.

### Step 1: Test Connection
```json
POST https://nano-mcp.replit.app
{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
}
```

### Step 2: You're Ready!
The server responds with all available methods. Start using them immediately.

---

### Local Development (Optional)
If you need to run locally for development:
```bash
cd NANO_MCP_SERVER
npm install
npm start
```
Local server runs on: `http://localhost:8080`

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

## 📋 Available MCP Functions (16 Total)

### Initialization (1)
1. `initialize` - Get server capabilities and all available functions

### Core Functions (8)
2. `generateWallet` - Create new NANO wallet
3. `getBalance` - Check account balance
4. `getAccountInfo` - Get detailed account data
5. `getPendingBlocks` - List pending transactions
6. `initializeAccount` - Open/activate new account
7. `sendTransaction` - Send NANO (with enhanced errors)
8. `receiveAllPending` - Receive all pending blocks
9. `generateQrCode` - Create payment QR code with base64 PNG

### Helper Functions (2) - For Autonomous Agents
10. **`convertBalance`** - Convert NANO ↔ raw units
11. **`getAccountStatus`** - One call shows: balance, pending, capabilities, what actions needed

### Test Wallet Functions (5) - For Development
12. `setupTestWallets` - Generate two test wallets (requires human funding)
13. `getTestWallets` - Retrieve test wallet info
14. `updateTestWalletBalance` - Update wallet balance tracking
15. `checkTestWalletsFunding` - Check if wallets are ready
16. `resetTestWallets` - Delete and start fresh

---

## 🚀 Complete Workflow for AI Agents

### Workflow: Send NANO Transaction

```javascript
// Step 1: Check account status first (ALWAYS DO THIS)
POST https://nano-mcp.replit.app
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

**Step 1: Generate Test Wallets**
```json
POST https://nano-mcp.replit.app
{
    "jsonrpc": "2.0",
    "method": "setupTestWallets",
    "params": {},
    "id": 1
}
```

**Response (Save These Addresses!):**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "wallet1": {
            "address": "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn",
            "privateKey": "6b84f1b17dd0a6176df2b500b40ce17c0db5bd8042ca8ac04173dd74bac303b8",
            "publicKey": "bc33249aa963b650b410c68123366ccdb6dcb9bb83f713fc11ade241578c92b8",
            "seed": "cbce4f1ec09296e245f4125b8f89930cc490599f30697491bc03e4915041c146",
            "balance": "0",
            "funded": false
        },
        "wallet2": {
            "address": "nano_39isqp67xsse8cj5igtonuiwicqy8p6txa57mbjd8bcyip7ggrai4bby1x1w",
            "privateKey": "9279a138a0000ac09477be901210b58b80e503835744f08c70690d94d57e70b9",
            "publicKey": "9e19bd885ee72c32a2383b55a6e1c82afe3589aea0659a62b3255e858ae76110",
            "seed": "bf69ae134c00c0e24aabb97ac4a0a7e1933fdd28672a1b0caf9b1c7ea193d917",
            "balance": "0",
            "funded": false
        },
        "created": "2025-11-11T15:25:23.161Z",
        "status": "awaiting_funding",
        "fundingInstructions": [
            "Send test NANO to Wallet 1: nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn",
            "Send test NANO to Wallet 2: nano_39isqp67xsse8cj5igtonuiwicqy8p6txa57mbjd8bcyip7ggrai4bby1x1w",
            "After funding, use checkFundingStatus to verify both wallets are funded",
            "Recommended test amount: 0.1 NANO or more per wallet"
        ]
    },
    "id": 1
}
```

**⚠️ IMPORTANT - ACTION REQUIRED:**
**HUMAN MUST FUND THESE WALLETS!**
1. **Copy Wallet 1 Address:** `nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn`
2. **Copy Wallet 2 Address:** `nano_39isqp67xsse8cj5igtonuiwicqy8p6txa57mbjd8bcyip7ggrai4bby1x1w`
3. **Send test NANO to BOTH addresses** (0.1 NANO recommended per wallet)
4. **Use a NANO faucet or your own wallet** to send test funds
5. **Wait for confirmation** (usually < 5 seconds)

**Step 2: Check Funding Status**
```json
{
    "jsonrpc": "2.0",
    "method": "checkTestWalletsFunding",
    "params": {},
    "id": 2
}
```

**Step 3: When Both Funded, Start Testing!**
Response will show `"bothFunded": true` when ready.

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

### initialize
**Purpose:** Initialize the MCP server and get list of all available capabilities/functions
**Parameters:** None
**Returns:** Server information and list of all available MCP tools with their descriptions
```json
{"jsonrpc": "2.0", "method": "initialize", "params": {}, "id": 1}
```

**Response includes:**
- `protocolVersion` - MCP protocol version
- `serverInfo` - Server name and version
- `capabilities` - Server capabilities
- `tools` - Complete list of all available MCP functions with descriptions and parameter schemas

**Use Case:** First call to discover what the server can do and what functions are available

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
**Purpose:** Generate payment QR code for receiving NANO
**Parameters:** 
- `address` (string, required) - NANO address to receive payment
- `amount` (string, optional) - Amount in NANO (decimal format, e.g., "0.1")

**Returns:** 
- `qrCode` (string) - Base64 encoded PNG image
- `paymentString` (string) - NANO URI for payment (nano:address?amount=...)
- `address` (string) - The NANO address
- `amount` (string) - The amount in NANO (if provided)

**Example Request:**
```json
{
    "jsonrpc": "2.0",
    "method": "generateQrCode",
    "params": {
        "address": "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn",
        "amount": "0.1"
    },
    "id": 1
}
```

**Example Response:**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...[long base64 string]",
        "paymentString": "nano:nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn?amount=100000000000000000000000000000",
        "address": "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn",
        "amount": "0.1"
    },
    "id": 1
}
```

**Use Cases:**
- Display QR code in web/mobile apps for payment collection
- Generate payment links for invoicing
- Create shareable payment requests
- The `qrCode` can be directly embedded in HTML: `<img src="data:image/png;base64,..." />`
- The `paymentString` can be used as a clickable link or deep link for NANO wallets

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

### setupTestWallets (Test Wallet)
**Purpose:** Generate two test wallets with all credentials
**Parameters:** None
**Returns:** `wallet1`, `wallet2` (with address, privateKey, publicKey, seed), `fundingInstructions`
**⚠️ Action Required:** Human must fund both wallet addresses with test NANO
```json
{"jsonrpc": "2.0", "method": "setupTestWallets", "params": {}, "id": 1}
```

**Response includes:**
- Two complete wallet credentials (address, private key, public key, seed)
- Funding instructions with exact addresses to fund
- Status indicating "awaiting_funding"
- Recommended test amount (0.1 NANO per wallet)

### getTestWallets (Test Wallet)
**Purpose:** Retrieve current test wallet information
**Parameters:** None
**Returns:** `wallet1`, `wallet2` (with addresses, balances, funding status)
```json
{"jsonrpc": "2.0", "method": "getTestWallets", "params": {}, "id": 1}
```

**Use Case:** Get wallet credentials after generating them, or check current state

### updateTestWalletBalance (Test Wallet)
**Purpose:** Update tracked balance for a test wallet
**Parameters:** `walletName` ("wallet1" or "wallet2"), `balance` (raw), `funded` (boolean)
**Returns:** Updated wallet info
```json
{"jsonrpc": "2.0", "method": "updateTestWalletBalance", "params": {"walletName": "wallet1", "balance": "100000000000000000000000000000", "funded": true}, "id": 1}
```

**Use Case:** Manually track balance changes or mark wallet as funded

### checkTestWalletsFunding (Test Wallet)
**Purpose:** Check if both test wallets have been funded (have balance > 0)
**Parameters:** None
**Returns:** `wallet1` (balance, funded), `wallet2` (balance, funded), `bothFunded`, `status`
```json
{"jsonrpc": "2.0", "method": "checkTestWalletsFunding", "params": {}, "id": 1}
```

**Use Case:** Verify wallets are ready for testing after human funding

### resetTestWallets (Test Wallet)
**Purpose:** Delete test wallets and start fresh
**Parameters:** None
**Returns:** Confirmation message
```json
{"jsonrpc": "2.0", "method": "resetTestWallets", "params": {}, "id": 1}
```

**Use Case:** Clean up and generate new test wallets

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

**Production Server (No Setup Required):**
```bash
# Test the production server immediately:
curl -X POST https://nano-mcp.replit.app \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'

# You should see list of all 16 available methods
```

**Local Development (Optional):**
```bash
# 1. Start local server
cd NANO_MCP_SERVER && npm start

# 2. In another terminal, test:
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
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
