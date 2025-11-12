/**
 * Schema Provider for NANO MCP Server
 * Provides JSON Schema access for AI agents to auto-discover capabilities
 */

const fs = require('fs');
const path = require('path');

class SchemaProvider {
    constructor() {
        this.schemaPath = path.join(__dirname, '../schemas/mcp-tools-schema.json');
        this.schema = null;
        this.loadSchema();
    }

    /**
     * Load the JSON Schema from file
     */
    loadSchema() {
        try {
            const schemaContent = fs.readFileSync(this.schemaPath, 'utf8');
            this.schema = JSON.parse(schemaContent);
            console.log('[SchemaProvider] JSON Schema loaded successfully');
        } catch (error) {
            console.error('[SchemaProvider] Failed to load schema:', error.message);
            this.schema = null;
        }
    }

    /**
     * Get the complete schema
     * @returns {Object} Full JSON Schema
     */
    getFullSchema() {
        if (!this.schema) {
            this.loadSchema();
        }
        return this.schema;
    }

    /**
     * Get schema for a specific tool
     * @param {string} toolName - Name of the tool
     * @returns {Object|null} Tool schema or null if not found
     */
    getToolSchema(toolName) {
        if (!this.schema || !this.schema.tools) {
            return null;
        }
        return this.schema.tools.find(tool => tool.name === toolName) || null;
    }

    /**
     * Get all tool names
     * @returns {string[]} Array of tool names
     */
    getToolNames() {
        if (!this.schema || !this.schema.tools) {
            return [];
        }
        return this.schema.tools.map(tool => tool.name);
    }

    /**
     * Get tools by category
     * @param {string} category - Category name (system, wallet, query, transaction, utility, testing)
     * @returns {Object[]} Array of tool schemas
     */
    getToolsByCategory(category) {
        if (!this.schema || !this.schema.tools) {
            return [];
        }
        return this.schema.tools.filter(tool => tool.category === category);
    }

    /**
     * Get input schema for a tool
     * @param {string} toolName - Name of the tool
     * @returns {Object|null} Input schema or null if not found
     */
    getInputSchema(toolName) {
        const tool = this.getToolSchema(toolName);
        return tool ? tool.inputSchema : null;
    }

    /**
     * Get response schema for a tool
     * @param {string} toolName - Name of the tool
     * @returns {Object|null} Response schema or null if not found
     */
    getResponseSchema(toolName) {
        const tool = this.getToolSchema(toolName);
        return tool ? tool.responseSchema : null;
    }

    /**
     * Get examples for a tool
     * @param {string} toolName - Name of the tool
     * @returns {Object[]|null} Array of examples or null if not found
     */
    getExamples(toolName) {
        const tool = this.getToolSchema(toolName);
        return tool ? tool.examples : null;
    }

    /**
     * Get error codes from schema
     * @returns {string[]} Array of error codes
     */
    getErrorCodes() {
        if (!this.schema || !this.schema.errorSchema || !this.schema.errorSchema.properties) {
            return [];
        }
        const errorCodeEnum = this.schema.errorSchema.properties.errorCode?.enum;
        return errorCodeEnum || [];
    }

    /**
     * Get schema metadata
     * @returns {Object} Schema metadata
     */
    getMetadata() {
        if (!this.schema) {
            return {};
        }
        return this.schema.metadata || {};
    }

