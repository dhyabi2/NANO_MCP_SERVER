# Nano MCP Server Examples

This directory contains example implementations of the Nano MCP Server.

## Simple Nano Server Example

The `simple-nano-server.js` demonstrates basic usage of the nano-mcp package.

### Features Demonstrated
- Server initialization
- Wallet generation
- Balance checking

### How to Run

1. First, install the required dependencies:
```bash
npm install nano-mcp
```

2. Create a new directory for your project:
```bash
mkdir my-nano-server
cd my-nano-server
```

3. Copy the `simple-nano-server.js` file into your project directory.

4. Run the example:
```bash
node simple-nano-server.js
```

### Expected Output

The script will:
1. Initialize the server
2. Generate a new wallet
3. Check the wallet's balance

You should see output similar to:
```
Server initialized successfully
Generated wallet: {
  address: "nano_...",
  privateKey: "...",
  publicKey: "..."
}
Balance: {
  balance: "0",
  pending: "0"
}
```

### Common Issues

1. If you see "TypeError: server.start is not a function", make sure you're using `server.initialize()` instead of `server.start()`.

2. If you get module not found errors, ensure you've installed the nano-mcp package:
```bash
npm install nano-mcp
```

### Additional Examples

For more advanced usage examples, check out:
- `example-mcp-server.ts` - A full TypeScript example with custom tools and prompts
- `wallet-test.js` - Examples of wallet operations
- `test-mcp.js` - Examples of MCP protocol usage 