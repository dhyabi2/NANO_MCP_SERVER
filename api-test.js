import fetch from 'node-fetch';

async function testEndpoints() {
    const url = 'http://localhost:3000';
    const headers = { 'Content-Type': 'application/json' };

    try {
        // Test initialize
        console.log('\nTesting initialize endpoint:');
        const initResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ method: 'initialize', params: {} })
        });
        console.log(await initResponse.json());

        // Test generateWallet
        console.log('\nTesting generateWallet endpoint:');
        const wallet1Response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ method: 'generateWallet', params: {} })
        });
        const wallet1 = await wallet1Response.json();
        console.log('Wallet 1:', wallet1);

        // Test getBalance
        console.log('\nTesting getBalance endpoint:');
        const balanceResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                method: 'getBalance', 
                params: { address: wallet1.address }
            })
        });
        console.log(await balanceResponse.json());

        // Generate second wallet
        console.log('\nGenerating second wallet:');
        const wallet2Response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ method: 'generateWallet', params: {} })
        });
        const wallet2 = await wallet2Response.json();
        console.log('Wallet 2:', wallet2);

        // Test sendTransaction
        console.log('\nTesting sendTransaction endpoint:');
        const sendResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                method: 'sendTransaction', 
                params: {
                    fromAddress: wallet1.address,
                    privateKey: wallet1.privateKey,
                    toAddress: wallet2.address,
                    amountRaw: '1000000000000000000000000000'  // 1 NANO
                }
            })
        });
        console.log(await sendResponse.json());

        // Test receivePending
        console.log('\nTesting receivePending endpoint:');
        const receiveResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                method: 'receivePending', 
                params: {
                    address: wallet2.address,
                    privateKey: wallet2.privateKey
                }
            })
        });
        console.log(await receiveResponse.json());

    } catch (error) {
        console.error('Error testing endpoints:', error);
    }
}

console.log('Starting NANO MCP API Tests...');
testEndpoints(); 