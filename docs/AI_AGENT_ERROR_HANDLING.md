# AI Agent Error Handling - Complete Guide

## 🤖 Overview

The NANO MCP Server features **comprehensive, AI-agent-friendly error handling** across all 16 MCP functions. Every error provides:

- **Specific error codes** for programmatic handling
- **Detailed context** about what went wrong
- **Step-by-step recovery instructions** (nextSteps array)
- **Example requests** showing correct usage
- **Related functions** to help solve the problem

---

## 📋 Error Response Structure

All errors follow a consistent structure designed for autonomous agents:

```json
{
    "success": false,
    "error": "Human-readable error message",
    "errorCode": "MACHINE_READABLE_ERROR_CODE",
    "details": {
        "parameter": "nameOfProblematicParameter",
        "providedValue": "whatWasProvided",
        "expectedFormat": "whatIsExpected",
        "issue": "specificProblemDescription"
    },
    "nextSteps": [
        "Step 1: First action to take",
        "Step 2: Second action to take",
        "Step 3: Third action to take"
    ],
    "relatedFunctions": ["functionName1", "functionName2"],
    "exampleRequest": {
        "jsonrpc": "2.0",
        "method": "correctMethod",
        "params": { "correct": "parameters" },
        "id": 1
    }
}
```

---

## 🔍 Validation Error Types

### 1. Address Validation Errors

**Error Codes:**
- `INVALID_ADDRESS_FORMAT` - Address is missing or wrong type
- `INVALID_ADDRESS_PREFIX` - Address doesn't start with 'nano_' or 'xrb_'
- `INVALID_ADDRESS_LENGTH` - Address is too short or too long
- `INVALID_ADDRESS_CHARACTERS` - Address contains invalid characters

**Example Error:**
```json
{
    "success": false,
    "error": "Invalid address format - must start with 'nano_' or 'xrb_'",
    "errorCode": "INVALID_ADDRESS_PREFIX",
    "details": {
        "parameter": "address",
        "providedValue": "nanouser123",
        "issue": "Address must start with 'nano_' or 'xrb_' prefix",
        "detectedPrefix": "nanou"
    },
    "nextSteps": [
        "Step 1: Ensure address starts with 'nano_' (modern format) or 'xrb_' (legacy format)",
        "Step 2: Check for typos in the address prefix",
        "Step 3: Example valid address: nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn"
    ],
    "relatedFunctions": ["generateWallet"]
}
```

**What AI Agent Should Do:**
1. Parse `errorCode` for programmatic decision
2. Extract `details.providedValue` to see what was wrong
3. Follow `nextSteps` array sequentially
4. Use `exampleRequest` to retry with correct format
5. Consider calling `relatedFunctions` if needed

---

### 2. Private Key Validation Errors

**Error Codes:**
- `INVALID_PRIVATE_KEY_FORMAT` - Private key is missing or wrong type
- `INVALID_PRIVATE_KEY_LENGTH` - Private key is not exactly 64 characters
- `INVALID_PRIVATE_KEY_CHARACTERS` - Private key contains non-hexadecimal characters

**Example Error:**
```json
{
    "success": false,
    "error": "Invalid privateKey length",
    "errorCode": "INVALID_PRIVATE_KEY_LENGTH",
    "details": {
        "parameter": "privateKey",
        "providedLength": 50,
        "expectedLength": 64,
        "issue": "Private key too short"
    },
    "nextSteps": [
        "Step 1: Private keys must be exactly 64 characters",
        "Step 2: Verify you copied the complete private key",
        "Step 3: Check for extra spaces or missing characters",
        "Step 4: Private keys are hexadecimal (0-9, a-f)"
    ],
    "securityNote": "⚠️ NEVER share your private key. It grants full control of the account.",
    "relatedFunctions": ["generateWallet"]
}
```

**Security Features:**
- Private keys are masked in error responses (shown as "[PROVIDED]")
- Security warnings included in all private key errors
- AI agents are reminded to NEVER log or expose private keys

