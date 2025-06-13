# MCP (Nano Cryptocurrency) Server

## Overview

MCP (NANO Cryptocurrency) Server provides a JSON-RPC 2.0 API for interacting with the NANO cryptocurrency network. This server supports both HTTP and stdio transports, making it versatile for different integration scenarios.

## What is NANO Cryptocurrency?

NANO is a sustainable digital currency with instant transactions and zero fees, making it ideal for AI systems and automated transactions. Unlike traditional cryptocurrencies, NANO uses a unique block-lattice architecture and a Delegated Proof of Stake (DPoS) consensus mechanism called Open Representative Voting (ORV).

### Why NANO is Unique for AI Applications:

1. **Instant Transactions**: Perfect for real-time AI decision-making and automated systems
2. **Zero Fees**: Enables micro-transactions and continuous AI-driven operations without cost overhead
3. **Energy Efficient**: Uses minimal computational resources, making it environmentally friendly
4. **Scalability**: Block-lattice architecture allows parallel processing of transactions
5. **Deterministic Finality**: Provides immediate transaction confirmation, crucial for AI systems
6. **Asynchronous Operations**: Ideal for distributed AI systems and parallel processing

## Quick Start

```bash
# Using npx
npx -y nano-mcp

# Or install and run
npm install nano-mcp
node src/index.js
```

## 📁 Project Structure

```
mcp-nano/
├── src/
│   ├── index.js          # Main server entry point
│   ├── server.js         # MCP server implementation
│   └── swagger.js        # API documentation
├── utils/
│   └── nano-transactions.js  # Nano transaction handling
├── tests/
│   └── full-flow-test.ps1    # Integration tests
├── package.json
└── README.md
```

## 🚀 Prerequisites

- Node.js 16+ (as specified in package.json)
- Express.js for HTTP server
- Nano cryptocurrency libraries:
  - nanocurrency
  - nanocurrency-web
- Additional dependencies:
  - body-parser
  - swagger-ui-express
  - swagger-jsdoc
  - ajv (for schema validation)

## JSON-RPC API Reference

### Available Methods

1. `initialize` - Get server capabilities
2. `generateWallet` - Create new NANO wallet
3. `getBalance` - Check account balance
4. `initializeAccount` - Initialize account for transactions
5. `sendTransaction` - Send NANO to another address
6. `receiveAllPending` - Process pending receive blocks
7. `getAccountInfo` - Get detailed account information
8. `getPendingBlocks` - Check pending transactions

### Method Examples

#### Initialize
```json
// Request
{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
}

// Response
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
                "receiveAllPending",
                "getAccountInfo",
                "getPendingBlocks"
            ]
        }
    },
    "id": 1
}
```

#### Generate Wallet
```json
// Request
{
    "jsonrpc": "2.0",
    "method": "generateWallet",
    "params": {},
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "address": "nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf",
        "privateKey": "4bc2e9c2df4be93e5cbeb41b52c2fc9efc1b4c0e67951fc6c5098c117913d25a",
        "publicKey": "3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf"
    },
    "id": 1
}
```

## Configuration

Environment variables:
```bash
MCP_PORT=3000          # HTTP server port
MCP_TRANSPORT=http     # Transport type (http/stdio)
NANO_RPC_URL          # NANO node RPC endpoint
NANO_RPC_KEY          # API key for node (if required)
NANO_REPRESENTATIVE   # Default representative
```

## Transport Options

### 1. HTTP Transport (default)
- REST API on port 3000
- JSON-RPC 2.0 protocol
- Swagger docs at /api-docs
- CORS enabled for all origins
- Content-Type: application/json

### 2. stdio Transport
- Direct process communication
- Line-delimited JSON
- Responses written to stdout
- Server messages written to stderr

## Integration Examples

### Node.js
```javascript
const axios = require('axios');

async function sendTransaction(fromAddress, toAddress, amount, privateKey) {
    const response = await axios.post('http://localhost:3000', {
        jsonrpc: "2.0",
        method: "sendTransaction",
        params: {
            fromAddress,
            toAddress,
            amountRaw: amount,
            privateKey
        },
        id: 1
    });
    return response.data;
}
```

### Python
```python
import requests

def send_transaction(from_address, to_address, amount, private_key):
    response = requests.post('http://localhost:3000', json={
        "jsonrpc": "2.0",
        "method": "sendTransaction",
        "params": {
            "fromAddress": from_address,
            "toAddress": to_address,
            "amountRaw": amount,
            "privateKey": private_key
        },
        "id": 1
    })
    return response.json()
```

