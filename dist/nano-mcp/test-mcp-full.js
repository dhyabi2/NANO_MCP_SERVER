import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Path to the built MCP server
const MCP_SERVER_PATH = join(__dirname, 'dist', 'index.js');
// Create a promise-based delay function
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
// Test account and block hash for testing
const TEST_ACCOUNT = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
const TEST_BLOCK = '023B94B7D27B311666C8636954FE17F1FD2EAA97A8BAC27DE5084FBBD5C6B02C';
async function main() {
    // Spawn the MCP server as a child process
    const serverProcess = spawn('node', [MCP_SERVER_PATH], {
        stdio: ['pipe', 'pipe', 'inherit']
    });
    // Buffer to store incomplete JSON data
    let buffer = '';
    // Handle server responses
    serverProcess.stdout.on('data', (data) => {
        buffer += data.toString();
        try {
            // Try to parse complete JSON messages
            const messages = buffer.split('\n').filter(Boolean);
            buffer = messages.pop() || '';
            for (const message of messages) {
                const response = JSON.parse(message);
                console.log('Received response:', JSON.stringify(response, null, 2));
            }
        }
        catch (error) {
            // Incomplete JSON, continue buffering
        }
    });
    try {
        // Initialize connection
        console.log('\nSending initialize request...');
        const initializeRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2025-03-26',
                clientInfo: {
                    name: 'nano-mcp-test',
                    version: '1.0.0'
                },
                capabilities: {
                    tools: {}
                }
            }
        };
        serverProcess.stdin.write(JSON.stringify(initializeRequest) + '\n');
        // Wait for response
        await delay(1000);
        // List available tools
        console.log('\nSending listTools request...');
        const listToolsRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'listTools'
        };
        serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
        // Wait for response
        await delay(1000);
        // Test nano_account_balance
        console.log('\nTesting nano_account_balance...');
        const balanceRequest = {
            jsonrpc: '2.0',
            id: 3,
            method: 'callTool',
            params: {
                name: 'nano_account_balance',
                arguments: {
                    account: TEST_ACCOUNT,
                    unit: 'NANO'
                }
            }
        };
        serverProcess.stdin.write(JSON.stringify(balanceRequest) + '\n');
        // Wait for response
        await delay(1000);
        // Test nano_account_info
        console.log('\nTesting nano_account_info...');
        const infoRequest = {
            jsonrpc: '2.0',
            id: 4,
            method: 'callTool',
            params: {
                name: 'nano_account_info',
                arguments: {
                    account: TEST_ACCOUNT
                }
            }
        };
        serverProcess.stdin.write(JSON.stringify(infoRequest) + '\n');
        // Wait for response
        await delay(1000);
        // Test nano_block_info
        console.log('\nTesting nano_block_info...');
        const blockRequest = {
            jsonrpc: '2.0',
            id: 5,
            method: 'callTool',
            params: {
                name: 'nano_block_info',
                arguments: {
                    hash: TEST_BLOCK
                }
            }
        };
        serverProcess.stdin.write(JSON.stringify(blockRequest) + '\n');
        // Wait for response
        await delay(1000);
        // Test nano_block_count
        console.log('\nTesting nano_block_count...');
        const countRequest = {
            jsonrpc: '2.0',
            id: 6,
            method: 'callTool',
            params: {
                name: 'nano_block_count',
                arguments: {}
            }
        };
        serverProcess.stdin.write(JSON.stringify(countRequest) + '\n');
        // Wait for response
        await delay(1000);
        // Test nano_version
        console.log('\nTesting nano_version...');
        const versionRequest = {
            jsonrpc: '2.0',
            id: 7,
            method: 'callTool',
            params: {
                name: 'nano_version',
                arguments: {}
            }
        };
        serverProcess.stdin.write(JSON.stringify(versionRequest) + '\n');
        // Wait for final response
        await delay(1000);
        // Test error handling with invalid account
        console.log('\nTesting error handling with invalid account...');
        const invalidRequest = {
            jsonrpc: '2.0',
            id: 8,
            method: 'callTool',
            params: {
                name: 'nano_account_balance',
                arguments: {
                    account: 'invalid_account'
                }
            }
        };
        serverProcess.stdin.write(JSON.stringify(invalidRequest) + '\n');
        // Wait for error response
        await delay(1000);
        console.log('\nTests completed. Terminating server...');
        serverProcess.kill();
    }
    catch (error) {
        console.error('Test error:', error);
        serverProcess.kill();
        process.exit(1);
    }
}
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
