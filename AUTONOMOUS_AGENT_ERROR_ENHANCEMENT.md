# Autonomous Agent Error Enhancement Plan

## Goal
Make MCP functions self-documenting with descriptive errors that guide autonomous agents without needing to read external documentation.

## Current Issues Found During Testing

### Issue #1: Insufficient Balance Error
**Current Error:**
```json
{
    "success": false,
    "error": "Block is invalid"
}
```

**Problem:** Not descriptive. Agent doesn't know:
- What was invalid
- Current balance vs attempted send
- How to fix it

**Enhanced Error Should Include:**
```json
{
    "success": false,
    "error": "Insufficient balance",
    "errorCode": "INSUFFICIENT_BALANCE",
    "details": {
        "currentBalance": "90000000000000000000000000",
        "currentBalanceNano": "0.09",
        "attemptedAmount": "1000000000000000000000000000",
        "attemptedAmountNano": "1.0",
        "shortfall": "910000000000000000000000000",
        "shortfallNano": "0.91"
    },
    "nextSteps": [
        "Check current balance: Use getBalance or getAccountInfo",
        "Option 1: Reduce send amount to maximum 0.09 NANO or less",
        "Option 2: Fund account with additional 0.91 NANO minimum",
        "After funding, use receiveAllPending to process pending blocks"
    ],
    "relatedFunctions": ["getBalance", "getAccountInfo", "receiveAllPending"]
}
```

### Issue #2: Account Not Initialized
**Scenario:** Trying to send from unopened account

**Current:** Generic RPC error

**Enhanced Error Should Include:**
```json
{
    "success": false,
    "error": "Account not initialized",
    "errorCode": "ACCOUNT_NOT_INITIALIZED",
    "details": {
        "address": "nano_xxx",
        "hasPendingBlocks": true,
        "pendingCount": 1,
        "pendingAmount": "100000000000000000000000000"
    },
    "nextSteps": [
        "Step 1: Initialize account using initializeAccount function",
        "Step 2: Or use receiveAllPending to open account and receive funds",
        "Step 3: After initialization, retry your send transaction"
    ],
    "exampleRequest": {
        "jsonrpc": "2.0",
        "method": "initializeAccount",
        "params": {
            "address": "nano_xxx",
            "privateKey": "your_private_key"
        }
    }
}
```

### Issue #3: Missing Pending Blocks Check
**Scenario:** Sending without receiving pending blocks first

**Enhanced Error:**
```json
{
    "success": false,
    "error": "Pending blocks detected",
    "errorCode": "PENDING_BLOCKS_NOT_RECEIVED",
    "details": {
        "address": "nano_xxx",
        "pendingCount": 2,
        "totalPendingAmount": "500000000000000000000000000",
        "totalPendingAmountNano": "0.5"
    },
    "recommendation": "Receive pending blocks first to ensure accurate balance",
    "nextSteps": [
        "Use receiveAllPending to process all pending transactions",
        "Wait for block confirmation (usually < 1 second)",
        "Retry your send transaction"
    ]
}
```

### Issue #4: Invalid Amount Format
**Scenario:** Using wrong unit or invalid number

**Enhanced Error:**
```json
{
    "success": false,
    "error": "Invalid amount format",
    "errorCode": "INVALID_AMOUNT_FORMAT",
    "details": {
        "providedAmount": "0.1",
        "expectedFormat": "raw units (string of digits)",
        "reason": "Amount must be in raw units, not NANO"
    },
    "conversionHelper": {
        "toConvert_0.1_NANO_to_raw": "100000000000000000000000000",
        "formula": "raw = NANO × 10^30",
        "examples": {
            "0.001_NANO": "1000000000000000000000000000",
            "0.01_NANO": "10000000000000000000000000",
            "0.1_NANO": "100000000000000000000000000",
            "1_NANO": "1000000000000000000000000000000"
        }
    },
    "nextSteps": [
        "Convert your NANO amount to raw units",
        "Use the conversion formula: raw = NANO × 10^30",
        "Provide amount as string in raw units"
    ]
}
```

## New Helper Functions Needed

### 1. Workflow Validator
Checks all prerequisites before executing operations

```javascript
validateSendTransaction(fromAddress, toAddress, amountRaw, privateKey):
  1. Check if fromAddress is initialized
  2. Check for pending blocks
  3. Validate addresses
  4. Check sufficient balance
  5. Validate amount format
  6. Return comprehensive status with actionable errors
```

### 2. Balance Converter Helper
```javascript
convertBalance(amount, from, to):
  - from/to: 'nano', 'raw'
  - Returns converted value
  - Includes validation
```

