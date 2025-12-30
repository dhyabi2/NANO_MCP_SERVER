# NANO MCP Server - Startup Guide

## Configuration

The server has been configured to use the xnopay public RPC node:

- **RPC URL**: https://uk1.public.xnopay.com/proxy
- **API Key**: None required (public node)
- **Port**: 8080
- **Transport**: HTTP

## Starting the Server

### Option 1: Using npm (Recommended)
```bash
npm start
```

### Option 2: Using Node directly
```bash
node src/index.js
```

### Option 3: Using the quick test script
```bash
node quick-test.js
```

## Verifying the Server

After starting, the server should display:
```
NANO MCP Server running on port 8080
API documentation available at http://0.0.0.0:8080/api-docs
```

### Test Endpoints

1. **List Available Tools**:
   ```bash
   curl http://localhost:8080/tools/list
   ```

2. **Generate a Wallet** (JSON-RPC):
   ```bash
   curl -X POST http://localhost:8080/ \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"generateWallet","params":{},"id":1}'
   ```

3. **Check Balance** (JSON-RPC):
   ```bash
   curl -X POST http://localhost:8080/ \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"getBalance","params":{"address":"nano_..."},"id":1}'
   ```

## Available Methods

- `initialize` - Get server capabilities
- `generateWallet` - Create new NANO wallet
- `getBalance` - Check account balance
- `getAccountInfo` - Get detailed account information
- `getPendingBlocks` - Check pending transactions
- `initializeAccount` - Initialize account for transactions
- `sendTransaction` - Send NANO to another address
- `receiveAllPending` - Process pending receive blocks

## API Documentation

Once the server is running, visit:
**http://localhost:8080/api-docs**

## Files Modified

1. **src/index.js** - Updated to use xnopay RPC URL without API key
2. **utils/nano-transactions.js** - Modified to handle null API keys
3. **src/interfaces/pending-receive.interface.js** - Updated RPC configuration

## Notes

- The server uses the xnopay public node which doesn't require an API key
- All requests must follow JSON-RPC 2.0 format
- The server supports CORS for cross-origin requests

