/**
 * Test Script for JSON Schema Endpoints
 * Tests all 9 new schema endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:8080';

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

// Test functions
async function runTests() {
    console.log('🧪 Testing JSON Schema Endpoints\n');
    console.log('=' .repeat(80));
    
    let passed = 0;
    let failed = 0;

    // Test 1: GET /schema/metadata
    try {
        console.log('\n📋 Test 1: GET /schema/metadata');
        const result = await makeRequest('/schema/metadata');
        if (result.status === 200 && result.data.schemaVersion) {
            console.log('✅ PASS - Metadata retrieved');
            console.log(`   - Schema Version: ${result.data.schemaVersion}`);
            console.log(`   - Total Tools: ${result.data.totalTools}`);
            console.log(`   - Total Errors: ${result.data.totalErrorCodes}`);
            console.log(`   - AI Optimized: ${result.data.aiAgentOptimized}`);
            passed++;
        } else {
            console.log('❌ FAIL - Invalid response');
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL - ' + error.message);
        failed++;
    }

    // Test 2: GET /schema
    try {
        console.log('\n📋 Test 2: GET /schema (Complete Schema)');
        const result = await makeRequest('/schema');
        if (result.status === 200 && result.data.tools && result.data.tools.length > 0) {
            console.log('✅ PASS - Complete schema retrieved');
            console.log(`   - Tools defined: ${result.data.tools.length}`);
            console.log(`   - Schema version: ${result.data.version}`);
            console.log(`   - Has error schema: ${!!result.data.errorSchema}`);
            passed++;
        } else {
            console.log('❌ FAIL - Invalid schema');
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL - ' + error.message);
        failed++;
    }

    // Test 3: GET /schema/tools/sendTransaction
    try {
        console.log('\n📋 Test 3: GET /schema/tools/sendTransaction');
        const result = await makeRequest('/schema/tools/sendTransaction');
        if (result.status === 200 && result.data.name === 'sendTransaction') {
            console.log('✅ PASS - Tool schema retrieved');
            console.log(`   - Category: ${result.data.category}`);
            console.log(`   - Required params: ${result.data.inputSchema.required.join(', ')}`);
            console.log(`   - Examples: ${result.data.examples.length}`);
            console.log(`   - Performance notes: ${!!result.data.performanceNotes}`);
            passed++;
        } else {
            console.log('❌ FAIL - Invalid tool schema');
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL - ' + error.message);
        failed++;
    }

    // Test 4: GET /schema/tools/invalidTool (should fail gracefully)
    try {
        console.log('\n📋 Test 4: GET /schema/tools/invalidTool (Error Handling)');
        const result = await makeRequest('/schema/tools/invalidTool');
        if (result.status === 404 && result.data.error && result.data.availableTools) {
            console.log('✅ PASS - Error handled gracefully');
            console.log(`   - Error message: "${result.data.error}"`);
            console.log(`   - Available tools provided: ${result.data.availableTools.length}`);
            passed++;
        } else {
            console.log('❌ FAIL - Error not handled properly');
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL - ' + error.message);
        failed++;
    }

    // Test 5: GET /schema/category/transaction
    try {
        console.log('\n📋 Test 5: GET /schema/category/transaction');
        const result = await makeRequest('/schema/category/transaction');
        if (result.status === 200 && result.data.tools && result.data.category === 'transaction') {
            console.log('✅ PASS - Category tools retrieved');
            console.log(`   - Category: ${result.data.category}`);
            console.log(`   - Tools in category: ${result.data.count}`);
            console.log(`   - Tools: ${result.data.tools.map(t => t.name).join(', ')}`);
            passed++;
        } else {
            console.log('❌ FAIL - Invalid category response');
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL - ' + error.message);
        failed++;
    }

    // Test 6: GET /schema/examples/generateWallet
    try {
        console.log('\n📋 Test 6: GET /schema/examples/generateWallet');
        const result = await makeRequest('/schema/examples/generateWallet');
        if (result.status === 200 && result.data.examples && result.data.examples.length > 0) {
            console.log('✅ PASS - Examples retrieved');
            console.log(`   - Tool: ${result.data.tool}`);
            console.log(`   - Number of examples: ${result.data.examples.length}`);
            console.log(`   - Has request: ${!!result.data.examples[0].request}`);
            console.log(`   - Has response: ${!!result.data.examples[0].response}`);
            passed++;
        } else {
            console.log('❌ FAIL - Invalid examples response');
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL - ' + error.message);
        failed++;
    }

    // Test 7: GET /schema/errors
    try {
        console.log('\n📋 Test 7: GET /schema/errors');
        const result = await makeRequest('/schema/errors');
        if (result.status === 200 && result.data.errorCodes && result.data.count) {
            console.log('✅ PASS - Error codes retrieved');
            console.log(`   - Total error codes: ${result.data.count}`);
            console.log(`   - Has error schema: ${!!result.data.errorSchema}`);
            console.log(`   - Sample codes: ${result.data.errorCodes.slice(0, 5).join(', ')}...`);
            passed++;
        } else {
            console.log('❌ FAIL - Invalid error codes response');
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL - ' + error.message);
        failed++;
    }

    // Test 8: POST /schema/validate/sendTransaction (valid params)
    try {
        console.log('\n📋 Test 8: POST /schema/validate/sendTransaction (Valid Params)');
        const params = {
            fromAddress: 'nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn',
            toAddress: 'nano_1x7biz69cem95oo7gxkdkdbxsfs6ixkxx833fz3ps9qxh3uofa1hr8ejkizd',
            amountRaw: '1000000000000000000000000000',
            privateKey: '9f0e444c69f77a49bd0be89db92c38fe713e0963165cca12faf5712d7657120f'
        };
        const result = await makeRequest('/schema/validate/sendTransaction', 'POST', params);
        if (result.status === 200 && result.data.validation) {
            console.log('✅ PASS - Parameter validation works');
            console.log(`   - Valid: ${result.data.validation.valid}`);
            console.log(`   - Errors: ${result.data.validation.errors.length}`);
            passed++;
        } else {
            console.log('❌ FAIL - Invalid validation response');
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL - ' + error.message);
        failed++;
    }

    // Test 9: POST /schema/validate/sendTransaction (invalid params)
    try {
        console.log('\n📋 Test 9: POST /schema/validate/sendTransaction (Invalid Params)');
        const params = {
            fromAddress: 'invalid_address',
            toAddress: 'nano_1x7b...',
            amountRaw: '100',
            privateKey: 'short'
        };
        const result = await makeRequest('/schema/validate/sendTransaction', 'POST', params);
        if (result.status === 200 && result.data.validation && !result.data.validation.valid) {
            console.log('✅ PASS - Invalid params detected');
            console.log(`   - Valid: ${result.data.validation.valid}`);
            console.log(`   - Errors found: ${result.data.validation.errors.length}`);
            console.log(`   - Sample error: "${result.data.validation.errors[0]}"`);
            passed++;
        } else {
            console.log('❌ FAIL - Should have detected invalid params');
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL - ' + error.message);
        failed++;
    }

    // Test 10: GET /openapi.json
    try {
        console.log('\n📋 Test 10: GET /openapi.json');
        const result = await makeRequest('/openapi.json');
        if (result.status === 200 && result.data.openapi && result.data.info) {
            console.log('✅ PASS - OpenAPI spec retrieved');
            console.log(`   - OpenAPI version: ${result.data.openapi}`);
            console.log(`   - API title: ${result.data.info.title}`);
            console.log(`   - API version: ${result.data.info.version}`);
            console.log(`   - Paths defined: ${Object.keys(result.data.paths).length}`);
            passed++;
        } else {
            console.log('❌ FAIL - Invalid OpenAPI spec');
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL - ' + error.message);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 TEST SUMMARY');
    console.log(`   Total Tests: ${passed + failed}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All JSON Schema endpoints working perfectly!');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the server logs.');
    }

    console.log('\n' + '='.repeat(80));
    process.exit(failed === 0 ? 0 : 1);
}

// Wait for server to be ready
console.log('⏳ Waiting for server to be ready...\n');
setTimeout(runTests, 2000);