---

### 3. Amount Validation Errors

**Error Codes:**
- `INVALID_AMOUNT_FORMAT` - Amount is missing or wrong type
- `AMOUNT_WRONG_UNIT` - Amount appears to be in NANO instead of raw
- `INVALID_AMOUNT_CHARACTERS` - Amount contains invalid characters
- `INVALID_AMOUNT_ZERO_OR_NEGATIVE` - Amount is zero or negative
- `INVALID_AMOUNT_OVERFLOW` - Amount is too large to process

**Example Error (Wrong Unit Detection):**
```json
{
    "success": false,
    "error": "amountRaw appears to be in NANO format, not raw",
    "errorCode": "AMOUNT_WRONG_UNIT",
    "details": {
        "parameter": "amountRaw",
        "providedValue": "0.1",
        "detectedFormat": "NANO (decimal)",
        "expectedFormat": "raw (integer string)",
        "issue": "Amounts must be in raw units, not NANO"
    },
    "nextSteps": [
        "Step 1: Convert NANO amount to raw units",
        "Step 2: Use convertBalance function to convert",
        "Step 3: If you meant 0.1 NANO, use the corrected value below",
        "Step 4: Retry your request with the raw amount"
    ],
    "suggestedCorrection": {
        "originalValue": "0.1",
        "originalUnit": "NANO",
        "correctedValue": "100000000000000000000000000000",
        "correctedUnit": "raw"
    },
    "relatedFunctions": ["convertBalance"],
    "exampleConversion": {
        "jsonrpc": "2.0",
        "method": "convertBalance",
        "params": {
            "amount": "0.1",
            "from": "nano",
            "to": "raw"
        },
        "id": 1
    }
}
```

**Smart Features:**
- **Automatic unit detection** - Detects if user provided NANO instead of raw
- **Suggested corrections** - Provides the correctly converted value
- **Example conversion request** - Shows how to use convertBalance

**What AI Agent Should Do:**
1. Check for `suggestedCorrection` field
2. If present, use `correctedValue` directly
3. Or call `convertBalance` to convert manually
4. Retry the original request with corrected amount

---

### 4. Missing Parameter Errors

**Error Code:**
- `MISSING_PARAMETER` - Required parameter was not provided

**Example Error:**
```json
{
    "success": false,
    "error": "Missing required parameter: fromAddress",
    "errorCode": "MISSING_PARAMETER",
    "details": {
        "parameter": "fromAddress",
        "method": "sendTransaction",
        "issue": "The parameter 'fromAddress' is required but was not provided"
    },
    "nextSteps": [
        "Step 1: Add the 'fromAddress' parameter to your request",
        "Step 2: Ensure the parameter is spelled correctly",
        "Step 3: Check the parameter type and format requirements",
        "Step 4: Refer to the example request below"
    },
    "exampleRequest": {
        "jsonrpc": "2.0",
        "method": "sendTransaction",
        "params": {
            "fromAddress": "nano_3sender_address_here",
            "toAddress": "nano_3receiver_address_here",
            "amountRaw": "100000000000000000000000000000",
            "privateKey": "your_private_key_here"
        },
        "id": 1
    }
}
```

**What AI Agent Should Do:**
1. Extract `details.parameter` to know what's missing
2. Use `exampleRequest` as a template
3. Add the missing parameter with correct format
4. Retry the request

---

### 5. Method Not Found Errors

**Error Code:**
- `METHOD_NOT_FOUND` - The requested method does not exist

**Example Error:**
```json
{
    "success": false,
    "error": "Method not found: sendNano",
    "errorCode": "METHOD_NOT_FOUND",
    "details": {
        "requestedMethod": "sendNano",
        "issue": "The requested method does not exist"
    },
    "nextSteps": [
        "Step 1: Check the method name for typos",
        "Step 2: Ensure you're using a valid MCP method name",
        "Step 3: Call 'initialize' to get list of all available methods",
        "Step 4: Refer to the available methods list below"
    ],
    "availableMethods": [
        "initialize", "generateWallet", "getBalance", "getAccountInfo",
        "getPendingBlocks", "initializeAccount", "sendTransaction",
        "receiveAllPending", "generateQrCode", "convertBalance",
        "getAccountStatus", "setupTestWallets", "getTestWallets",
        "updateTestWalletBalance", "checkTestWalletsFunding", "resetTestWallets"
    ],
    "exampleRequest": {
        "jsonrpc": "2.0",
        "method": "initialize",
        "params": {},
        "id": 1
    }
}
```

