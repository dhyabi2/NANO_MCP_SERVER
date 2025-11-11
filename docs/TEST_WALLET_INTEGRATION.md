# Test Wallet Integration Guide

## Overview

The Test Wallet Integration feature provides a comprehensive solution for managing test wallets in the NANO MCP Server. This feature allows you to generate two test wallets, track their funding status, and use them for all send/receive testing operations.

## Features

- **Automated Wallet Generation**: Generate two unique test wallets with complete cryptographic details
- **Persistent Storage**: Wallets are saved to disk with private keys, public keys, seeds, and addresses
- **Funding Status Tracking**: Monitor which wallets have been funded and are ready for testing
- **Balance Management**: Update and track wallet balances
- **Comprehensive Logging**: All operations are logged for debugging and audit purposes
- **TDD Implementation**: Fully tested using Test-Driven Development principles

## MCP Tools/Functions

### 1. setupTestWallets

Generates two new test wallets and saves them with all necessary information.

**Request:**
```json
{
    "jsonrpc": "2.0",
    "method": "setupTestWallets",
    "params": {},
    "id": 1
}
```

**Response:**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "wallet1": {
            "address": "nano_3xxxxx...",
            "privateKey": "XXXXXXXX...",
            "publicKey": "YYYYYYYY...",
            "seed": "ZZZZZZZZ...",
            "balance": "0",
            "funded": false
        },
        "wallet2": {
            "address": "nano_1xxxxx...",
            "privateKey": "AAAAAAAA...",
            "publicKey": "BBBBBBBB...",
            "seed": "CCCCCCCC...",
            "balance": "0",
            "funded": false
        },
        "created": "2025-11-11T15:20:06.987Z",
        "status": "awaiting_funding",
        "message": "Test wallets generated successfully. Please fund both wallets with test NANO to proceed with testing.",
        "fundingInstructions": [
            "Send test NANO to Wallet 1: nano_3xxxxx...",
            "Send test NANO to Wallet 2: nano_1xxxxx...",
            "After funding, use checkFundingStatus to verify both wallets are funded",
            "Recommended test amount: 0.1 NANO or more per wallet"
        ]
    },
    "id": 1
}
```

**Usage Example:**
After calling this function, the user should:
1. Copy the addresses for wallet1 and wallet2
2. Send test NANO from a faucet or another wallet
3. Wait for transactions to be confirmed
4. Use `checkTestWalletsFunding` to verify funding status

---

### 2. getTestWallets

Retrieves existing test wallets with optional private key inclusion.

**Request:**
```json
{
    "jsonrpc": "2.0",
    "method": "getTestWallets",
    "params": {
        "includePrivateKeys": true
    },
    "id": 1
}
```

**Parameters:**
- `includePrivateKeys` (optional, boolean): Whether to include private keys and seeds in response. Default: `true`

**Response (wallets exist):**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "exists": true,
        "wallet1": {
            "address": "nano_3xxxxx...",
            "privateKey": "XXXXXXXX...",
            "publicKey": "YYYYYYYY...",
            "seed": "ZZZZZZZZ...",
            "balance": "1000000000000000000000000000",
            "funded": true
        },
        "wallet2": {
            "address": "nano_1xxxxx...",
            "privateKey": "AAAAAAAA...",
            "publicKey": "BBBBBBBB...",
            "seed": "CCCCCCCC...",
            "balance": "1000000000000000000000000000",
            "funded": true
        },
        "created": "2025-11-11T15:20:06.987Z",
        "lastUpdated": "2025-11-11T15:25:30.123Z"
    },
    "id": 1
}
```

