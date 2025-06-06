"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_1 = require("../mcp-server");
class ExampleMCPServer extends mcp_server_1.EnhancedMCPServer {
    constructor() {
        const config = {
            name: 'Example MCP Server',
            description: 'An example implementation of the Enhanced MCP Server',
            version: '1.0.0',
            author: 'Example Author'
        };
        const transport = {
            type: 'http',
            endpoint: 'localhost:3000',
            options: {
                headers: {
                    'X-Server-Name': 'Example MCP Server'
                }
            }
        };
        super(config, transport);
        // Register example tools
        this.registerExampleTools();
        // Register example prompts
        this.registerExamplePrompts();
    }
    registerExampleTools() {
        const calculateTool = {
            name: 'calculate',
            description: 'Performs basic arithmetic calculations',
            parameters: {
                type: 'object',
                properties: {
                    operation: {
                        type: 'string',
                        enum: ['add', 'subtract', 'multiply', 'divide']
                    },
                    a: { type: 'number' },
                    b: { type: 'number' }
                },
                required: ['operation', 'a', 'b']
            },
            returns: {
                type: 'number',
                description: 'The result of the calculation',
                schema: {
                    type: 'object',
                    properties: {
                        result: { type: 'number' }
                    },
                    required: ['result']
                }
            },
            examples: [
                {
                    description: 'Add two numbers',
                    request: {
                        operation: 'add',
                        a: 5,
                        b: 3
                    },
                    response: {
                        result: 8
                    }
                }
            ]
        };
        this.registerTool(calculateTool);
    }
    registerExamplePrompts() {
        const greetingPrompt = {
            name: 'greeting',
            description: 'Generates a personalized greeting',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    timeOfDay: {
                        type: 'string',
                        enum: ['morning', 'afternoon', 'evening', 'night']
                    }
                },
                required: ['name', 'timeOfDay']
            },
            outputSchema: {
                type: 'object',
                properties: {
                    greeting: { type: 'string' }
                },
                required: ['greeting']
            },
            template: 'Good {{timeOfDay}}, {{name}}!',
            examples: [
                {
                    input: {
                        name: 'Alice',
                        timeOfDay: 'morning'
                    },
                    output: {
                        greeting: 'Good morning, Alice!'
                    }
                }
            ]
        };
        this.registerPrompt(greetingPrompt);
    }
    async executeTool(name, args) {
        switch (name) {
            case 'calculate':
                return this.executeCalculate(args);
            default:
                throw new Error(`Tool not implemented: ${name}`);
        }
    }
    async executePrompt(name, input) {
        switch (name) {
            case 'greeting':
                return this.executeGreeting(input);
            default:
                throw new Error(`Prompt not implemented: ${name}`);
        }
    }
    async fetchResource(uri) {
        throw new Error('Resource fetching not implemented');
    }
    async executeCalculate(args) {
        const { operation, a, b } = args;
        let result;
        switch (operation) {
            case 'add':
                result = a + b;
                break;
            case 'subtract':
                result = a - b;
                break;
            case 'multiply':
                result = a * b;
                break;
            case 'divide':
                if (b === 0) {
                    throw new Error('Division by zero');
                }
                result = a / b;
                break;
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
        return { result };
    }
    async executeGreeting(input) {
        const { name, timeOfDay } = input;
        return {
            greeting: `Good ${timeOfDay}, ${name}!`
        };
    }
}
// Example usage
async function main() {
    const server = new ExampleMCPServer();
    await server.start();
}
if (require.main === module) {
    main().catch(console.error);
}