**What AI Agent Should Do:**
1. Compare `details.requestedMethod` with `availableMethods`
2. Find the closest match (likely a typo)
3. Use the correct method name
4. Call `initialize` if unsure about available methods

---

## 🚫 Blockchain Operation Errors

### 1. Insufficient Balance

**Error Code:**
- `INSUFFICIENT_BALANCE` - Account doesn't have enough balance

**Example Error:**
```json
{
    "success": false,
    "error": "Insufficient balance",
    "errorCode": "INSUFFICIENT_BALANCE",
    "details": {
        "address": "nano_3sender...",
        "currentBalance": "50000000000000000000000000000",
        "currentBalanceNano": "0.05",
        "attemptedAmount": "100000000000000000000000000000",
        "attemptedAmountNano": "0.1",
        "shortfall": "50000000000000000000000000000",
        "shortfallNano": "0.05"
    },
    "nextSteps": [
        "Step 1: Check current balance using getBalance or getAccountInfo",
        "Step 2: Either reduce send amount to maximum 0.05 NANO or less",
        "Step 3: Or fund account with additional 0.05 NANO minimum",
        "Step 4: After funding, use receiveAllPending to process pending blocks",
        "Step 5: Retry your send transaction"
    ],
    "relatedFunctions": ["getBalance", "getAccountInfo", "receiveAllPending"],
    "exampleRequest": {
        "jsonrpc": "2.0",
        "method": "getBalance",
        "params": { "address": "nano_3sender..." },
        "id": 1
    }
}
```

**Smart Features:**
- Shows balance in **both raw and NANO** units
- Calculates exact **shortfall amount**
- Provides **two solutions**: reduce amount or fund account

**What AI Agent Should Do:**
1. Check `details.shortfall` to know how much is missing
2. Decide: reduce amount or fund account
3. If reducing: use `currentBalance` as maximum
4. If funding: add at least `shortfall` amount
5. After funding, call `receiveAllPending`
6. Retry the transaction

---

### 2. Insufficient Work (Proof-of-Work)

**Error Code:**
- `INSUFFICIENT_WORK` - Generated work doesn't meet NANO network difficulty threshold

**Example Error:**
```json
{
    "success": false,
    "error": "Block work is insufficient - work does not meet NANO network difficulty threshold",
    "errorCode": "INSUFFICIENT_WORK",
    "details": {
        "hash": "3F8E9A2B1C4D5E6F...",
        "generatedWork": "7a2c5b3d...",
        "blockType": "send",
        "expectedThreshold": "fffffff800000000",
        "reason": "The Proof-of-Work (PoW) computation did not meet the network's difficulty requirement"
    },
    "nextSteps": [
        "Step 1: This is likely a transient issue - SIMPLY RETRY the same operation",
        "Step 2: Work generation now uses correct NANO network difficulty thresholds:",
        "   • Send/Change blocks: fffffff800000000 (takes 10-15 seconds)",
        "   • Receive/Open blocks: fffffe0000000000 (takes 4-6 seconds)",
        "Step 3: If retrying fails repeatedly, possible causes:",
        "   • CPU too slow for reliable work generation",
        "   • nanocurrency library not properly initialized",
        "Step 4: Solutions if issue persists:",
        "   • Wait a few moments and retry (work generation is probabilistic)",
        "   • Use a more powerful machine",
        "   • Implement GPU-accelerated work generation",
        "   • Use an external work generation service"
    ],
    "relatedFunctions": ["sendTransaction", "receiveAllPending", "initializeAccount"],
    "technicalDetails": {
        "workGenerationMethod": "Local CPU (nanocurrency library)",
        "timeEstimate": "10-15 seconds",
        "cpuIntensive": true,
        "probabilistic": true
    },
    "exampleRetry": {
        "jsonrpc": "2.0",
        "method": "sendTransaction",
        "params": {},
        "id": 1,
        "note": "Simply retry the EXACT same request - work will be regenerated automatically"
    }
}
```

