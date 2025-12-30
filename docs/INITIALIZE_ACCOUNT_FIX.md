# initializeAccount Method Fix

## Problem
The `initializeAccount` method was missing from the `NanoTransactions` class, causing the error:
```
"this.nanoTransactions.initializeAccount is not a function"
```

## Solution
Added the `initializeAccount` method to `utils/nano-transactions.js` (lines 315-387).

## What the Method Does

The `initializeAccount` method:

1. **Checks if account is already initialized**
   - If yes, returns account info (balance, representative, frontier)
   - If no, proceeds to step 2

2. **Looks for pending blocks**
   - If no pending blocks exist, returns a message asking to send NANO first
   - If pending blocks exist, proceeds to step 3

3. **Receives the first pending block**
   - This "opens" the account on the NANO network
   - Processes the receive block
   - Returns the new account information

## How to Use

### Request Format (JSON-RPC 2.0)

```json
{
  "jsonrpc": "2.0",
  "method": "initializeAccount",
  "params": {
    "address": "nano_your_address_here",
    "privateKey": "your_private_key_here"
  },
  "id": 1
}
```

### Response - Already Initialized

```json
{
  "jsonrpc": "2.0",
  "result": {
    "initialized": true,
    "alreadyInitialized": true,
    "message": "Account is already initialized",
    "representative": "nano_...",
    "balance": "1000000000000000000000000",
    "frontier": "ABCD..."
  },
  "id": 1
}
```

### Response - No Pending Blocks

```json
{
  "jsonrpc": "2.0",
  "result": {
    "initialized": false,
    "message": "No pending blocks to initialize the account. Send some NANO to this address first.",
    "address": "nano_..."
  },
  "id": 1
}
```

### Response - Successfully Initialized

```json
{
  "jsonrpc": "2.0",
  "result": {
    "initialized": true,
    "alreadyInitialized": false,
    "message": "Account successfully initialized",
    "blockHash": "ABC123...",
    "representative": "nano_...",
    "balance": "1000000000000000000000000",
    "frontier": "ABC123..."
  },
  "id": 1
}
```

## PowerShell Example

```powershell
# Initialize an account
$body = @{
    jsonrpc = "2.0"
    method = "initializeAccount"
    params = @{
        address = "nano_3h5fu37g8mcz8ndu8xgfx3dds6dks6qnp3k8rhjf8knuzec7zr1gdujjqqwc"
        privateKey = "02be2db15e0d965d71ce7561a5a21b1562a3c0d4d0e15f0c66e58a3d920e2477"
    }
    id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

## cURL Example

```bash
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initializeAccount",
    "params": {
      "address": "nano_3h5fu37g8mcz8ndu8xgfx3dds6dks6qnp3k8rhjf8knuzec7zr1gdujjqqwc",
      "privateKey": "02be2db15e0d965d71ce7561a5a21b1562a3c0d4d0e15f0c66e58a3d920e2477"
    },
    "id": 1
  }'
```

## Workflow for New Accounts

1. **Generate a wallet**
   ```json
   {"jsonrpc":"2.0","method":"generateWallet","params":{},"id":1}
   ```
   
2. **Send NANO to the new address** (from another wallet or faucet)

3. **Initialize the account** to receive the first transaction
   ```json
   {
     "jsonrpc":"2.0",
     "method":"initializeAccount",
     "params":{
       "address":"nano_...",
       "privateKey":"..."
     },
     "id":1
   }
   ```

4. **Account is now open and can send/receive transactions**

## Notes

- An account must receive at least one transaction before it can send NANO
- The `initializeAccount` method only processes the first pending block
- To receive all pending blocks, use the `receiveAllPending` method
- The account uses the default representative unless already set

## Testing

The method has been tested and verified working with:
- ✅ Already initialized accounts
- ✅ Accounts with pending blocks
- ✅ RPC URL: https://uk1.public.xnopay.com/proxy
- ✅ No API key required

## Server Status

🟢 **Server is running on http://localhost:8080**

All methods are now operational:
- ✅ initialize
- ✅ generateWallet
- ✅ getBalance
- ✅ getAccountInfo
- ✅ getPendingBlocks
- ✅ **initializeAccount** ← Fixed!
- ✅ sendTransaction
- ✅ receiveAllPending

---

**Fix applied successfully!** The `initializeAccount` method is now fully functional.

