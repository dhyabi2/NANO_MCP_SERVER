import fetch from 'node-fetch';

async function verifyServer() {
    try {
        console.log('Attempting to connect to MCP server...');
        const response = await fetch('http://localhost:3000', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                method: 'initialize',
                params: {}
            })
        });

        const data = await response.json();
        console.log('Server response:', data);
        return true;
    } catch (error) {
        console.error('Failed to connect to server:', error.message);
        return false;
    }
}

verifyServer().then(isRunning => {
    if (!isRunning) {
        console.log('Server is not running or not responding');
        process.exit(1);
    }
}); 