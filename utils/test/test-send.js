const { NanoTransactions } = require('nano-mcp/dist/utils/nano-transactions');

// Mock config object for testing
const mockConfig = {
    getNanoConfig: () => ({
        rpcUrl: 'https://rpc.nano.to',
        rpcKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
        gpuKey: '',
        defaultRepresentative: 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4'
    }),
    validateConfig: () => []
};

// Helper function to wait and check balance
async function waitForBalance(nanoTx, address, timeoutSeconds = 120) {
    console.log(`\nWaiting up to ${timeoutSeconds} seconds for funds...`);
    const startTime = Date.now();
    const endTime = startTime + (timeoutSeconds * 1000);

    while (Date.now() < endTime) {
        const secondsLeft = Math.round((endTime - Date.now()) / 1000);
        console.log(`${secondsLeft} seconds remaining...`);

        const checkBalance = await nanoTx.makeRequest('account_balance', {
            account: address
        });

        // If there are pending funds, receive them
        if (checkBalance.pending !== '0' || checkBalance.receivable !== '0') {
            console.log('\nPending funds detected!');
            return checkBalance;
        }

        // Wait 10 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    return null;
}

async function testSendScenario() {
    console.log('Starting NANO send test scenario...');
    
    // Initialize source wallet
    const sourceWallet = {
        seed: '4479c1cd3ba579b541995111459177e5c49765dab19eaa0062cd659b44a2021b',
        account: 'nano_31f9ptrsorqactjzqep53iixe5kdrbzbkuobz8w1wg7uabzgfhcpxbc4ssgu',
        privateKey: 'adaf9e5f8d619b4fa92ddefae84adc07a50b79ff158405aa8b77920e649e44cc'
    };
    
    console.log('Source wallet address:', sourceWallet.account);
    
    // Generate destination wallet
    const destinationWallet = await new NanoTransactions({}, mockConfig).generateWallet();
    console.log('Generated destination wallet:', destinationWallet.address);
    
    // Check initial balances
    console.log('\nChecking initial balances...');
    const sourceBalance = await new NanoTransactions({}, mockConfig).makeRequest('account_balance', {
        account: sourceWallet.account
    });
    console.log('Source account balance:', sourceBalance);
    
    // Send funds to destination
    console.log('\nSending funds to destination...');
    const nanoTransactions = new NanoTransactions({}, mockConfig);
    const sendAmount = '10000000000000000000000000'; // 0.00001 NANO
    const sendResult = await nanoTransactions.sendTransaction(
        sourceWallet.account,
        sourceWallet.privateKey,
        destinationWallet.address,
        sendAmount
    );
    console.log('Send result:', sendResult);
    
    // Check final balances
    console.log('\nChecking final balances...');
    const finalSourceBalance = await nanoTransactions.makeRequest('account_balance', {
        account: sourceWallet.account
    });
    const finalDestBalance = await nanoTransactions.makeRequest('account_balance', {
        account: destinationWallet.address
    });
    
    console.log('Final source balance:', finalSourceBalance);
    console.log('Final destination balance:', finalDestBalance);
    
    console.log('\nTest completed.');
}

// Run the test
testSendScenario().catch(console.error); 