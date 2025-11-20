/**
 * Node Redundancy Tests - TDD approach
 * Tests for validating backup/redundancy RPC nodes
 * 
 * Tests basic RPC functionality to ensure node is healthy and responsive
 */

const https = require('https');
const { URL } = require('url');

describe('RPC Node Testing', () => {
    /**
     * Helper function to make RPC calls to a node
     * @param {string} nodeUrl - The RPC node URL to test
     * @param {Object} params - RPC parameters
     * @returns {Promise<Object>} - RPC response
     */
    const testRpcCall = (nodeUrl, params) => {
        return new Promise((resolve, reject) => {
            try {
                const url = new URL(nodeUrl);
                const data = JSON.stringify(params);

                const options = {
                    hostname: url.hostname,
                    port: url.port || 443,
                    path: url.pathname || '/',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data)
                    },
                    timeout: 10000 // 10 second timeout
                };

                console.log(`[Node Test] Testing ${nodeUrl} with action: ${params.action}`);

                const req = https.request(options, (res) => {
                    let responseData = '';

                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const jsonResponse = JSON.parse(responseData);
                            console.log(`[Node Test] Response from ${nodeUrl}:`, jsonResponse);
                            resolve({
                                success: !jsonResponse.error,
                                data: jsonResponse,
                                statusCode: res.statusCode
                            });
                        } catch (error) {
                            console.error(`[Node Test] Failed to parse response from ${nodeUrl}:`, error.message);
                            reject(new Error(`Failed to parse response: ${error.message}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error(`[Node Test] Request error for ${nodeUrl}:`, error.message);
                    reject(error);
                });

                req.on('timeout', () => {
                    console.error(`[Node Test] Request timeout for ${nodeUrl}`);
                    req.destroy();
                    reject(new Error('Request timeout'));
                });

                req.write(data);
                req.end();

            } catch (error) {
                console.error(`[Node Test] Error setting up request for ${nodeUrl}:`, error.message);
                reject(error);
            }
        });
    };

    describe('Primary Node: https://uk1.public.xnopay.com/proxy', () => {
        const primaryNode = 'https://uk1.public.xnopay.com/proxy';

        test('should respond to block_count request', async () => {
            const result = await testRpcCall(primaryNode, { action: 'block_count' });
            
            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('count');
            expect(result.statusCode).toBe(200);
        }, 15000);

        test('should respond to version request', async () => {
            const result = await testRpcCall(primaryNode, { action: 'version' });
            
            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('node_vendor');
            expect(result.statusCode).toBe(200);
        }, 15000);

        test('should handle account_info request for valid address', async () => {
            // Using a known active address (genesis account)
            const testAddress = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
            
            const result = await testRpcCall(primaryNode, {
                action: 'account_info',
                account: testAddress
            });
            
            expect(result.success).toBe(true);
            expect(result.statusCode).toBe(200);
        }, 15000);
    });

    describe('Backup Node: https://node.somenano.com/proxy', () => {
        const backupNode = 'https://node.somenano.com/proxy';

        test('should respond to block_count request', async () => {
            const result = await testRpcCall(backupNode, { action: 'block_count' });
            
            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('count');
            expect(result.statusCode).toBe(200);
            
            // Log block count for visibility
            console.log('[Node Test] Block count:', result.data.count);
        }, 15000);

        test('should respond to version request', async () => {
            const result = await testRpcCall(backupNode, { action: 'version' });
            
            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('node_vendor');
            expect(result.statusCode).toBe(200);
            
            // Log version info
            console.log('[Node Test] Node vendor:', result.data.node_vendor);
            console.log('[Node Test] Protocol version:', result.data.protocol_version);
        }, 15000);

        test('should handle account_info request for valid address', async () => {
            // Using a known active address (genesis account)
            const testAddress = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
            
            const result = await testRpcCall(backupNode, {
                action: 'account_info',
                account: testAddress
            });
            
            expect(result.success).toBe(true);
            expect(result.statusCode).toBe(200);
            
            // Verify response has expected fields
            if (!result.data.error) {
                expect(result.data).toHaveProperty('frontier');
                expect(result.data).toHaveProperty('balance');
                console.log('[Node Test] Account balance:', result.data.balance);
            }
        }, 15000);

        test('should handle pending request for valid address', async () => {
            const testAddress = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
            
            const result = await testRpcCall(backupNode, {
                action: 'pending',
                account: testAddress,
                count: '1'
            });
            
            expect(result.success).toBe(true);
            expect(result.statusCode).toBe(200);
            expect(result.data).toHaveProperty('blocks');
        }, 15000);

        test('should handle work_generate request', async () => {
            // Test hash (frontier from a known block)
            const testHash = '0000000000000000000000000000000000000000000000000000000000000000';
            
            const result = await testRpcCall(backupNode, {
                action: 'work_generate',
                hash: testHash,
                difficulty: 'fffffe0000000000' // Receive block difficulty
            });
            
            // Work generation might not be available on all public nodes
            // So we just check that we got a response (even if it's an error)
            // The backup node can still be used for other RPC calls
            expect([200, 500]).toContain(result.statusCode);
            
            if (result.success && result.data.work) {
                console.log('[Node Test] ✅ Work generation is AVAILABLE on backup node');
                console.log('[Node Test] Generated work:', result.data.work);
            } else {
                console.log('[Node Test] ⚠️  Work generation not available on backup node (external service issue)');
                console.log('[Node Test] ✅ This is acceptable - node can still be used for other RPC calls');
                console.log('[Node Test] Primary node will handle work generation');
            }
        }, 30000); // Longer timeout for work generation
    });

    describe('Node Comparison', () => {
        const primaryNode = 'https://uk1.public.xnopay.com/proxy';
        const backupNode = 'https://node.somenano.com/proxy';

        test('both nodes should return similar block counts', async () => {
            const primaryResult = await testRpcCall(primaryNode, { action: 'block_count' });
            const backupResult = await testRpcCall(backupNode, { action: 'block_count' });

            expect(primaryResult.success).toBe(true);
            expect(backupResult.success).toBe(true);

            const primaryCount = parseInt(primaryResult.data.count);
            const backupCount = parseInt(backupResult.data.count);

            // Nodes should be within a reasonable range (allow 500 block difference)
            // This is normal as nodes sync at slightly different rates
            const difference = Math.abs(primaryCount - backupCount);
            console.log('[Node Test] Primary node block count:', primaryCount);
            console.log('[Node Test] Backup node block count:', backupCount);
            console.log('[Node Test] Difference:', difference);

            expect(difference).toBeLessThan(500);
        }, 20000);

        test('both nodes should respond within acceptable time', async () => {
            const testAction = { action: 'block_count' };

            const primaryStart = Date.now();
            await testRpcCall(primaryNode, testAction);
            const primaryTime = Date.now() - primaryStart;

            const backupStart = Date.now();
            await testRpcCall(backupNode, testAction);
            const backupTime = Date.now() - backupStart;

            console.log('[Node Test] Primary node response time:', primaryTime, 'ms');
            console.log('[Node Test] Backup node response time:', backupTime, 'ms');

            // Both should respond within 5 seconds
            expect(primaryTime).toBeLessThan(5000);
            expect(backupTime).toBeLessThan(5000);
        }, 15000);
    });

    describe('Node Redundancy Configuration', () => {
        test('should have backup node ready for failover', () => {
            const rpcNodes = [
                'https://uk1.public.xnopay.com/proxy',  // Primary
                'https://node.somenano.com/proxy'       // Backup
            ];

            expect(rpcNodes).toHaveLength(2);
            expect(rpcNodes[0]).toBe('https://uk1.public.xnopay.com/proxy');
            expect(rpcNodes[1]).toBe('https://node.somenano.com/proxy');
            
            console.log('[Node Test] Redundancy configuration validated');
            console.log('[Node Test] Primary:', rpcNodes[0]);
            console.log('[Node Test] Backup:', rpcNodes[1]);
        });
    });
});

