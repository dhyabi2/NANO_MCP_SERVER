const { NanoMCPServer } = require('nano-mcp');

class SimpleNanoServer extends NanoMCPServer {
  constructor() {
    const config = {
      name: 'Simple Nano Server',
      description: 'A simple Nano MCP server implementation',
      version: '1.0.0',
      author: 'Example Author'
    };

    super(config);
  }

  // Implement required abstract methods
  async executeTool(name, args) {
    switch (name) {
      case 'generateWallet':
        return this.walletService.generateWallet();
      case 'getBalance':
        return this.walletService.getBalance(args.address);
      default:
        throw new Error(`Tool not implemented: ${name}`);
    }
  }

  async executePrompt(name, input) {
    throw new Error('Prompts not implemented');
  }

  async fetchResource(uri) {
    throw new Error('Resource fetching not implemented');
  }
}

// Create and start the server
const server = new SimpleNanoServer();

// Start the server and handle errors
server.initialize()
  .then(() => {
    console.log('Server initialized successfully');
    
    // Example of generating a wallet
    return server.executeTool('generateWallet');
  })
  .then(wallet => {
    console.log('Generated wallet:', wallet);
    
    // Example of checking balance
    return server.executeTool('getBalance', { address: wallet.address });
  })
  .then(balance => {
    console.log('Balance:', balance);
  })
  .catch(error => {
    console.error('Error:', error);
  }); 