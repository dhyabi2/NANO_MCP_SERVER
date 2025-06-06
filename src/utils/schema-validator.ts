import Ajv, { JSONSchemaType } from 'ajv';
import { JSONSchema7 } from 'json-schema';
import { MCPError } from '../types/mcp-types';

export class SchemaValidator {
  private static instance: SchemaValidator;
  private ajv: Ajv;

  private constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });
  }

  public static getInstance(): SchemaValidator {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator();
    }
    return SchemaValidator.instance;
  }

  public validate(data: unknown, schema: JSONSchema7): void {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      const error: MCPError = {
        code: -32602,
        message: 'Invalid parameters',
        details: {
          errors: validate.errors?.map(err => ({
            path: err.instancePath,
            message: err.message,
            params: err.params
          }))
        }
      };
      throw error;
    }
  }

  public addSchema(schema: JSONSchema7, id: string): void {
    this.ajv.addSchema(schema, id);
  }

  public getSchema(id: string): JSONSchema7 | undefined {
    return this.ajv.getSchema(id)?.schema as JSONSchema7;
  }
} 