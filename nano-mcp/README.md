# NANO MCP Server

A Model Context Protocol (MCP) server implementation for interacting with the NANO (XNO) cryptocurrency network.

## Features

- Account operations (balance, info)
- Block operations (count)
- Network information
- Unit conversion utilities
- Real-time RPC interaction with NANO network
- Detailed logging of all RPC calls

## Installation

```bash
npm install @nano/mcp-server
```

## Usage

### As a Library

```typescript
import { NanoMCP } from '@nano/mcp-server';

const server = new NanoMCP();

// Get account balance
const balance = await server.getBalance('nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3');
console.log('Balance:', balance.balanceNano, 'NANO');
console.log('Pending:', balance.pendingNano, 'NANO');

// Get account info
const info = await server.getAccountInfo('nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3');
console.log('Account Info:', info);

// Get network block count
const blockCount = await server.getBlockCount();
console.log('Total Blocks:', blockCount.count);
console.log('Cemented Blocks:', blockCount.cemented);

// Convert between NANO and raw units
const rawAmount = server.convertFromNano('1.23');
console.log('1.23 NANO in raw:', rawAmount);

const nanoAmount = server.convertToNano('1000000000000000000000000000000');
console.log('Raw amount in NANO:', nanoAmount);
```

### As a Standalone Server

```bash
# Start the MCP server
npm start
```

## API Methods

### getBalance(account: string)
Returns the balance and pending amounts for a NANO account in NANO units.

### getAccountInfo(account: string)
Returns detailed information about a NANO account including frontier block, representative, and more.

### getBlockCount()
Returns the current network block count, including total, unchecked, and cemented blocks.

### getVersion()
Returns information about the connected NANO node version and network.

### convertToNano(rawAmount: string)
Converts a raw amount to NANO units.

### convertFromNano(nanoAmount: string)
Converts a NANO amount to raw units.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start in development mode
npm run dev
```

## Logging

All RPC calls are logged to `logs/rpc_calls.log` with detailed information including:
- Timestamp
- Action
- Parameters
- Response
- Duration
- Any errors

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## Resources

- [NANO Official Website](https://nano.org)
- [SomeNano Node](https://node.somenano.com)
- [MCP Documentation](https://modelcontextprotocol.io)
- [NANO RPC Documentation](https://docs.nano.org/commands/rpc-protocol/) 