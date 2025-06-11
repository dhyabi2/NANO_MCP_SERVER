"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaValidator = void 0;
const ajv_1 = __importDefault(require("ajv"));
class SchemaValidator {
    constructor() {
        this.ajv = new ajv_1.default({
            allErrors: true,
            verbose: true,
            strict: false
        });
    }
    static getInstance() {
        if (!SchemaValidator.instance) {
            SchemaValidator.instance = new SchemaValidator();
        }
        return SchemaValidator.instance;
    }
    validate(data, schema) {
        const validate = this.ajv.compile(schema);
        const valid = validate(data);
        if (!valid) {
            const error = {
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
    addSchema(schema, id) {
        this.ajv.addSchema(schema, id);
    }
    getSchema(id) {
        return this.ajv.getSchema(id)?.schema;
    }
}
exports.SchemaValidator = SchemaValidator;