**Response (no wallets):**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "exists": false,
        "message": "No test wallets found. Use setupTestWallets to generate new wallets."
    },
    "id": 1
}
```

---

### 3. updateTestWalletBalance

Updates the balance and funding status for a specific test wallet. This is typically called after checking the on-chain balance using `getBalance` or `getAccountInfo`.

**Request:**
```json
{
    "jsonrpc": "2.0",
    "method": "updateTestWalletBalance",
    "params": {
        "walletIdentifier": "wallet1",
        "balance": "1000000000000000000000000000"
    },
    "id": 1
}
```

**Parameters:**
- `walletIdentifier` (required, string): Must be either "wallet1" or "wallet2"
- `balance` (required, string): New balance in raw units (1 NANO = 10^30 raw)

**Response:**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "success": true,
        "wallet": "wallet1",
        "balance": "1000000000000000000000000000",
        "funded": true,
        "address": "nano_3xxxxx..."
    },
    "id": 1
}
```

---

### 4. checkTestWalletsFunding

Checks the funding status of both test wallets to determine if they're ready for testing.

**Request:**
```json
{
    "jsonrpc": "2.0",
    "method": "checkTestWalletsFunding",
    "params": {},
    "id": 1
}
```

**Response:**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "wallet1": {
            "address": "nano_3xxxxx...",
            "funded": true,
            "balance": "1000000000000000000000000000"
        },
        "wallet2": {
            "address": "nano_1xxxxx...",
            "funded": true,
            "balance": "1000000000000000000000000000"
        },
        "bothFunded": true,
        "readyForTesting": true,
        "message": "Both wallets are funded and ready for testing"
    },
    "id": 1
}
```

---

### 5. resetTestWallets

Deletes existing test wallets to start fresh with new wallet generation.

**Request:**
```json
{
    "jsonrpc": "2.0",
    "method": "resetTestWallets",
    "params": {},
    "id": 1
}
```

**Response:**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "success": true,
        "message": "Test wallets deleted successfully. Generate new wallets to start fresh."
    },
    "id": 1
}
```

---

## Complete Testing Workflow

### Step 1: Generate Test Wallets

```json
{
    "jsonrpc": "2.0",
    "method": "setupTestWallets",
    "params": {},
    "id": 1
}
```

**Expected Action**: Copy the addresses from the response and prepare to fund them.

---

### Step 2: Fund the Wallets

Send test NANO to both wallet addresses. You can use:
- A NANO faucet (for testnet)
- Your own funded wallet
- Any other source of test NANO

**Recommended amount**: At least 0.1 NANO per wallet for comprehensive testing

---

### Step 3: Check On-Chain Balances

After sending funds, check if they're visible on-chain:

```json
{
    "jsonrpc": "2.0",
    "method": "getBalance",
    "params": {
        "address": "nano_3xxxxx..."
    },
    "id": 2
}
```

For new accounts with pending blocks, you may need to initialize the account first:

```json
{
    "jsonrpc": "2.0",
    "method": "initializeAccount",
    "params": {
        "address": "nano_3xxxxx...",
        "privateKey": "XXXXXXXX..."
    },
    "id": 3
}
```

---

### Step 4: Update Local Wallet Balance

Once you confirm the on-chain balance, update the local test wallet records:

```json
{
    "jsonrpc": "2.0",
    "method": "updateTestWalletBalance",
    "params": {
        "walletIdentifier": "wallet1",
        "balance": "1000000000000000000000000000"
    },
    "id": 4
}
```

Repeat for wallet2.

---

### Step 5: Verify Funding Status

Confirm both wallets are funded and ready:

```json
{
    "jsonrpc": "2.0",
    "method": "checkTestWalletsFunding",
    "params": {},
    "id": 5
}
```

---

### Step 6: Perform Send/Receive Tests

Now you can use the test wallets for all send and receive operations:

**Send from wallet1 to wallet2:**
```json
{
    "jsonrpc": "2.0",
    "method": "sendTransaction",
    "params": {
        "fromAddress": "nano_3xxxxx...",
        "toAddress": "nano_1xxxxx...",
        "amountRaw": "100000000000000000000000000",
        "privateKey": "XXXXXXXX..."
    },
    "id": 6
}
```

