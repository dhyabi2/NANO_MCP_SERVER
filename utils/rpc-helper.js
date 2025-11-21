/**
 * RPC Helper Utility
 * Provides a simple wrapper for making RPC calls to Nano nodes
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Make an RPC call to a Nano node
 * @param {string} rpcUrl - The RPC node URL
 * @param {Object} params - RPC call parameters (should include 'action')
 * @param {string|null} rpcKey - Optional RPC key for authenticated endpoints
 * @returns {Promise<Object>} The RPC response
 */
async function makeRPCCall(rpcUrl, params, rpcKey = null) {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(rpcUrl);
            const isHttps = url.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            // Build request body
            const requestBody = { ...params };
            if (rpcKey) {
                requestBody.key = rpcKey;
            }

            const data = JSON.stringify(requestBody);

            console.log(`[RPC Helper] Making RPC call to ${rpcUrl}`);
            console.log(`[RPC Helper] Action: ${params.action}`);

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname || '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                },
                timeout: 30000 // 30 second timeout
            };

            const req = httpModule.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const jsonResponse = JSON.parse(responseData);
                        
                        if (jsonResponse.error) {
                            console.error(`[RPC Helper] RPC Error: ${jsonResponse.error}`);
                            reject(new Error(jsonResponse.error));
                        } else {
                            console.log(`[RPC Helper] RPC call successful`);
                            resolve(jsonResponse);
                        }
                    } catch (error) {
                        console.error(`[RPC Helper] Failed to parse response: ${error.message}`);
                        console.error(`[RPC Helper] Raw response: ${responseData}`);
                        reject(new Error(`Failed to parse RPC response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error(`[RPC Helper] Request error: ${error.message}`);
                reject(new Error(`RPC request failed: ${error.message}`));
            });

            req.on('timeout', () => {
                console.error(`[RPC Helper] Request timeout`);
                req.destroy();
                reject(new Error('RPC request timeout'));
            });

            req.write(data);
            req.end();

        } catch (error) {
            console.error(`[RPC Helper] Error setting up RPC call: ${error.message}`);
            reject(error);
        }
    });
}

/**
 * Make multiple RPC calls in parallel
 * @param {string} rpcUrl - The RPC node URL
 * @param {Array<Object>} callsParams - Array of RPC call parameters
 * @param {string|null} rpcKey - Optional RPC key
 * @returns {Promise<Array<Object>>} Array of RPC responses
 */
async function makeMultipleRPCCalls(rpcUrl, callsParams, rpcKey = null) {
    console.log(`[RPC Helper] Making ${callsParams.length} parallel RPC calls`);
    
    const promises = callsParams.map(params => 
        makeRPCCall(rpcUrl, params, rpcKey)
    );

    return Promise.all(promises);
}

/**
 * Make an RPC call with retry logic
 * @param {string} rpcUrl - The RPC node URL
 * @param {Object} params - RPC call parameters
 * @param {string|null} rpcKey - Optional RPC key
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} The RPC response
 */
async function makeRPCCallWithRetry(rpcUrl, params, rpcKey = null, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[RPC Helper] Attempt ${attempt}/${maxRetries}`);
            const result = await makeRPCCall(rpcUrl, params, rpcKey);
            return result;
        } catch (error) {
            lastError = error;
            console.error(`[RPC Helper] Attempt ${attempt} failed: ${error.message}`);
            
            if (attempt < maxRetries) {
                const delayMs = attempt * 1000; // Progressive delay: 1s, 2s, 3s
                console.log(`[RPC Helper] Retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    
    throw new Error(`RPC call failed after ${maxRetries} attempts: ${lastError.message}`);
}

module.exports = {
    makeRPCCall,
    makeMultipleRPCCalls,
    makeRPCCallWithRetry
};







