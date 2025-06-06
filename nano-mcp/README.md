# Nano MCP (Multi-Currency Protocol) Server

This is a MCP server implementation for NANO (XNO) cryptocurrency. It provides a standardized interface for wallet operations and transaction handling.

## Features

- Wallet Generation and Management
- Transaction Signing and Processing
- Pending Transaction Handling
- Account Initialization
- Balance Checking
- Unit Conversion

## Installation

```bash
npm install
npm run build
```

## Usage

### Initialize the Server

```typescript
import { NanoMCP } from './mcp';

const server = new NanoMCP();
```

### Available Methods

1. **Generate Wallet**
```typescript
const wallet = await server.generateWallet();
// Returns: { address: string, privateKey: string, publicKey: string }
```

2. **Initialize Account**
```typescript
const result = await server.initializeAccount(address, privateKey);
// Opens the account on the network
```

3. **Send Transaction**
```typescript
const result = await server.sendTransaction(fromAddress, privateKey, toAddress, amountRaw);
// Returns: { success: boolean, hash?: string, error?: string }
```

4. **Receive Pending**
```typescript
const result = await server.receivePending(address, privateKey);
// Returns: { received: number }
```

5. **Get Balance**
```typescript
const balance = await server.getBalance(address);
// Returns: { balanceNano: string, pendingNano: string }
```

6. **Convert Units**
```typescript
const nanoAmount = server.convertToNano(rawAmount);
const rawAmount = server.convertFromNano(nanoAmount);
```

## Implementation Details

### Block Signing
- Uses `nanocurrency-web` for improved block signing
- Supports state blocks for all operations
- Handles work generation automatically

### Address Format
- Automatically converts between `xrb_` and `nano_` prefixes
- Validates addresses and key formats

### Error Handling
- Comprehensive error handling with detailed messages
- Type-safe error responses

## Dependencies

- nanocurrency: ^2.5.0
- nanocurrency-web: ^1.4.3
- axios: ^1.6.7
- node-fetch: ^3.3.2

## Development

```bash
npm run build    # Build the project
npm run test     # Run tests
npm run start    # Start the server
```

## Security Considerations

- Private keys are never stored, only used for transaction signing
- All cryptographic operations use standard libraries
- Work values are generated with appropriate difficulty

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Required Parameters
NANO_RPC_URL=https://rpc.nano.to/     # Required: URL of the NANO RPC server
NANO_RPC_KEY=your-rpc-key-here        # Required: Get from https://rpc.nano.to/
NANO_GPU_KEY=your-gpu-key-here        # Required: For work generation

# Optional Parameters
# Choose your representative from https://nanexplorer.com/nano/representatives
NANO_DEFAULT_REPRESENTATIVE=nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4
```

### Programmatic Configuration

```typescript
import { NanoMCP } from '@chainreactionom/nano-mcp-server';

// Initialize with custom configuration
const mcp = await NanoMCP.initialize({
    rpcUrl: 'https://rpc.nano.to/',
    rpcKey: 'your-rpc-key',
    gpuKey: 'your-gpu-key',
    defaultRepresentative: 'your-representative-address' // Optional
});
```

## Usage

### Basic Operations

```typescript
// Create a new instance
const nano = new NanoTransactions();

// Get account information
const accountInfo = await nano.getAccountInfo('nano_address');

// Get pending blocks
const pending = await nano.getPendingBlocks('nano_address');

// Generate work for a block
const work = await nano.generateWork('block_hash');
```

### Send Transaction

```typescript
// First get account info
const accountInfo = await nano.getAccountInfo(fromAddress);

// Create and process send block
const result = await nano.createSendBlock(
    fromAddress,
    privateKey,
    toAddress,
    '0.001', // Amount in NANO
    accountInfo
);

console.log('Send transaction result:', result);
// Result includes:
// - hash: Block hash
// - block: Block details
// - confirmationTime: "< 1 second"
// - fee: "0"
```

### Receive Transactions

```typescript
// Receive all pending blocks
const result = await nano.receiveAllPending(address, privateKey);

// For new accounts, create open block
const openResult = await nano.createOpenBlock(
    address,
    privateKey,
    sourceBlock,
    sourceAmount
);
```

### Error Handling

The library provides detailed error messages and validation:

```typescript
try {
    const result = await nano.createSendBlock(/* ... */);
} catch (error) {
    console.error('Transaction failed:', error.message);
    // Detailed error information:
    // - Invalid addresses
    // - Insufficient balance
    // - RPC errors
    // - Work generation failures
}
```

### Advanced Features

#### Balance Validation
```typescript
const accountInfo = await nano.getAccountInfo(address);
const balance = convert(accountInfo.balance, { from: Unit.raw, to: Unit.NANO });
console.log('Current balance:', balance, 'NANO');
```

#### Representative Management
```typescript
// Get current representative
const info = await nano.getAccountInfo(address);
console.log('Current representative:', info.representative);

// Change representative (requires private key)
const result = await nano.changeRepresentative(address, privateKey, newRepresentative);
```

## Testing

The library includes comprehensive test suites:

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=rpc.test.ts
npm test -- --testPathPattern=mcp.test.ts
```

Test coverage includes:
- RPC operations
- Transaction creation and processing
- Error handling
- Configuration validation
- Work generation
- Account management
- Balance operations
- Representative management

## Security Best Practices

1. Never expose private keys in code or version control
2. Use environment variables for sensitive configuration
3. Validate all input addresses and amounts
4. Monitor transaction confirmations
5. Implement proper error handling
6. Regular security audits
7. Keep dependencies updated

## Performance Optimization

The library is optimized for:
- Minimal latency in transaction processing
- Efficient work generation
- Optimized RPC calls
- Reduced network overhead
- Memory-efficient operations

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [Link to docs]
- Issues: GitHub Issues
- Community: Discord/Telegram

## Version History

- 1.0.9: Added comprehensive testing and enhanced error handling
- 1.0.8: Improved representative management
- 1.0.7: Enhanced transaction validation
- 1.0.6: Added work generation optimization
- 1.0.5: Initial release 