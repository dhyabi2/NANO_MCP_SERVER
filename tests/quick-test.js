const { NanoMCPServer } = require('../src/server');

const config = {
    port: 8080,
    rpcNodes: ['https://uk1.public.xnopay.com/proxy'],
    rpcKey: null,
    defaultRepresentative: 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf',
    transport: 'http'
};

console.log('Creating server...');
const server = new NanoMCPServer(config);

console.log('Starting HTTP server...');
server.startHttp();

console.log('Server should be running on http://localhost:8080');
console.log('Press Ctrl+C to exit');