**Smart Features:**
- Shows **expected difficulty threshold** for block type
- Provides **time estimates** for work generation
- Explains that work generation is **probabilistic** (may fail occasionally)
- Indicates **auto-fix is available** (just retry)

**What AI Agent Should Do:**
1. **SIMPLY RETRY THE EXACT SAME REQUEST** - work will be regenerated
2. Wait a few moments (2-3 seconds) before retrying if needed
3. If 3+ retries fail, consider:
   - CPU may be too slow for reliable work generation
   - Implement exponential backoff (3s, 6s, 12s delays)
   - Consider alternative work generation methods
4. This error is **extremely rare** after the fix (work now uses correct thresholds)

**Critical Fix Applied (2025-11-11):**
- Work generation now uses **correct NANO network difficulty thresholds**
- Send/Change blocks: `fffffff800000000` (higher difficulty)
- Receive/Open blocks: `fffffe0000000000` (lower difficulty)
- This error should be **very rare** and **transient** (just retry once)

---

### 3. Account Not Initialized

**Error Codes:**
- `ACCOUNT_NOT_INITIALIZED` - Account not initialized, but has pending blocks
- `ACCOUNT_NOT_INITIALIZED_NO_PENDING` - Account not initialized and no pending blocks

**Example Error (With Pending Blocks):**
```json
{
    "success": false,
    "error": "Account not initialized (unopened)",
    "errorCode": "ACCOUNT_NOT_INITIALIZED",
    "details": {
        "address": "nano_3account...",
        "initialized": false,
        "hasPendingBlocks": true,
        "pendingCount": 2,
        "totalPendingAmount": "500000000000000000000000000000",
        "totalPendingAmountNano": "0.5"
    },
    "nextSteps": [
        "Step 1: You have pending blocks! Initialize account by receiving them",
        "Step 2: Use initializeAccount to open account and receive first block",
        "Step 3: Or use receiveAllPending to receive all pending blocks at once",
        "Step 4: After initialization, retry your send transaction"
    ],
    "relatedFunctions": ["initializeAccount", "receiveAllPending", "getPendingBlocks"],
    "exampleRequests": [
        {
            "description": "Option 1: Initialize account (opens account and receives first block)",
            "request": {
                "jsonrpc": "2.0",
                "method": "initializeAccount",
                "params": {
                    "address": "nano_3account...",
                    "privateKey": "your_private_key_here"
                },
                "id": 1
            }
        },
        {
            "description": "Option 2: Receive all pending blocks (opens account and receives all)",
            "request": {
                "jsonrpc": "2.0",
                "method": "receiveAllPending",
                "params": {
                    "address": "nano_3account...",
                    "privateKey": "your_private_key_here"
                },
                "id": 1
            }
        }
    ]
}
```

**Smart Features:**
- Detects if account has pending blocks
- Provides **two solutions** with example requests for each
- Shows total pending amount in raw and NANO

**What AI Agent Should Do:**
1. Check `details.hasPendingBlocks`
2. If true: call `initializeAccount` or `receiveAllPending`
3. If false: fund the account first, then initialize
4. After initialization, retry original operation

---

### 3. Invalid Block / Blockchain Errors

**Error Codes:**
- `BLOCKCHAIN_INVALID_BLOCK` - Blockchain rejected block as invalid
- `BLOCKCHAIN_INSUFFICIENT_BALANCE` - Blockchain rejected due to insufficient balance
- `BLOCKCHAIN_ERROR` - Generic blockchain operation error