### 3. Account Status Helper
```javascript
getAccountStatus(address):
  Returns:
  - initialized: boolean
  - balance: {raw, nano}
  - pending: {count, amount in raw/nano}
  - needsAction: [array of required actions]
  - canSend: boolean
  - canReceive: boolean
```

### 4. Transaction Prerequisites Checker
```javascript
checkTransactionPrerequisites(fromAddress, toAddress, amount):
  Returns:
  - ready: boolean
  - blockers: [array of blocking issues]
  - warnings: [array of warnings]
  - suggestedActions: [step-by-step remediation]
```

## Implementation Priority

### Phase 1: Critical Error Enhancement (Immediate)
- [ ] Insufficient balance error with detailed breakdown
- [ ] Account not initialized error with initialization steps
- [ ] Invalid amount format with conversion helper
- [ ] Missing parameters with examples

### Phase 2: Helper Functions (High Priority)
- [ ] Balance converter (raw ↔ nano)
- [ ] Account status checker
- [ ] Transaction prerequisites validator
- [ ] Workflow validator

### Phase 3: Proactive Guidance (Medium Priority)
- [ ] Auto-detect common issues before execution
- [ ] Suggest optimal transaction flow
- [ ] Warn about potential problems
- [ ] Provide transaction estimation

### Phase 4: Autonomous Agent Optimization (Future)
- [ ] Machine-readable error codes
- [ ] Automatic retry strategies
- [ ] Transaction queue management
- [ ] Batch operation support

## Error Response Standard Format

All errors should follow this structure:

```json
{
    "success": false,
    "error": "Human-readable error message",
    "errorCode": "MACHINE_READABLE_CODE",
    "details": {
        // Specific context about what went wrong
        // Current state, expected state, attempted action
    },
    "nextSteps": [
        "Step 1: What to do first",
        "Step 2: Alternative approaches",
        "Step 3: How to verify fix"
    ],
    "relatedFunctions": ["func1", "func2"],
    "exampleRequest": {
        // Valid request example for correction
    },
    "documentation": "URL or inline help"
}
```

## Testing Scenarios

### Test Suite 1: Balance Errors
- [ ] Send more than balance
- [ ] Send with exactly balance (no remainder for dust)
- [ ] Send negative amount
- [ ] Send zero amount

### Test Suite 2: Account State Errors
- [ ] Send from uninitialized account
- [ ] Receive to uninitialized account (should work)
- [ ] Send with pending blocks
- [ ] Initialize already initialized account

### Test Suite 3: Format Errors
- [ ] Invalid address format
- [ ] Wrong amount units (NANO instead of raw)
- [ ] Missing required parameters
- [ ] Invalid private key format

### Test Suite 4: Network Errors
- [ ] RPC node unreachable
- [ ] Rate limit exceeded
- [ ] Block confirmation timeout

## Success Metrics

1. **Autonomous Agent can complete full workflow without documentation**
   - Generate wallets
   - Fund accounts
   - Send/receive transactions
   - Handle errors autonomously

2. **Error messages are self-explanatory**
   - 100% of errors include "next steps"
   - All errors include conversion helpers where relevant
   - Every error provides example request

3. **Reduced integration time**
   - From hours to minutes
   - No need to read external RPC docs
   - Clear error → action mapping

## Implementation Notes

### Error Code Naming Convention
- Use SCREAMING_SNAKE_CASE
- Prefix with category: BALANCE_, ACCOUNT_, NETWORK_, VALIDATION_
- Be specific: INSUFFICIENT_BALANCE not INVALID_BALANCE

### Next Steps Guidelines
- Always provide 2-3 actionable steps
- Include exact function names to use
- Provide parameter examples
- Mention expected outcomes

### Example Requests
- Must be valid JSON-RPC 2.0
- Include real-looking but safe values
- Show all required parameters
- Add helpful comments where appropriate

## Files to Modify

1. `utils/nano-transactions.js` - Add error enhancement wrapper
2. `src/server.js` - Add helper functions and validators
3. `utils/error-handler.js` - NEW: Centralized error formatting
4. `utils/balance-converter.js` - NEW: Unit conversion utilities
5. `utils/workflow-validator.js` - NEW: Transaction prerequisite checking

## Next Actions

1. Create error-handler.js with standard error formatting
2. Wrap all nano-transactions methods with enhanced error handling
3. Add helper functions to server.js
4. Test each error scenario
5. Document all error codes
6. Create autonomous agent integration guide

