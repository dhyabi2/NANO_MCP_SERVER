const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NANO MCP Server API',
      version: '1.0.0',
      description: 'JSON-RPC 2.0 API for interacting with the NANO network',
    },
  },
  apis: ['./src/server.js'], // Path to the API docs
};

module.exports = swaggerJsdoc(options); 