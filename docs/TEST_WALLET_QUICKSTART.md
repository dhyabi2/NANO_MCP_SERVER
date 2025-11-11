# Test Wallet Quick Start Guide

## Quick Setup (5 Steps)

### Step 1: Generate Wallets
```json
{
    "jsonrpc": "2.0",
    "method": "setupTestWallets",
    "params": {},
    "id": 1
}
```

### Step 2: Fund Wallets
Send test NANO to the addresses returned in Step 1.

### Step 3: Initialize Accounts
```json
{
    "jsonrpc": "2.0",
    "method": "initializeAccount",
    "params": {
        "address": "YOUR_WALLET_ADDRESS",
        "privateKey": "YOUR_PRIVATE_KEY"
    },
    "id": 2
}
```

### Step 4: Update Balance
```json
{
    "jsonrpc": "2.0",
    "method": "updateTestWalletBalance",
    "params": {
        "walletIdentifier": "wallet1",
        "balance": "BALANCE_IN_RAW"
    },
    "id": 3
}
```

### Step 5: Verify Ready
```json
{
    "jsonrpc": "2.0",
    "method": "checkTestWalletsFunding",
    "params": {},
    "id": 4
}
```

## Test Send/Receive

### Send Transaction
```json
{
    "jsonrpc": "2.0",
    "method": "sendTransaction",
    "params": {
        "fromAddress": "WALLET1_ADDRESS",
        "toAddress": "WALLET2_ADDRESS",
        "amountRaw": "10000000000000000000000000",
        "privateKey": "WALLET1_PRIVATE_KEY"
    },
    "id": 5
}
```

### Receive Transaction
```json
{
    "jsonrpc": "2.0",
    "method": "receiveAllPending",
    "params": {
        "address": "WALLET2_ADDRESS",
        "privateKey": "WALLET2_PRIVATE_KEY"
    },
    "id": 6
}
```

## Common Commands

### Get Wallets
```json
{"jsonrpc": "2.0", "method": "getTestWallets", "params": {}, "id": 1}
```

### Check Funding
```json
{"jsonrpc": "2.0", "method": "checkTestWalletsFunding", "params": {}, "id": 1}
```

### Reset Wallets
```json
{"jsonrpc": "2.0", "method": "resetTestWallets", "params": {}, "id": 1}
```

## Balance Conversion

| NANO | Raw Units |
|------|-----------|
| 0.001 | 1000000000000000000000000000 |
| 0.01 | 10000000000000000000000000000 |
| 0.1 | 100000000000000000000000000000 |
| 1.0 | 1000000000000000000000000000000 |

Formula: **raw = NANO × 10³⁰**

## Full Documentation

See [TEST_WALLET_INTEGRATION.md](TEST_WALLET_INTEGRATION.md) for complete documentation.

