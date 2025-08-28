const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { wallet, tools, block } = require('nanocurrency-web');
const https = require('https');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple RPC call function
async function makeRPCCall(action, params = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            action,
            ...params,
            key: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23'
        });

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
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (error) {
                    reject(new Error('Failed to parse RPC response'));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Single endpoint for receiving pending transactions
app.post('/receive-pending', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        const { account, privateKey } = req.body;

        if (!account || !privateKey) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: account and privateKey'
            });
        }

        // Get account info
        let accountInfo;
        try {
            accountInfo = await makeRPCCall('account_info', { account });
        } catch (error) {
            accountInfo = null; // Account might not exist yet
        }

        // Get pending blocks
        const pending = await makeRPCCall('pending', {
            account,
            count: '100',
            source: 'true'
        });

        console.log('Pending blocks:', pending);

        const results = {
            processed: [],
            failed: [],
            total: 0,
            successful: 0,
            failed_count: 0
        };

        if (pending.blocks && Object.keys(pending.blocks).length > 0) {
            results.total = Object.keys(pending.blocks).length;

            for (const [hash, blockInfo] of Object.entries(pending.blocks)) {
                try {
                    const isNewAccount = !accountInfo || accountInfo.error;
                    const workHash = isNewAccount ? 
                        tools.addressToPublicKey(account) : 
                        accountInfo.frontier;

                    // Generate work
                    const workResult = await makeRPCCall('work_generate', {
                        hash: workHash,
                        difficulty: isNewAccount ? 'fffffe0000000000' : 'fffffff800000000'
                    });

                    if (!workResult.work) {
                        throw new Error('Failed to generate work');
                    }

                    // Create block data
                    const blockData = {
                        walletBalanceRaw: isNewAccount ? '0' : accountInfo.balance,
                        toAddress: account,
                        representativeAddress: account,
                        frontier: isNewAccount ? '0'.repeat(64) : accountInfo.frontier,
                        transactionHash: hash,
                        amountRaw: blockInfo.amount,
                        work: workResult.work
                    };

                    // Sign and process the block
                    const signedBlock = block.receive(blockData, privateKey);
                    const processResult = await makeRPCCall('process', {
                        json_block: 'true',
                        subtype: isNewAccount ? 'open' : 'receive',
                        block: signedBlock
                    });

                    results.processed.push({
                        hash,
                        amount: blockInfo.amount,
                        result: processResult
                    });
                    results.successful++;

                    // Update account info for next block
                    if (processResult.hash) {
                        accountInfo = await makeRPCCall('account_info', { account });
                    }
                } catch (error) {
                    results.failed.push({
                        hash,
                        amount: blockInfo.amount,
                        error: error.message
                    });
                    results.failed_count++;
                }
            }
        }

        res.json({
            success: true,
            ...results
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
const port = 8080;
app.listen(port, () => {
    console.log(`Test server running on port ${port}`);
    console.log('Available routes:', app._router.stack
        .filter(r => r.route)
        .map(r => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`));
});