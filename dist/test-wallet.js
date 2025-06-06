import { NanoMCP } from '@chainreactionom/nano-mcp-server';
async function testWalletOperations() {
    console.log('\n=== NANO Wallet Operations Test ===\n');
    try {
        // Initialize MCP
        const mcp = new NanoMCP({
            nodeUrl: 'https://proxy.nanos.cc/proxy'
        });
        // Step 1: Create new wallet
        console.log('Creating new wallet...');
        const walletId = await mcp.createWallet();
        console.log('New wallet created! Wallet ID:', walletId);
        // Update MCP configuration with the new wallet ID
        mcp.setRPCConfig({
            nodeUrl: 'https://proxy.nanos.cc/proxy',
            walletId: walletId
        });
        // Step 2: Create new account in the wallet
        console.log('\nCreating new account in wallet...');
        const newAccount = await mcp.createAccount();
        console.log('New account created:', newAccount);
        // Step 3: Wait for funding
        console.log('\nTo continue testing, please send exactly 0.0001 NANO to this address:');
        console.log(newAccount);
        console.log('\nWaiting for funds...');
        let funded = false;
        while (!funded) {
            const balance = await mcp.getBalance(newAccount);
            if (parseFloat(balance.balanceNano) > 0) {
                console.log('\nFunds received!');
                console.log('Current balance:', balance.balanceNano, 'NANO');
                funded = true;
            }
            else {
                process.stdout.write('.');
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
            }
        }
        // Step 4: Test send operation
        console.log('\nTesting send operation...');
        const destinationAccount = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
        const sendAmount = '0.00005'; // Send half of received amount
        console.log(`Sending ${sendAmount} NANO to ${destinationAccount}...`);
        const sendResult = await mcp.send(destinationAccount, newAccount, sendAmount);
        console.log('Send successful! Block hash:', sendResult);
        // Step 5: Test receive operations
        console.log('\nTesting receive operations...');
        const receiveResult = await mcp.receiveAll(newAccount);
        console.log('Receive all result:', receiveResult);
        // Final balance check
        const finalBalance = await mcp.getBalance(newAccount);
        console.log('\nFinal account balance:', finalBalance.balanceNano, 'NANO');
        // Important: Save wallet backup
        const walletBackup = await mcp.backupWallet(walletId);
        console.log('\nWallet Backup (SAVE THIS):', walletBackup);
        console.log('\n=== Wallet Operations Test Complete ===');
        console.log('All operations completed successfully!');
        console.log('\nIMPORTANT: Save your wallet ID and backup for future use:');
        console.log('Wallet ID:', walletId);
    }
    catch (error) {
        console.error('\nError during wallet operations:', error);
    }
}
testWalletOperations();
