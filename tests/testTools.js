const fetch = require('node-fetch');

async function testToolsList() {
    try {
        const response = await fetch('http://localhost:8080/rpc', {
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

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testToolsList(); 