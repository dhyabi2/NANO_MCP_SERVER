const http = require('http');

const data = JSON.stringify({
    account: "nano_3ri1mmjo7p7yonn9ynf836y6tkr4bsp6c7ozgzkrzceo6m1qpq83rppcttkj",
    privateKey: "3ff30bb04a99a405408a8b6a9d9f5e48f2c10bb223e53545e14dab9783a996c5"
});

const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/receive-pending',  // No trailing slash
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log('Sending request to:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Request data:', data);

const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);

    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        try {
            const jsonResponse = JSON.parse(responseData);
            console.log('Response:', JSON.stringify(jsonResponse, null, 2));
        } catch (error) {
            console.log('Raw response:', responseData);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();