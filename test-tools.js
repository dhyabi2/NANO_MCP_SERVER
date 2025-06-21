const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testToolsList() {
    try {
        // Create logs directory if it doesn't exist
        const logsDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
        }

        // Test POST endpoint
        console.log('\nTesting POST endpoint...');
        const postResponse = await fetch('http://localhost:8080/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/list',
                id: 'test-1'
            })
        });

        const postData = await postResponse.json();
        
        // Format the POST output
        const postOutput = {
            timestamp: new Date().toISOString(),
            request: {
                jsonrpc: '2.0',
                method: 'tools/list',
                id: 'test-1'
            },
            response: postData
        };

        // Save POST response to log file
        const postLogFile = path.join(logsDir, `tools-list-post-${Date.now()}.json`);
        fs.writeFileSync(postLogFile, JSON.stringify(postOutput, null, 2));

        console.log('POST Response:', JSON.stringify(postData, null, 2));
        console.log(`POST output saved to: ${postLogFile}`);

        // Test GET endpoint
        console.log('\nTesting GET endpoint...');
        const getResponse = await fetch('http://localhost:8080/tools/list');
        const getData = await getResponse.json();

        // Format the GET output
        const getOutput = {
            timestamp: new Date().toISOString(),
            request: {
                method: 'GET',
                path: '/tools/list'
            },
            response: getData
        };

        // Save GET response to log file
        const getLogFile = path.join(logsDir, `tools-list-get-${Date.now()}.json`);
        fs.writeFileSync(getLogFile, JSON.stringify(getOutput, null, 2));

        console.log('GET Response:', JSON.stringify(getData, null, 2));
        console.log(`GET output saved to: ${getLogFile}`);

    } catch (error) {
        console.error('Error:', error);
        
        // Save error to log file
        const errorLog = path.join(logsDir, `tools-list-error-${Date.now()}.json`);
        fs.writeFileSync(errorLog, JSON.stringify({
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        }, null, 2));
        
        console.error(`Error log saved to: ${errorLog}`);
    }
}

testToolsList(); 