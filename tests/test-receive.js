const https = require('https');
const { wallet, tools, block } = require('nanocurrency-web');

// Helper function to make RPC calls
async function makeRPCCall(action, params) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            action,
            ...params,
            key: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23'
        });

        console.log('Making RPC call:', JSON.parse(data));

        const options = {
            hostname: 'rpc.nano.to',
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonResponse = JSON.parse(responseData);
                    console.log('RPC Response:', jsonResponse);
                    resolve(jsonResponse);
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Helper function to wait for a specified time
function wait(minutes) {
    return new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
}

async function testReceiveScenario() {
    try {
        // Step 1: Generate wallet
        console.log('1. Generating new wallet...');
        
        // Generate a new wallet using nanocurrency-web
        const walletData = wallet.generateLegacy();
        const account = walletData.accounts[0].address;
        const privateKey = walletData.accounts[0].privateKey;
        const publicKey = walletData.accounts[0].publicKey;
        const seed = walletData.seed;
        
        console.log('\nWallet generated successfully!');
        console.log('Seed (KEEP THIS SAFE):', seed);
        console.log('Account Address:', account);
        console.log('Public Key:', publicKey);
        console.log('Private Key:', privateKey);

        // Step 2: Initialize the account
        console.log('\n2. Checking account info...');
        const initResult = await makeRPCCall('account_info', {
            account: account
        });
        
        if (initResult.error) {
            console.log('Account not yet initialized (This is normal for new accounts)');
        } else {
            console.log('Account info:', initResult);
        }

        // Step 3: Wait for funds
        console.log('\n3. Waiting for funds...');
        console.log(`Please send exactly 0.00001 NANO to this address:\n${account}`);
        console.log('\nWaiting 4 minutes for funds to arrive...');
        
        // Wait for 4 minutes
        for (let i = 0; i < 4; i++) {
            await wait(1);
            console.log(`${3 - i} minutes remaining...`);
            
            // Check for pending during wait
            const checkPending = await makeRPCCall('pending', {
                account: account,
                count: '1',
                source: 'true'
            });
            
            if (checkPending.blocks && Object.keys(checkPending.blocks).length > 0) {
                console.log('\nPending transaction detected!');
                break;
            }
        }

        // Step 4: Check for pending blocks
        console.log('\n4. Checking for pending blocks...');
        const pendingResult = await makeRPCCall('pending', {
            account: account,
            count: '1',
            source: 'true'
        });
        console.log('Pending blocks:', pendingResult);

        if (pendingResult.blocks && Object.keys(pendingResult.blocks).length > 0) {
            // Step 5: Generate work for receiving
            console.log('\n5. Generating work...');
            const workResult = await makeRPCCall('work_generate', {
                hash: publicKey, // For first receive, use public key as frontier
                key: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23'
            });
            console.log('Work generated:', workResult);

            if (!workResult.work) {
                throw new Error('Failed to generate work');
            }

            // Step 6: Process pending blocks
            console.log('\n6. Processing pending blocks...');
            for (const [hash, blockInfo] of Object.entries(pendingResult.blocks)) {
                // Convert raw amount to nano for display
                const rawToNanoResult = await makeRPCCall('raw_to_nano', {
                    amount: blockInfo.amount
                });
                console.log(`Receiving ${rawToNanoResult.nano} NANO from block ${hash}`);

                // Create and sign the receive block using nanocurrency-web
                const receiveBlockData = {
                    walletBalanceRaw: '0', // Initial balance is 0 for first receive
                    toAddress: account,
                    representativeAddress: account, // Using self as representative for test
                    frontier: '0000000000000000000000000000000000000000000000000000000000000000', // Genesis frontier for first receive
                    transactionHash: hash,
                    amountRaw: blockInfo.amount,
                    work: workResult.work
                };

                // Create and sign the block
                const signedBlock = block.receive(receiveBlockData, privateKey);

                // Process the signed block
                const processResult = await makeRPCCall('process', {
                    json_block: 'true',
                    subtype: 'receive',
                    block: signedBlock
                });
                console.log('Block processed:', processResult);
            }

            // Step 7: Final balance check
            console.log('\n7. Checking final balance...');
            const balanceResult = await makeRPCCall('account_balance', {
                account: account
            });
            
            if (balanceResult.balance) {
                const finalBalanceNano = await makeRPCCall('raw_to_nano', {
                    amount: balanceResult.balance
                });
                console.log('Final balance:', finalBalanceNano.nano, 'NANO');
            } else {
                console.log('Final balance:', balanceResult);
            }
        } else {
            console.log('No pending blocks found after waiting');
        }

    } catch (error) {
        console.error('\nError occurred during test:');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('RPC Response:', error.response.data);
        }
        throw error;
    }
}

// Run the test
console.log('Starting NANO receive test scenario...\n');
testReceiveScenario()
    .then(() => {
        console.log('\nTest completed successfully');
    })
    .catch(err => {
        console.error('\nTest failed with error:', err);
        process.exit(1);
    }); 