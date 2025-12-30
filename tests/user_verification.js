const { NanoMCPServer } = require('../src/server');

// User provided credentials
const USER_WALLET = {
    address: "nano_35jookk6m8yx5sei1x4x4ixoqg54iw3dfjczd9f89eborcjxb16wisbbquza",
    privateKey: "55496ae.",
    publicKey: "8e35aca4499bdd1e5900745d143b5bb8628702b6c55f59da63b135c2a3d4809c"
};

async function runVerification() {
    console.log("Starting verification with user wallet...");
    
    const server = new NanoMCPServer({
        transport: 'stdio'
    });

    // Helper to send request
    async function sendRequest(method, params) {
        const request = {
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: Date.now()
        };
        console.log(`\n--- Calling ${method} ---`);
        try {
            const response = await server.handleRequest(request);
            console.log('Response:', JSON.stringify(response, null, 2));
            if (response.error) {
                console.error('FAILED:', response.error.message);
            } else {
                console.log('SUCCESS');
            }
            return response;
        } catch (error) {
            console.error('CRITICAL ERROR:', error);
        }
    }

    // 1. Check Balance
    await sendRequest('getBalance', { address: USER_WALLET.address });

    // 2. Check Account Info
    await sendRequest('getAccountInfo', { address: USER_WALLET.address });

    // 3. Check Account Status (Comprehensive)
    await sendRequest('getAccountStatus', { address: USER_WALLET.address });

    // 4. Check Pending Blocks
    await sendRequest('getPendingBlocks', { address: USER_WALLET.address });

    // 5. Generate QR Code (Offline op)
    await sendRequest('generateQrCode', { 
        address: USER_WALLET.address, 
        amount: "0.1" 
    });

    // 6. Test conversion
    await sendRequest('convertBalance', {
        amount: "1",
        from: "nano",
        to: "raw"
    });

    console.log("\nVerification complete.");
}

runVerification().catch(console.error);

