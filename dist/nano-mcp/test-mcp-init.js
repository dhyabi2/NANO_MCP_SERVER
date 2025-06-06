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
        // Try to parse complete JSON objects
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (line) {
                try {
                    const response = JSON.parse(line);
                    console.log('Server Response:', JSON.stringify(response, null, 2));
                }
                catch (e) {
                    console.log('Server Output:', line);
                }
            }
        }
    });
    try {
        // Wait for server to start
        await delay(1000);
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
        // Send listTools request
        console.log('\nSending listTools request...');
        const listToolsRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'listTools'
        };
        serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
        // Wait for response
        await delay(1000);
        // Test nano_account_balance tool
        console.log('\nTesting nano_account_balance tool...');
        const balanceRequest = {
            jsonrpc: '2.0',
            id: 3,
            method: 'callTool',
            params: {
                name: 'nano_account_balance',
                arguments: {
                    account: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3',
                    unit: 'NANO'
                }
            }
        };
        serverProcess.stdin.write(JSON.stringify(balanceRequest) + '\n');
        // Wait for response
        await delay(2000);
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        // Cleanup
        serverProcess.kill();
        process.exit();
    }
}
// Handle process termination
process.on('SIGINT', () => {
    process.exit();
});
// Run the test
main().catch(console.error);
