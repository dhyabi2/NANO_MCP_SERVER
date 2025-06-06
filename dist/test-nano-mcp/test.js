import { NanoMCP } from '@chainreactionom/nano-mcp-server/dist/mcp.js';
async function testNanoMCP() {
    const mcp = new NanoMCP({
        nodeUrl: 'https://proxy.nanos.cc/proxy',
        // Note: For wallet operations (send/receive) you'll need to set your wallet ID
        // walletId: 'YOUR_WALLET_ID'
    });
    try {
        // Test getVersion
        const version = await mcp.getVersion();
        console.log('Node Version:', version);
        // Test getBlockCount
        const blockCount = await mcp.getBlockCount();
        console.log('Block Count:', blockCount);
        // Test getBalance for a known account
        const account = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
        const balance = await mcp.getBalance(account);
        console.log('Account Balance:', balance);
        // Test conversion utilities
        const rawAmount = '1000000000000000000000000000000'; // 1 NANO in raw
        const nanoAmount = mcp.convertToNano(rawAmount);
        console.log('Converted to NANO:', nanoAmount);
        const backToRaw = mcp.convertFromNano(nanoAmount);
        console.log('Converted back to raw:', backToRaw);
        // The following operations require a configured wallet
        if (process.env.WALLET_ID) {
            // Create a new account
            const newAccount = await mcp.createAccount();
            console.log('New Account Created:', newAccount);
            // Send NANO (example)
            const sendResult = await mcp.send('nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3', newAccount, '0.001');
            console.log('Send Result:', sendResult);
            // Receive pending blocks
            const receiveResult = await mcp.receiveAll(newAccount);
            console.log('Receive Result:', receiveResult);
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}
testNanoMCP();
