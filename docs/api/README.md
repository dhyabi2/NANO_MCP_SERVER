# MCP API Documentation

## Overview

MCP (NANO Cryptocurrency) Server provides a JSON-RPC 2.0 API for interacting with the NANO cryptocurrency network. This server supports both HTTP and stdio transports, making it versatile for different integration scenarios.

## Quick Start

```bash
# Start the server with HTTP transport (default)
node src/index.js

# Start with stdio transport
MCP_TRANSPORT=stdio node src/index.js
```

## Available Methods

### initialize

Initializes the connection and returns server capabilities.

**Request:**
```json
{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
}
```

**Response:**
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
                "receiveAllPending",
                "getAccountInfo",
                "getPendingBlocks"
            ]
        }
    },
    "id": 1
}
```

### generateWallet

Generates a new NANO wallet with address and private key.

**Request:**
```json
{
    "jsonrpc": "2.0",
    "method": "generateWallet",
    "params": {},
    "id": 1
}
```

**Response:**
```json
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

### getBalance

Retrieves the balance for a NANO address.

**Request:**
```json
{
    "jsonrpc": "2.0",
    "method": "getBalance",
    "params": {
        "address": "nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf"
    },
    "id": 1
}
```

**Response:**
```json
{
    "jsonrpc": "2.0",
    "result": {
        "balance": "1000000000000000000000000",
        "pending": "0"
    },
    "id": 1
}
```

## Error Codes

| Code    | Message           | Description                                     |
|---------|------------------|-------------------------------------------------|
| -32600  | Invalid Request  | The JSON sent is not a valid Request object     |
| -32601  | Method not found | The method does not exist / is not available    |
| -32602  | Invalid params   | Invalid method parameters                       |
| -32603  | Internal error   | Internal JSON-RPC error                         |
| -32000  | Server error     | Generic server-side error                       |

## Transport Options

### HTTP Transport

The HTTP transport runs on port 3000 by default and accepts POST requests with JSON-RPC 2.0 formatted bodies.

**Configuration:**
- Port: Set via `MCP_PORT` environment variable (default: 3000)
- CORS: Enabled for all origins
- Content-Type: application/json

### stdio Transport

The stdio transport allows for direct process communication using stdin/stdout.

**Configuration:**
- Set `MCP_TRANSPORT=stdio` environment variable
- Each request/response must be on a single line
- Responses are written to stdout
- Server messages are written to stderr

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
   - Ensure sufficient PoW

## Support

For issues and feature requests, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with:
   - Environment details
   - Steps to reproduce
   - Expected vs actual behavior 