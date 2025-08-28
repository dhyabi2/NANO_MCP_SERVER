# NANO MCP Server

A JSON-RPC server for interacting with the NANO network, providing a simplified interface for managing NANO transactions.

## Features

- Account management
- Balance checking
- Transaction sending
- Pending transaction handling
- Isolated endpoints for specific functionalities

## Installation

```bash
npm install
```

## Configuration

### Main MCP Configuration
```javascript
{
    port: process.env.MCP_PORT || 8080,
    apiUrl: process.env.NANO_RPC_URL || 'https://rpc.nano.to',
    rpcKey: process.env.NANO_RPC_KEY,
    defaultRepresentative: process.env.NANO_REPRESENTATIVE
}
```

### Pending Receive Configuration
```javascript
{
    rpcNodes: process.env.PENDING_RPC_NODES ? JSON.parse(process.env.PENDING_RPC_NODES) : ['https://rpc.nano.to'],
    rpcKey: process.env.PENDING_RPC_KEY,
    endpointPrefix: '/pending/receive',
    maxPendingBlocks: 100,
    minConfirmations: 1,
    workDifficulty: {
        receive: 'fffffe0000000000',
        open: 'fffffe0000000000'
    }
}
```

## API Endpoints

### Core MCP Endpoints

All core endpoints use JSON-RPC 2.0 format:

#### Initialize
```http
POST /
Content-Type: application/json

{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
}
```

#### Get Balance
```http
POST /
Content-Type: application/json

{
    "jsonrpc": "2.0",
    "method": "getBalance",
    "params": {
        "address": "nano_..."
    },
    "id": 1
}
```

#### Send Transaction
```http
POST /
Content-Type: application/json

{
    "jsonrpc": "2.0",
    "method": "sendTransaction",
    "params": {
        "fromAddress": "nano_...",
        "toAddress": "nano_...",
        "amountRaw": "1000000000000000000000000",
        "privateKey": "private_key"
    },
    "id": 1
}
```

### Isolated Pending Receive Endpoint

A dedicated endpoint for handling pending transactions:

```http
POST /pending/receive
Content-Type: application/json

{
    "account": "nano_...",
    "privateKey": "private_key"
}
```

Response:
```json
{
    "success": true,
    "processed": [
        {
            "hash": "block_hash",
            "amount": "amount_in_raw",
            "result": { "hash": "processed_block_hash" }
        }
    ],
    "failed": [],
    "total": 1,
    "successful": 1,
    "failed_count": 0
}
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:core      # Core MCP tests
npm run test:pending   # Pending receive tests
```

### PowerShell Test Scripts
```powershell
# Full flow test
.\tests\full-flow-test.ps1

# Test pending receive endpoint
.\tests\test-pending-receive.ps1
```

## Rules and Guidelines

- Core MCP functionality and isolated endpoints are kept separate
- Each endpoint has its own configuration and error handling
- Pending receive operations use dedicated RPC nodes
- Full documentation available in `docs/PENDING_RECEIVE_RULES.md`

## Security

- Private keys are only transmitted over HTTPS
- Rate limiting is enforced on all endpoints
- Input validation follows strict schemas
- Error messages do not expose internal details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.