import dotenv from 'dotenv';
import { WalletService } from 'nano-mcp';

dotenv.config();

async function testWallet() {
    try {
        console.log('Initializing WalletService...');
        const walletService = new WalletService();
        
        // Generate a new wallet
        console.log('\nGenerating new wallet...');
        const wallet = await walletService.generateWallet();
        
        console.log('\nWallet generated successfully:');
        console.log('Address:', wallet.address);
        console.log('Public Key:', wallet.publicKey);
        
        // Check balance
        console.log('\nChecking balance...');
        const balance = await walletService.getBalance(wallet.address);
        console.log('Balance:', balance);
        
        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

console.log('Starting NANO MCP Test...');
testWallet(); 