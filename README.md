# NANO MCP Server with Wallet Management

A Node.js implementation of a NANO cryptocurrency server with integrated wallet management capabilities.

## Features

- NANO MCP Server implementation
- Wallet generation and management
- Transaction handling (send/receive)
- Balance checking
- Account initialization
- QR code generation for payments
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