## Error Handling

### Error Codes
| Code    | Message           | Description                                     |
|---------|------------------|-------------------------------------------------|
| -32600  | Invalid Request  | The JSON sent is not a valid Request object     |
| -32601  | Method not found | The method does not exist / is not available    |
| -32602  | Invalid params   | Invalid method parameters                       |
| -32603  | Internal error   | Internal JSON-RPC error                         |
| -32000  | Server error     | Generic server-side error                       |

## Security Considerations

1. Private Key Handling
   - Never store private keys in plain text
   - Use secure environment variables
   - Implement proper key rotation

2. RPC Node Security
   - Use authenticated RPC nodes
   - Set `NANO_RPC_KEY` for protected endpoints
   - Monitor for suspicious activity

3. Rate Limiting
   - Implement appropriate rate limits
   - Monitor for abuse
   - Use proper error responses

## Performance Optimization

1. Connection Pooling
   - Reuse HTTP connections
   - Maintain persistent WebSocket connections
   - Pool RPC requests

2. Caching
   - Cache account information
   - Cache block data
   - Implement proper cache invalidation

## TypeScript Type Definitions

```typescript
/**
 * NANO address format with nano_ prefix
 * @example "nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf"
 */
type NanoAddress = string;

/**
 * 64-character hexadecimal private key
 * @example "4bc2e9c2df4be93e5cbeb41b52c2fc9efc1b4c0e67951fc6c5098c117913d25a"
 */
type PrivateKey = string;

/**
 * Raw amount in string format to handle large numbers
 * @example "1000000000000000000000000"
 */
type RawAmount = string;

/**
 * 64-character hexadecimal block hash
 * @example "991CF190094C00F0B68E2E5F75F6BEE95A2E0BD93CEAA4A6734DB9F19B728948"
 */
type BlockHash = string;

/**
 * Standard JSON-RPC 2.0 request format
 */
interface JsonRpcRequest<T> {
    jsonrpc: "2.0";
    method: string;
    params: T;
    id: number;
}

/**
 * Standard JSON-RPC 2.0 success response format
 */
interface JsonRpcResponse<T> {
    jsonrpc: "2.0";
    result: T;
    id: number;
}

/**
 * Standard JSON-RPC 2.0 error response format
 */
interface JsonRpcError {
    jsonrpc: "2.0";
    error: {
        code: number;
        message: string;
        data?: any;
    };
    id: number | null;
}

/**
 * Response from generateWallet method
 */
interface WalletResponse {
    /** The public address starting with nano_ */
    address: NanoAddress;
    /** The private key for the wallet */
    privateKey: PrivateKey;
    /** The public key portion of the address */
    publicKey: string;
}

/**
 * Response from getBalance method
 */
interface BalanceResponse {
    /** Current confirmed balance in raw units */
    balance: RawAmount;
    /** Sum of pending incoming transactions */
    pending: RawAmount;
}

/**
 * Information about a pending block
 */
interface PendingBlock {
    /** Amount being transferred in raw units */
    amount: RawAmount;
    /** Address that sent the transaction */
    source: NanoAddress;
}

/**
 * Response from a send transaction
 */
interface TransactionResponse {
    /** Whether the transaction was successful */
    success: boolean;
    /** Hash of the transaction block */
    hash: BlockHash;
    /** Amount that was sent in raw units */
    amount: RawAmount;
    /** New balance after the transaction */
    balance: RawAmount;
}
```

## Troubleshooting

### Common Issues

1. Connection Refused
   - Check if server is running
   - Verify correct port
   - Check firewall settings

2. Invalid JSON-RPC
   - Validate request format
   - Check method name
   - Verify parameter types

3. Transaction Failures
   - Check account balance
   - Verify private key
   - Ensure sufficient funds

4. Port Already in Use
   - Stop any existing MCP server instances
   - Change port using MCP_PORT environment variable
   - Check for other services using port 3000

5. RPC Node Issues
   - Verify NANO_RPC_URL is accessible
   - Check NANO_RPC_KEY is valid
   - Monitor RPC node status

## Support

For issues and feature requests, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with:
   - Environment details
   - Steps to reproduce
   - Expected vs actual behavior 