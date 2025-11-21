const { StdioTransport } = require('../src/stdio-transport');
const { EventEmitter } = require('events');
const { PassThrough } = require('stream');

// Mock Server
class MockServer {
    async handleRequest(request) {
        if (request.method === 'error') {
            throw new Error('Simulated error');
        }
        return {
            jsonrpc: "2.0",
            result: { success: true },
            id: request.id
        };
    }
}

async function runUnitTests() {
    console.log('Running StdioTransport Unit Tests...');

    // Test 1: Valid JSON handling
    await testValidJson();

    // Test 2: Invalid JSON handling
    await testInvalidJson();

    // Test 3: Split JSON handling (Partial messages)
    await testSplitJson();

    console.log('All Unit Tests PASSED');
}

function createTransport() {
    const mockServer = new MockServer();
    const input = new PassThrough();
    const output = new PassThrough();
    const transport = new StdioTransport(mockServer, input, output);
    transport.start();
    return { transport, input, output };
}

function testValidJson() {
    return new Promise((resolve, reject) => {
        console.log('Test 1: Valid JSON');
        const { input, output } = createTransport();

        let responseData = '';
        output.on('data', (chunk) => {
            responseData += chunk.toString();
            if (responseData.includes('\n')) {
                try {
                    const response = JSON.parse(responseData.trim());
                    if (response.result && response.result.success) {
                        console.log('  PASSED');
                        resolve();
                    } else {
                        reject(new Error('Invalid response content'));
                    }
                } catch (e) {
                    reject(e);
                }
            }
        });

        input.write(JSON.stringify({ jsonrpc: '2.0', method: 'test', id: 1 }) + '\n');
    });
}

function testInvalidJson() {
    return new Promise((resolve, reject) => {
        console.log('Test 2: Invalid JSON (Stability Check)');
        const { input, output } = createTransport();

        let responseData = '';
        output.on('data', (chunk) => {
            responseData += chunk.toString();
            if (responseData.includes('\n')) {
                try {
                    const response = JSON.parse(responseData.trim());
                    if (response.error && response.error.code === -32700) {
                        console.log('  PASSED');
                        resolve();
                    } else {
                        reject(new Error('Did not receive parse error'));
                    }
                } catch (e) {
                    reject(e);
                }
            }
        });

        input.write('INVALID JSON\n');
    });
}

function testSplitJson() {
    return new Promise((resolve, reject) => {
        console.log('Test 3: Split JSON (Readline handling)');
        const { input, output } = createTransport();

        let responseData = '';
        output.on('data', (chunk) => {
            responseData += chunk.toString();
            if (responseData.includes('\n')) {
                try {
                    const response = JSON.parse(responseData.trim());
                    if (response.result && response.result.success) {
                        console.log('  PASSED');
                        resolve();
                    } else {
                        reject(new Error('Invalid response content'));
                    }
                } catch (e) {
                    // Ignore partials? No, we expect full response eventually
                }
            }
        });

        // Send in parts
        // Note: readline parses lines. If we send partial line, it buffers.
        // If we send partial JSON across multiple lines, readline will emit multiple lines.
        // StdioTransport expects ONE LINE = ONE JSON REQUEST currently.
        // If a JSON object spans multiple lines, `JSON.parse` will fail on the first line.
        // However, the user query "improve error handing ... so that it wont crash" implies resilience.
        // If input is split across chunks but still on one line (or received as one line), readline handles it.
        // If input has newlines inside the JSON, standard `readline` emits them as separate lines.
        // The standard for MCP/LSP usually requires content-length headers OR single-line JSON.
        // Our StdioTransport assumes single-line JSON.
        
        // We test that split CHUNKS (stream buffering) are handled by readline correctly reassembling the line.
        input.write('{ "jsonrpc": "2.0", "me');
        setTimeout(() => {
            input.write('thod": "test", "id": 1 }\n');
        }, 100);
    });
}

runUnitTests().catch(err => {
    console.error('Tests FAILED:', err);
    process.exit(1);
});