**Receive on wallet2:**
```json
{
    "jsonrpc": "2.0",
    "method": "receiveAllPending",
    "params": {
        "address": "nano_1xxxxx...",
        "privateKey": "AAAAAAAA..."
    },
    "id": 7
}
```

---

## File Storage

Test wallets are stored in:
```
NANO_MCP_SERVER/tests/test-wallets.json
```

**File Format:**
```json
{
    "wallet1": {
        "address": "nano_3xxxxx...",
        "privateKey": "XXXXXXXX...",
        "publicKey": "YYYYYYYY...",
        "seed": "ZZZZZZZZ...",
        "balance": "1000000000000000000000000000",
        "funded": true
    },
    "wallet2": {
        "address": "nano_1xxxxx...",
        "privateKey": "AAAAAAAA...",
        "publicKey": "BBBBBBBB...",
        "seed": "CCCCCCCC...",
        "balance": "1000000000000000000000000000",
        "funded": true
    },
    "created": "2025-11-11T15:20:06.987Z",
    "lastUpdated": "2025-11-11T15:25:30.123Z"
}
```

**Security Note**: This file contains private keys and should NOT be committed to version control or shared publicly.

---

## Balance Conversion Reference

NANO uses raw units for all on-chain operations. Here's a conversion reference:

| NANO Amount | Raw Units |
|-------------|-----------|
| 0.000001 NANO | 1000000000000000000000000 raw |
| 0.00001 NANO | 10000000000000000000000000 raw |
| 0.0001 NANO | 100000000000000000000000000 raw |
| 0.001 NANO | 1000000000000000000000000000 raw |
| 0.01 NANO | 10000000000000000000000000000 raw |
| 0.1 NANO | 100000000000000000000000000000 raw |
| 1 NANO | 1000000000000000000000000000000 raw |

Formula: `raw = NANO × 10^30`

---

## Logging

All test wallet operations are comprehensively logged with the prefix `[TestWalletManager]`. Logs include:

- Wallet generation events
- File save/load operations
- Balance updates
- Funding status checks
- Errors and warnings

**Example Log Output:**
```
[TestWalletManager] Initialized with wallet file path: C:\Users\...\test-wallets.json
[TestWalletManager] Starting test wallet generation...
[TestWalletManager] Generating wallet1...
[TestWalletManager] Wallet1 generated: nano_3xxxxx...
[TestWalletManager] Generating wallet2...
[TestWalletManager] Wallet2 generated: nano_1xxxxx...
[TestWalletManager] Saving wallets to file: C:\Users\...\test-wallets.json
[TestWalletManager] Wallets data saved successfully
[TestWalletManager] Wallets saved successfully
```

---

## Error Handling

### Common Errors

**1. Invalid Wallet Identifier**
```json
{
    "jsonrpc": "2.0",
    "error": {
        "code": -32603,
        "message": "Invalid wallet identifier. Must be \"wallet1\" or \"wallet2\""
    },
    "id": 1
}
```

**2. No Wallets Found**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "exists": false,
        "message": "No test wallets found. Use setupTestWallets to generate new wallets."
    },
    "id": 1
}
```

---

## Testing

The test wallet manager is fully tested using Jest with TDD principles. All tests can be run with:

```bash
npm test
```

**Test Coverage:**
- Wallet generation with all required properties
- Wallet initialization as unfunded
- File system persistence
- Timestamp generation
- Funding status management
- Balance updates
- Private key filtering
- Error handling
- Logging verification

**Test Results:**
```
PASS  tests/test-wallet-manager.test.js
  TestWalletManager
    generateTestWallets
      ✓ should generate two wallets with all required properties
      ✓ should initialize both wallets as unfunded
      ✓ should save wallets to file system
      ✓ should include creation timestamp
      ✓ should return status indicating wallets need funding
      ✓ should include funding instructions
    getTestWallets
      ✓ should retrieve existing wallets from file
      ✓ should return null when no wallets exist
      ✓ should not include private keys when includePrivateKeys is false
    updateWalletBalance
      ✓ should update wallet balance and funding status
      ✓ should mark wallet as unfunded when balance is zero
      ✓ should persist balance updates to file
      ✓ should throw error for invalid wallet identifier
    checkFundingStatus
      ✓ should return funding status for both wallets
      ✓ should indicate when both wallets are funded
      ✓ should indicate when wallets are not fully funded
    resetTestWallets
      ✓ should delete existing wallet file
      ✓ should return success even if no wallet file exists
    logging
      ✓ should log wallet generation
      ✓ should log wallet balance updates
      ✓ should log errors

