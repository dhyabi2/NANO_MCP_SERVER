import { JSONSchema7 } from 'json-schema';
export declare class SchemaValidator {
    private static instance;
    private ajv;
    private constructor();
    static getInstance(): SchemaValidator;
    validate(data: unknown, schema: JSONSchema7): void;
    addSchema(schema: JSONSchema7, id: string): void;
    getSchema(id: string): JSONSchema7 | undefined;
}
