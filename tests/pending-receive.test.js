const http = require('http');

async function testPendingReceive() {
    try {
        console.log('Starting Pending Receive Test...\n');

        // Use the provided test wallet
        const account = "nano_3ri1mmjo7p7yonn9ynf836y6tkr4bsp6c7ozgzkrzceo6m1qpq83rppcttkj";
        const privateKey = "xx";

        console.log('Using test wallet:');
        console.log('Account:', account);
        console.log('Private Key:', privateKey);

        // Make request to the pending receive endpoint
        const data = JSON.stringify({
            account,
            privateKey
        });

        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/pending/receive',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        console.log('\nSending request to:', `http://${options.hostname}:${options.port}${options.path}`);

        const response = await new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const jsonResponse = JSON.parse(responseData);
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: jsonResponse
                        });
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(data);
            req.end();
        });

        console.log('\nResponse Status:', response.statusCode);
        console.log('Response Headers:', response.headers);
        console.log('Response Body:', JSON.stringify(response.body, null, 2));

        if (response.statusCode === 200 && response.body.result.success) {
            console.log('\nTest completed successfully!');
            if (response.body.result.processed && response.body.result.processed.length > 0) {
                console.log('Processed blocks:', response.body.result.processed.length);
                console.log('Failed blocks:', response.body.result.failed_count);
            } else {
                console.log('No pending blocks to process');
            }
        } else {
            console.error('\nTest failed:', response.body.error || 'Unknown error');
            process.exit(1);
        }

    } catch (error) {
        console.error('\nTest failed with error:', error.message);
        process.exit(1);
    }
}

// Run the test
console.log('Starting Pending Receive Interface Test...\n');
testPendingReceive();
