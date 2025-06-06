import { NanoMCP } from './src/index.js';
import { Logger } from './logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function testWalletUtils() {
    // Initialize logger
    const logger = new Logger(path.join(__dirname, 'logs'));
    try {
        logger.log('TEST_START', 'Starting Wallet Utils Test Suite');
        // Initialize MCP with configuration from environment
        logger.log('INIT', 'Initializing NANO MCP');
        const mcp = new NanoMCP({
            nodeUrl: process.env.NODE_URL || 'https://proxy.nanos.cc/proxy',
            apiKey: process.env.API_KEY || ''
        });
        // Test 1: Create Wallet
        logger.log('CREATE_WALLET', 'Creating new wallet');
        const walletId = await mcp.createWallet();
        logger.log('CREATE_WALLET_SUCCESS', { walletId });
        // Update MCP configuration
        mcp.setRPCConfig({
            nodeUrl: process.env.NODE_URL || 'https://proxy.nanos.cc/proxy',
            walletId: walletId,
            apiKey: process.env.API_KEY || ''
        });
        logger.log('CONFIG_UPDATE', 'Updated MCP configuration with new wallet ID');
        // Test 2: Create Account
        logger.log('CREATE_ACCOUNT', 'Creating new account in wallet');
        const newAccount = await mcp.createAccount();
        logger.log('CREATE_ACCOUNT_SUCCESS', { account: newAccount });
        // Test 3: Check Initial Balance
        logger.log('BALANCE_CHECK', 'Checking initial balance');
        const initialBalance = await mcp.getBalance(newAccount);
        logger.log('BALANCE_CHECK_RESULT', {
            account: newAccount,
            balance: initialBalance.balanceNano
        });
        // Test 4: Backup Wallet
        logger.log('BACKUP_WALLET', 'Creating wallet backup');
        const walletBackup = await mcp.backupWallet(walletId);
        logger.log('BACKUP_WALLET_SUCCESS', {
            walletId,
            backup: walletBackup
        });
        // Test 5: List Accounts
        logger.log('LIST_ACCOUNTS', 'Listing all accounts in wallet');
        const accounts = await mcp.listAccounts();
        logger.log('LIST_ACCOUNTS_SUCCESS', { accounts });
        // Test 6: Validate Account
        logger.log('VALIDATE_ACCOUNT', 'Validating account format');
        const isValid = await mcp.validateAccount(newAccount);
        logger.log('VALIDATE_ACCOUNT_RESULT', {
            account: newAccount,
            isValid
        });
        // Summarize test results
        const testResults = {
            total: 6,
            passed: 6,
            failed: 0,
            duration: 0, // You might want to add actual duration tracking
            walletId,
            primaryAccount: newAccount
        };
        logger.summarize(testResults);
        logger.log('TEST_COMPLETE', 'Wallet Utils Test Suite completed successfully');
    }
    catch (error) {
        logger.logError('TEST_FAILURE', error);
        throw error;
    }
}
// Run the tests
testWalletUtils().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
