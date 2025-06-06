# NANO MCP Server with Wallet Management

A Node.js implementation of a NANO cryptocurrency server with integrated wallet management capabilities.

## Features

- NANO MCP Server implementation
- Wallet generation and management
- Transaction handling (send/receive)
- Balance checking
- Account initialization
- Comprehensive logging system
- Interactive wallet testing

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Usage

### Start Server Only
```bash
npm run server
```

### Start Server with Wallet Test
```bash
npm start
```

### Run Wallet Test Only
```bash
npm test
```

## API Methods

The server supports the following RPC methods:

- `initialize` - Initialize the server and get capabilities
- `generateWallet` - Generate a new NANO wallet
- `getBalance` - Get account balance
- `initializeAccount` - Initialize a new account
- `sendTransaction` - Send NANO to another address
- `receivePending` - Receive pending transactions

## API Documentation

All API endpoints use POST method and expect JSON-RPC 2.0 format. The default server endpoint is `http://localhost:8080`.

### Headers
All requests should include:
```
Content-Type: application/json
X-API-Key: your-rpc-key
```

### Initialize Server
```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-rpc-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
  }'
```
Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "version": "1.0.0",
    "capabilities": {
      "methods": [
        "initialize",
        "generateWallet",
        "getBalance",
        "initializeAccount",
        "sendTransaction",
        "receivePending"
      ]
    }
  },
  "id": 1
}
```

### Generate Wallet
```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-rpc-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "generateWallet",
    "params": {},
    "id": 1
  }'
```
Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "publicKey": "public_key_here",
    "privateKey": "private_key_here",
    "address": "nano_..."
  },
  "id": 1
}
```

### Get Balance
```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-rpc-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "getBalance",
    "params": {
      "address": "nano_..."
    },
    "id": 1
  }'
```
Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "balance": "100000000000000000000000000000",
    "pending": "0",
    "receivable": "0",
    "balance_nano": "100.000000",
    "pending_nano": "0.000000",
    "receivable_nano": "0.000000"
  },
  "id": 1
}
```

### Initialize Account
```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-rpc-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initializeAccount",
    "params": {
      "address": "nano_...",
      "privateKey": "private_key_here"
    },
    "id": 1
  }'
```
Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "address": "nano_...",
    "initialized": true,
    "balance": "0"
  },
  "id": 1
}
```

### Send Transaction
```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-rpc-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "sendTransaction",
    "params": {
      "fromAddress": "nano_...",
      "toAddress": "nano_...",
      "amountRaw": "1000000000000000000000000",
      "privateKey": "private_key_here"
    },
    "id": 1
  }'
```
Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "hash": "transaction_hash_here",
    "amount": "1000000000000000000000000",
    "balance": "900000000000000000000000"
  },
  "id": 1
}
```

### Receive Pending
```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-rpc-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "receivePending",
    "params": {
      "address": "nano_...",
      "privateKey": "private_key_here"
    },
    "id": 1
  }'
```
Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "received": [
      {
        "hash": "block_hash_here",
        "amount": "1000000000000000000000000",
        "source": "nano_source_address"
      }
    ]
  },
  "id": 1
}
```

### Error Handling
All errors follow JSON-RPC 2.0 error format:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Error description here"
  },
  "id": 1
}
```

Common error codes:
- `-32700`: Parse error
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32000`: Server error

Common error messages:
- "Invalid sender address"
- "Invalid recipient address"
- "Invalid private key format"
- "Insufficient balance"
- "Account not found"
- "Failed to generate work"
- "Method not found"

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DEBUG=false
RPC_KEY=your-rpc-key
```

## Project Structure

```
src/
  ├── index.js           # Main entry point
  ├── mcp.js            # MCP server implementation
  ├── logger.js         # Logging functionality
  ├── key-manager.js    # Cryptographic operations
  ├── services/
  │   └── wallet-service.js  # Wallet management service
  └── tests/
      └── wallet-test.js     # Wallet testing functionality
```

## Security

- Private keys are never stored
- All cryptographic operations are performed in memory
- Secure random number generation for key pairs
- Input validation for all operations

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT 

import { NanoMCP } from 'nano-mcp'; 