Tests:       21 passed, 21 total
```

---

## Best Practices

1. **Always Check Funding Status**: Before running send/receive tests, verify both wallets are funded using `checkTestWalletsFunding`

2. **Initialize Accounts First**: New accounts must receive their first transaction to be opened on the blockchain. Use `initializeAccount` or `receiveAllPending` before sending from a wallet

3. **Update Balances After Transactions**: After each send or receive operation, update the local wallet balance using `updateTestWalletBalance`

4. **Keep Private Keys Secure**: The test-wallets.json file contains private keys. Add it to .gitignore and never commit it

5. **Use Appropriate Amounts**: For testing, use small amounts (0.01-0.1 NANO) to avoid running out of funds

6. **Reset Between Test Suites**: Use `resetTestWallets` to start fresh when beginning a new test suite

7. **Monitor Logs**: Check the console logs for detailed information about all wallet operations

---

## Integration with Existing MCP Tools

The test wallets can be used with all existing NANO MCP tools:

- `sendTransaction`: Send NANO between test wallets
- `receiveAllPending`: Receive pending blocks on test wallets
- `getBalance`: Check test wallet balances
- `getAccountInfo`: Get detailed information about test wallets
- `getPendingBlocks`: Check for pending transactions
- `initializeAccount`: Open new test wallet accounts
- `generateQrCode`: Generate QR codes for test wallet addresses

---

## Troubleshooting

### Problem: Wallet file not found

**Solution**: Run `setupTestWallets` to generate new wallets

---

### Problem: Balance not updating after sending funds

**Possible Causes:**
1. Transaction not confirmed on-chain yet (wait a few seconds)
2. Account needs initialization (use `initializeAccount`)
3. Need to receive pending blocks (use `receiveAllPending`)

**Solution**: Check on-chain balance with `getBalance`, then use `updateTestWalletBalance`

---

### Problem: Send transaction fails

**Possible Causes:**
1. Insufficient balance
2. Account not initialized
3. Invalid amount or address

**Solution**: 
1. Check balance with `getBalance`
2. Verify wallet is funded with `checkTestWalletsFunding`
3. Ensure account is initialized with `getAccountInfo`

---

## API Reference

### Module: TestWalletManager

**Location**: `utils/test-wallet-manager.js`

**Class Methods:**

- `generateTestWallets()`: Generate two new test wallets
- `getTestWallets(includePrivateKeys)`: Retrieve existing wallets
- `updateWalletBalance(walletIdentifier, balance)`: Update wallet balance
- `checkFundingStatus()`: Check if wallets are funded
- `resetTestWallets()`: Delete existing wallets

**Internal Methods:**

- `_saveWallets(walletsData)`: Save wallets to file
- `_fileExists(filePath)`: Check if file exists

---

## Contributing

When extending the test wallet functionality:

1. Write tests first (TDD approach)
2. Include comprehensive logging
3. Handle errors gracefully
4. Update documentation
5. Ensure backward compatibility

---

## License

This feature is part of the NANO MCP Server and is licensed under the MIT License.

---

## Support

For issues or questions:
- GitHub: https://github.com/dhyabi2/NANO_MCP_SERVER
- Create an issue with the `test-wallets` label

