const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// Test request
const testRequest = {
    jsonrpc: "2.0",
    method: "initialize",
    params: {},
    id: 1
};

// Test HTTP transport
async function testHttpTransport() {
    console.log('Testing HTTP transport...');
    
    // Start server
    require('../src/index.js');
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Make HTTP request
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('HTTP Response:', data);
                resolve(JSON.parse(data));
            });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify(testRequest));
        req.end();
    });
}

// Test stdio transport
async function testStdioTransport() {
    console.log('Testing stdio transport...');
    
    return new Promise((resolve, reject) => {
        const serverProcess = spawn('node', [path.join(__dirname, '../src/index.js')], {
            env: { ...process.env, MCP_TRANSPORT: 'stdio' },
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let output = '';
        let isServerReady = false;
        
        serverProcess.stdout.on('data', (data) => {
            output += data.toString();
            // Try to parse each line as we receive it
            const lines = output.split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const response = JSON.parse(line);
                        serverProcess.kill();
                        resolve(response);
                        return;
                    } catch (e) {
                        // Not a complete JSON response, continue collecting
                    }
                }
            }
        });
        
        serverProcess.stderr.on('data', (data) => {
            const message = data.toString();
            console.error('Server Error:', message);
            if (message.includes('MCP Server running in stdio mode')) {
                isServerReady = true;
                // Send test request once server is ready
                serverProcess.stdin.write(JSON.stringify(testRequest) + '\n');
            }
        });
        
        serverProcess.on('error', reject);
        
        // Set a longer timeout as fallback
        setTimeout(() => {
            serverProcess.kill();
            reject(new Error('Stdio transport test timed out after 5 seconds'));
        }, 5000);
    });
}

// Run tests
async function runTests() {
    try {
        // Test HTTP transport
        const httpResult = await testHttpTransport();
        console.log('HTTP transport test:', httpResult.result ? 'PASSED' : 'FAILED');
        
        // Wait a bit before testing stdio
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test stdio transport
        const stdioResult = await testStdioTransport();
        console.log('stdio transport test:', stdioResult.result ? 'PASSED' : 'FAILED');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
    
    // Exit after tests
    process.exit(0);
}

// Run the tests
runTests(); 