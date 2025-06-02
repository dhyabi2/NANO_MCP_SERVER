# Nano (XNO) n8n Node

This n8n node allows you to interact with the Nano (XNO) cryptocurrency through RPC endpoints. It uses the [SomeNano public node](https://node.somenano.com) by default, but can be configured to use your own Nano node.

## Features

### Account Operations
- **Get Balance**: Retrieve account balance in both Nano and raw units
- **Get Info**: Get comprehensive account information including frontier, representative, and block count
- **Get History**: Retrieve transaction history for an account
- **Get Pending**: List pending (receivable) transactions
- **Validate**: Check if an account address is valid

### Block Operations
- **Get Info**: Retrieve detailed information about a specific block
- **Get Account**: Find which account owns a specific block
- **Get Count**: Get the total number of blocks in the ledger

### Network Operations
- **Get Representatives**: List all representatives and their voting weight
- **Get Online Representatives**: List currently online representatives
- **Get Difficulty**: Get the current network difficulty
- **Get Supply**: Get the available Nano supply
- **Get Version**: Get node version information

### Utility Operations
- **Convert Units**: Convert between different Nano units (raw, nano, Mnano, knano)
- **Get Price**: Get current Nano price (when supported by the node)
- **Generate Key**: Generate a new private key

## Configuration

### Authentication

The node supports two authentication methods:

1. **Public Node (SomeNano)** - Default option using the free public SomeNano RPC endpoint
2. **Custom Node** - Use your own Nano node with custom credentials

### Setting up Custom Node Credentials

If you want to use your own Nano node:

1. Add new credentials of type "Nano API"
2. Enter your node's RPC URL (e.g., `http://localhost:7076`)
3. Optionally add an API key if your node requires authentication

## Usage Examples

### Get Account Balance

```javascript
// Input: Account address
{
  "account": "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3"
}

// Output:
{
  "account": "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3",
  "balance": "325.586001",
  "pending": "0",
  "balance_raw": "325586001000000000000000000000000",
  "pending_raw": "0"
}
```

### Convert Units

```javascript
// Input:
{
  "amount": "1",
  "fromUnit": "Nano",
  "toUnit": "raw"
}

// Output:
{
  "input": "1",
  "fromUnit": "Nano",
  "toUnit": "raw",
  "result": "1000000000000000000000000000000"
}
```

### Get Block Info

```javascript
// Input:
{
  "blockHash": "87434F8041869A01C8F6F263B87972D7BA443A72E0A97D7A3FD0CCC2358FD6F9"
}

// Output:
{
  "block_account": "nano_1ipx847tk8o46pwxt5qjdbncjqcbwcc1rrmqnkztrfjy5k7z4imsrata9est",
  "amount": "30000000000000000000000000000000000",
  "balance": "5606157000000000000000000000000000000",
  "height": "58",
  "local_timestamp": "0",
  "contents": {...}
}
```

## Important Notes

1. **Rate Limits**: The public SomeNano node has rate limits. For production use, consider running your own node.
2. **Read-Only Operations**: The public node only supports read operations. Sending transactions requires a wallet-enabled node.
3. **Account Validation**: The node validates Nano addresses before making RPC calls to prevent errors.
4. **Unit Conversion**: Balance amounts are automatically converted from raw to Nano for easier reading.

## Error Handling

The node includes built-in error handling for:
- Invalid account addresses
- Invalid block hashes
- Network errors
- RPC errors

Enable "Continue On Fail" in the node settings to handle errors gracefully in your workflows.

## Dependencies

This node requires the `nanocurrency` npm package for address validation and unit conversion.

## Links

- [Nano Official Website](https://nano.org)
- [SomeNano Node Documentation](https://node.somenano.com)
- [Nano RPC Protocol Documentation](https://docs.nano.org/commands/rpc-protocol/)
- [Nano Developer Resources](https://nano.org/developers) 