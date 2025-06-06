import http from 'http';

// MCPRequest class definition
export class MCPRequest {
    constructor(method, params) {
        this.method = method;
        this.params = params;
    }
}

export class MCPServer {
    constructor(config) {
        this.config = config;
        this.handlers = new Map();
        this.port = process.env.PORT || 3000;
        console.log('MCPServer initialized with config:', config);
    }

    setRequestHandler(method, handler) {
        console.log('Registering handler for method:', method);
        this.handlers.set(method, handler);
    }

    async start() {
        return new Promise((resolve, reject) => {
            try {
                console.log('Starting MCPServer...');
                const server = http.createServer((req, res) => {
                    console.log('Received request:', req.method, req.url);
                    
                    if (req.method === 'POST') {
                        let body = '';
                        req.on('data', chunk => body += chunk);
                        req.on('end', async () => {
                            try {
                                console.log('Received request body:', body);
                                const request = JSON.parse(body);
                                
                                if (!request.method) {
                                    throw new Error('Method is required');
                                }

                                const handler = this.handlers.get(request.method);
                                if (!handler) {
                                    throw new Error(`Method ${request.method} not found`);
                                }

                                const result = await handler(request.params || {});
                                
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: true,
                                    result
                                }));
                            } catch (error) {
                                console.error('Error processing request:', error);
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: error.message
                                }));
                            }
                        });
                    } else {
                        res.writeHead(405, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: 'Method not allowed'
                        }));
                    }
                });

                server.listen(this.port, () => {
                    console.log(`MCPServer listening on port ${this.port}`);
                    resolve();
                });

                server.on('error', (error) => {
                    console.error('Server error:', error);
                    reject(error);
                });

            } catch (error) {
                console.error('Failed to start server:', error);
                reject(error);
            }
        });
    }
} 