**Example Error:**
```json
{
    "success": false,
    "error": "Blockchain rejected block as invalid",
    "errorCode": "BLOCKCHAIN_INVALID_BLOCK",
    "details": {
        "originalError": "Block is invalid",
        "context": "send transaction",
        "fromAddress": "nano_3sender...",
        "toAddress": "nano_3receiver..."
    },
    "possibleCauses": [
        "Insufficient balance for transaction",
        "Account frontier hash is incorrect (stale state)",
        "Invalid work/signature",
        "Attempting to send more than available balance"
    ],
    "nextSteps": [
        "Step 1: Verify account balance is sufficient",
        "Step 2: Check if account has pending blocks to receive first",
        "Step 3: Ensure you're not trying to send entire balance (leave some raw units)",
        "Step 4: Try refreshing account state with getAccountInfo"
    ],
    "relatedFunctions": ["getBalance", "getAccountInfo", "receiveAllPending"]
}
```

**What AI Agent Should Do:**
1. Review `possibleCauses` to diagnose issue
2. Follow `nextSteps` systematically
3. Call `relatedFunctions` to gather more info
4. If issue persists, report as unexpected error

---

## 📊 Conversion Errors

### convertBalance Function Errors

**Error Codes:**
- `INVALID_CONVERSION_UNITS` - Invalid 'from' or 'to' unit
- `SAME_CONVERSION_UNITS` - 'from' and 'to' are the same
- `CONVERSION_ERROR` - Conversion failed

**Example Error:**
```json
{
    "success": false,
    "error": "Invalid conversion units",
    "errorCode": "INVALID_CONVERSION_UNITS",
    "details": {
        "providedFrom": "btc",
        "providedTo": "raw",
        "allowedValues": ["nano", "raw"]
    },
    "nextSteps": [
        "Step 1: 'from' parameter must be either 'nano' or 'raw'",
        "Step 2: 'to' parameter must be either 'nano' or 'raw'",
        "Step 3: Supported conversions: nano→raw or raw→nano",
        "Step 4: Parameter values are case-insensitive"
    ],
    "exampleRequests": [
        {
            "description": "Convert NANO to raw",
            "request": {
                "jsonrpc": "2.0",
                "method": "convertBalance",
                "params": { "amount": "0.1", "from": "nano", "to": "raw" },
                "id": 1
            }
        },
        {
            "description": "Convert raw to NANO",
            "request": {
                "jsonrpc": "2.0",
                "method": "convertBalance",
                "params": { "amount": "100000000000000000000000000000", "from": "raw", "to": "nano" },
                "id": 1
            }
        }
    ]
}
```

---

## 🎯 AI Agent Best Practices

### 1. Always Check for `errorCode`
```javascript
if (response.success === false && response.errorCode) {
    // Handle error programmatically based on errorCode
    switch(response.errorCode) {
        case 'INSUFFICIENT_BALANCE':
            // Handle insufficient balance
            break;
        case 'ACCOUNT_NOT_INITIALIZED':
            // Handle uninitialized account
            break;
        case 'AMOUNT_WRONG_UNIT':
            // Use suggestedCorrection if available
            break;
        // ... handle other codes
    }
}
```

### 2. Use `suggestedCorrection` When Available
```javascript
if (response.errorCode === 'AMOUNT_WRONG_UNIT' && response.suggestedCorrection) {
    // Use the corrected value directly
    const correctedAmount = response.suggestedCorrection.correctedValue;
    // Retry with corrected value
}
```

### 3. Follow `nextSteps` Array Sequentially
```javascript
if (response.nextSteps) {
    for (let step of response.nextSteps) {
        console.log(step); // Log each step
        // Execute the action described in the step
    }
}
```

### 4. Call `relatedFunctions` for More Info
```javascript
if (response.relatedFunctions) {
    // These functions can help diagnose or fix the issue
    for (let func of response.relatedFunctions) {
        // Consider calling these functions
        console.log(`Helpful function: ${func}`);
    }
}
```

