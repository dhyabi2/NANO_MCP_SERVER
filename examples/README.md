# Nano MCP Server Examples

This directory contains example implementations of the Nano MCP Server.

## Simple Nano Server Example

The `simple-nano-server.js` demonstrates basic usage of the nano-mcp package.

### Features Demonstrated
- Server initialization
- Request handler setup
- Basic RPC methods
- Graceful shutdown handling

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

4. Update the configuration:
Replace these values with your own:
```javascript
const server = new NanoMCP({
    publicKey: 'YOUR-PUBLIC-KEY',
    rpcKey: 'YOUR-RPC-KEY',
    port: 8000,
    host: '127.0.0.1'
});
```

5. Run the example:
```bash
node simple-nano-server.js
```

### Expected Output

The script will:
1. Start the NANO MCP Server
2. Set up the initialize request handler
3. Start listening for RPC requests
4. Handle graceful shutdown on CTRL+C

You should see output similar to:
```
Starting NANO MCP Server...
Server started successfully!
```

### Available Methods

The server supports the following RPC methods:
- `getBalance`
- `getAccountInfo`
- `getBlockCount`
- `getVersion`
- `convertToNano`
- `convertFromNano`

### Making RPC Requests

You can make RPC requests to the server using any HTTP client. Example using curl:

```bash
curl -X POST http://127.0.0.1:8000 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR-RPC-KEY" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
  }'
```

### Error Handling

The server includes proper error handling:
- Graceful shutdown on CTRL+C
- Error logging for server start failures
- Process exit with appropriate status codes

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