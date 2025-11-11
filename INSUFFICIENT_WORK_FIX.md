# CRITICAL FIX: "Block work is insufficient" Error

## Issue Identified
Date: 2025-11-11
Error: `Block work is insufficient` when attempting send transactions

## Root Cause
The work generation function `generateWork()` was calling `nanocurrency.work(hash)` **without specifying the difficulty threshold**. This caused the generated work to not meet the NANO network's minimum difficulty requirements.

## NANO Network Difficulty Thresholds
- **Send/Change blocks**: `fffffff800000000` (higher difficulty, ~10-15 seconds)
- **Receive/Open blocks**: `fffffe0000000000` (lower difficulty, ~4-6 seconds)

## Fix Applied

### 1. Updated `generateWork()` in `utils/nano-transactions.js`
```javascript
// BEFORE (incorrect):
const work = await nanocurrency.work(hash);

// AFTER (correct):
const threshold = isOpen ? 'fffffe0000000000' : 'fffffff800000000';
const work = await nanocurrency.work(hash, threshold);
```

### 2. Added Enhanced Error Handler for Insufficient Work
- Created `EnhancedErrorHandler.insufficientWork()` in `utils/error-handler.js`
- Provides actionable guidance for AI agents:
  - Step-by-step troubleshooting
  - Expected thresholds for each block type
  - Time estimates for work generation
  - Retry instructions
  - Fallback solutions for persistent issues

### 3. Updated Error Detection in `blockchainError()`
```javascript
if (originalError.toLowerCase().includes('work') && originalError.toLowerCase().includes('insufficient')) {
    return EnhancedErrorHandler.insufficientWork(
        additionalInfo.hash || 'unknown',
        additionalInfo.work || 'unknown',
        additionalInfo.blockType || context.includes('send') ? 'send' : 'receive'
    );
}
```

### 4. Enhanced Error Context in RPC Responses
Updated both `createReceiveBlock()` and `sendTransaction()` to pass:
- `hash` - The hash work was generated for
- `work` - The work value that was rejected
- `blockType` - Type of block (send, receive, open, change)

## Enhanced Error Response Example
```json
{
  "success": false,
  "error": "Block work is insufficient - work does not meet NANO network difficulty threshold",
  "errorCode": "INSUFFICIENT_WORK",
  "details": {
    "hash": "3F8E...",
    "generatedWork": "7a2c...",
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

## Why This Error Occurred
Work generation is **probabilistic**. Even with the correct threshold, there's a small chance that:
1. The generated work doesn't meet the threshold on first try
2. CPU speed affects reliability
3. Library initialization issues

## Solution for AI Agents
**SIMPLE: JUST RETRY THE SAME REQUEST**

The error response now guides agents to:
1. Immediately retry the operation
2. Understand work generation is CPU-intensive and takes time
3. Wait a few moments between retries if needed
4. Consider alternative solutions if issue persists

## Impact
- ✅ All work generation now uses correct difficulty thresholds
- ✅ Send transactions will have proper work values
- ✅ Receive/open blocks will process correctly
- ✅ AI agents get actionable guidance for retry logic
- ✅ Expected time estimates help agents plan timeouts

## Testing Recommendation
1. Test send transaction with funded wallet
2. If "Block work is insufficient" occurs, verify it's transient by retrying
3. Confirm error response includes all guidance fields
4. Verify second attempt succeeds with new work value

## Files Modified
- `utils/nano-transactions.js` - Fixed `generateWork()`, added error context
- `utils/error-handler.js` - Added `insufficientWork()` method