### 5. Use `exampleRequest` as Template
```javascript
if (response.exampleRequest) {
    // Use this as a template for the correct request format
    const correctedRequest = response.exampleRequest;
    // Modify with your actual values
    correctedRequest.params.address = myAddress;
    // Retry the request
}
```

---

## 📈 Error Handling Decision Tree

```
Error Received
    |
    ├─> Check success === false?
    |   └─> YES: It's an error
    |       |
    |       ├─> Extract errorCode
    |       |
    |       ├─> INSUFFICIENT_BALANCE?
    |       |   ├─> Check details.shortfall
    |       |   ├─> Decide: reduce amount OR fund account
    |       |   └─> Follow nextSteps
    |       |
    |       ├─> ACCOUNT_NOT_INITIALIZED?
    |       |   ├─> Check details.hasPendingBlocks
    |       |   ├─> If true: call initializeAccount or receiveAllPending
    |       |   ├─> If false: fund account first
    |       |   └─> Retry
    |       |
    |       ├─> AMOUNT_WRONG_UNIT?
    |       |   ├─> Check for suggestedCorrection
    |       |   ├─> Use correctedValue
    |       |   └─> Retry
    |       |
    |       ├─> INVALID_ADDRESS_* / INVALID_PRIVATE_KEY_* / INVALID_AMOUNT_*?
    |       |   ├─> Read details.issue
    |       |   ├─> Check exampleRequest for correct format
    |       |   ├─> Fix the parameter
    |       |   └─> Retry
    |       |
    |       ├─> MISSING_PARAMETER?
    |       |   ├─> Extract details.parameter
    |       |   ├─> Add missing parameter from exampleRequest
    |       |   └─> Retry
    |       |
    |       └─> METHOD_NOT_FOUND?
    |           ├─> Check availableMethods
    |           ├─> Find correct method name
    |           └─> Retry with correct method
    |
    └─> NO: Success response
        └─> Process result
```

---

## ✅ Validation Coverage

### All MCP Functions Have Comprehensive Validation:

1. **initialize** - No parameters (no validation needed)
2. **generateWallet** - No parameters (no validation needed)
3. **getBalance** - Address validation
4. **getAccountInfo** - Address validation
5. **getPendingBlocks** - Address validation
6. **initializeAccount** - Address + Private Key validation
7. **sendTransaction** - From Address + To Address + Amount + Private Key validation
8. **receiveAllPending** - Address + Private Key validation
9. **generateQrCode** - Address + NANO Amount validation
10. **convertBalance** - Amount + From Unit + To Unit validation
11. **getAccountStatus** - Address validation
12. **setupTestWallets** - No parameters (no validation needed)
13. **getTestWallets** - Optional parameters
14. **updateTestWalletBalance** - Wallet Identifier + Balance validation
15. **checkTestWalletsFunding** - No parameters (no validation needed)
16. **resetTestWallets** - No parameters (no validation needed)

**100% coverage across all functions that require parameters!**

---

## 🔒 Security Considerations

### Private Key Handling in Errors:
- Private keys are **NEVER shown in full** in error messages
- Shown as `"[PROVIDED]"` when present
- All private key errors include security warnings
- AI agents are reminded to NEVER log or expose private keys

### Recommended AI Agent Behavior:
- **NEVER log** actual private keys
- **NEVER store** private keys in permanent logs
- **ALWAYS use** secure memory for private keys
- **ALWAYS clear** private keys after use

---

## 📚 Summary

**For AI Agents:**
- Parse `errorCode` for programmatic handling
- Use `suggestedCorrection` when available
- Follow `nextSteps` sequentially
- Use `exampleRequest` as template
- Call `relatedFunctions` for more info
- Check `details` for specific context

**Result:**
- **Zero ambiguity** in error messages
- **No external documentation needed**
- **Autonomous recovery** from most errors
- **Fast integration** with minimal trial-and-error

**The NANO MCP Server is designed for autonomous agents to integrate quickly and handle errors intelligently without human intervention.**