    /**
     * Generate OpenAPI-style documentation for a tool
     * @param {string} toolName - Name of the tool
     * @returns {Object|null} OpenAPI-style docs or null if not found
     */
    generateOpenApiDocs(toolName) {
        const tool = this.getToolSchema(toolName);
        if (!tool) {
            return null;
        }

        return {
            summary: tool.description,
            description: tool.description,
            operationId: tool.name,
            tags: [tool.category],
            requestBody: {
                required: tool.inputSchema.required && tool.inputSchema.required.length > 0,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                jsonrpc: {
                                    type: 'string',
                                    enum: ['2.0'],
                                    description: 'JSON-RPC version'
                                },
                                method: {
                                    type: 'string',
                                    enum: [tool.name],
                                    description: 'Method name'
                                },
                                params: tool.inputSchema,
                                id: {
                                    oneOf: [
                                        { type: 'string' },
                                        { type: 'number' }
                                    ],
                                    description: 'Request ID'
                                }
                            },
                            required: ['jsonrpc', 'method', 'params', 'id']
                        },
                        examples: tool.examples ? tool.examples.map(ex => ex.request) : []
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Successful response',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    jsonrpc: {
                                        type: 'string',
                                        enum: ['2.0']
                                    },
                                    result: tool.responseSchema,
                                    id: {
                                        oneOf: [
                                            { type: 'string' },
                                            { type: 'number' }
                                        ]
                                    }
                                },
                                required: ['jsonrpc', 'result', 'id']
                            },
                            examples: tool.examples ? tool.examples.map(ex => ex.response) : []
                        }
                    }
                },
                '400': {
                    description: 'Error response',
                    content: {
                        'application/json': {
                            schema: this.schema.errorSchema
                        }
                    }
                }
            }
        };
    }

    /**
     * Generate complete OpenAPI 3.0 specification
     * @returns {Object} OpenAPI specification
     */
    generateOpenApiSpec() {
        const metadata = this.getMetadata();
        const tools = this.schema.tools || [];

        const paths = {};
        tools.forEach(tool => {
            paths[`/${tool.name}`] = {
                post: this.generateOpenApiDocs(tool.name)
            };
        });

        return {
            openapi: '3.0.0',
            info: {
                title: 'NANO MCP Server API',
                version: metadata.schemaVersion || '1.0.0',
                description: 'JSON-RPC 2.0 API for NANO cryptocurrency operations. AI agent optimized with comprehensive schemas and examples.',
                contact: {
                    name: 'NANO MCP Server',
                    url: metadata.documentation || 'https://github.com/dhyabi2/NANO_MCP_SERVER'
                }
            },
            servers: [
                {
                    url: metadata.productionEndpoint || 'https://nano-mcp.replit.app',
                    description: 'Production Server'
                },
                {
                    url: 'http://localhost:8080',
                    description: 'Local Development Server'
                }
            ],
            paths: paths,
            components: {
                schemas: {
                    Error: this.schema.errorSchema,
                    JsonRpcRequest: {
                        type: 'object',
                        properties: {
                            jsonrpc: { type: 'string', enum: ['2.0'] },
                            method: { type: 'string' },
                            params: { type: 'object' },
                            id: { oneOf: [{ type: 'string' }, { type: 'number' }] }
                        },
                        required: ['jsonrpc', 'method', 'params', 'id']
                    }
                }
            },
            tags: [
                { name: 'system', description: 'System and initialization operations' },
                { name: 'wallet', description: 'Wallet generation operations' },
                { name: 'query', description: 'Account and balance queries' },
                { name: 'transaction', description: 'Transaction operations' },
                { name: 'utility', description: 'Utility functions' },
                { name: 'testing', description: 'Test wallet management' }
            ]
        };
    }

    /**
     * Validate parameters against input schema
     * @param {string} toolName - Name of the tool
     * @param {Object} params - Parameters to validate
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validateParams(toolName, params) {
        const inputSchema = this.getInputSchema(toolName);
        if (!inputSchema) {
            return { valid: false, errors: ['Tool not found'] };
        }

        const errors = [];

        // Check required parameters
        if (inputSchema.required) {
            for (const requiredParam of inputSchema.required) {
                if (!(requiredParam in params) || params[requiredParam] === null || params[requiredParam] === undefined) {
                    errors.push(`Missing required parameter: ${requiredParam}`);
                }
            }
        }

        // Basic type checking
        if (inputSchema.properties) {
            for (const [paramName, paramSchema] of Object.entries(inputSchema.properties)) {
                if (paramName in params && params[paramName] !== null && params[paramName] !== undefined) {
                    const value = params[paramName];
                    const expectedType = paramSchema.type;

                    // Type validation
                    if (expectedType === 'string' && typeof value !== 'string') {
                        errors.push(`Parameter '${paramName}' must be a string`);
                    } else if (expectedType === 'number' && typeof value !== 'number') {
                        errors.push(`Parameter '${paramName}' must be a number`);
                    } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
                        errors.push(`Parameter '${paramName}' must be a boolean`);
                    } else if (expectedType === 'object' && typeof value !== 'object') {
                        errors.push(`Parameter '${paramName}' must be an object`);
                    }

                    // Pattern validation for strings
                    if (expectedType === 'string' && paramSchema.pattern && typeof value === 'string') {
                        const regex = new RegExp(paramSchema.pattern);
                        if (!regex.test(value)) {
                            errors.push(`Parameter '${paramName}' does not match expected pattern: ${paramSchema.pattern}`);
                        }
                    }

                    // Enum validation
                    if (paramSchema.enum && !paramSchema.enum.includes(value)) {
                        errors.push(`Parameter '${paramName}' must be one of: ${paramSchema.enum.join(', ')}`);
                    }
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Export singleton instance
const schemaProvider = new SchemaProvider();
module.exports = { SchemaProvider, schemaProvider };

