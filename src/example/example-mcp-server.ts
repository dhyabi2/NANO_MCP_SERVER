import { EnhancedMCPServer } from '../mcp-server';
import { MCPServerConfig, TransportConfig, ToolDefinition, PromptTemplate } from '../types/mcp-types';

class ExampleMCPServer extends EnhancedMCPServer {
  constructor() {
    const config: MCPServerConfig = {
      name: 'Example MCP Server',
      description: 'An example implementation of the Enhanced MCP Server',
      version: '1.0.0',
      author: 'Example Author'
    };

    const transport: TransportConfig = {
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

  private registerExampleTools(): void {
    const calculateTool: ToolDefinition = {
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

  private registerExamplePrompts(): void {
    const greetingPrompt: PromptTemplate = {
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

  protected async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'calculate':
        return this.executeCalculate(args);
      default:
        throw new Error(`Tool not implemented: ${name}`);
    }
  }

  protected async executePrompt(name: string, input: any): Promise<any> {
    switch (name) {
      case 'greeting':
        return this.executeGreeting(input);
      default:
        throw new Error(`Prompt not implemented: ${name}`);
    }
  }

  protected async fetchResource(uri: string): Promise<any> {
    throw new Error('Resource fetching not implemented');
  }

  private async executeCalculate(args: any): Promise<any> {
    const { operation, a, b } = args;
    let result: number;

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

  private async executeGreeting(input: any): Promise<any> {
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