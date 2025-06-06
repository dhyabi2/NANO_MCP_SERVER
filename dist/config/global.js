"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables from .env file
dotenv_1.default.config();
/**
 * Default RPC URL from nano.to
 * High-performance public enterprise node for the Nano blockchain
 * Visit https://rpc.nano.to/ to get your free API key
 */
const DEFAULT_RPC_URL = 'https://rpc.nano.to/';
/**
 * Default representative address
 * This address is used when no representative is specified
 *
 * To choose a different representative:
 * 1. Visit https://nanexplorer.com/nano/representatives
 * 2. Select a representative with good uptime and reasonable voting weight
 * 3. Copy their address and use it in your configuration
 *
 * Choosing a good representative helps maintain network decentralization
 */
const DEFAULT_REPRESENTATIVE = 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4';
const DEFAULT_RPC_KEY = 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23';
class GlobalConfig {
    constructor() {
        this.initialized = false;
        this.config = {
            rpcUrl: process.env.NANO_RPC_URL || DEFAULT_RPC_URL,
            rpcKey: process.env.NANO_RPC_KEY || DEFAULT_RPC_KEY,
            gpuKey: process.env.NANO_GPU_KEY || DEFAULT_RPC_KEY,
            defaultRepresentative: process.env.NANO_DEFAULT_REPRESENTATIVE || DEFAULT_REPRESENTATIVE
        };
    }
    static getInstance() {
        if (!GlobalConfig.instance) {
            GlobalConfig.instance = new GlobalConfig();
        }
        return GlobalConfig.instance;
    }
    getNanoConfig() {
        if (!this.initialized) {
            throw new Error('Configuration not initialized. Call initializeConfig() first.');
        }
        return { ...this.config };
    }
    initializeConfig(config) {
        if (config) {
            this.config = {
                ...this.config,
                ...config
            };
        }
        const validation = this.validateConfig();
        if (validation.isValid) {
            this.initialized = true;
        }
        return validation;
    }
    validateConfig() {
        const errors = [];
        const warnings = [];
        // Required parameters
        if (!this.config.rpcUrl) {
            errors.push('NANO_RPC_URL is required but not set');
        }
        if (!this.config.rpcKey) {
            errors.push('NANO_RPC_KEY is required but not set');
        }
        if (!this.config.gpuKey) {
            errors.push('NANO_GPU_KEY is required but not set');
        }
        // Optional parameters with defaults
        if (!this.config.defaultRepresentative) {
            this.config.defaultRepresentative = DEFAULT_REPRESENTATIVE;
            warnings.push('Using default representative address');
        }
        // URL format validation
        try {
            new URL(this.config.rpcUrl);
        }
        catch {
            errors.push('NANO_RPC_URL must be a valid URL');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    static generateEnvTemplate() {
        const template = `# NANO Configuration
# Required Parameters
NANO_RPC_URL=https://rpc.nano.to/     # Required: URL of the NANO RPC server
NANO_RPC_KEY=your-rpc-key-here        # Required: Your RPC authentication key
NANO_GPU_KEY=your-gpu-key-here        # Required: Your GPU service key for work generation

# Optional Parameters
# To choose a different representative, visit: https://nanexplorer.com/nano/representatives
# Select a representative with good uptime and reasonable voting weight
NANO_DEFAULT_REPRESENTATIVE=${DEFAULT_REPRESENTATIVE}  # Optional: Default representative for new accounts
`;
        const envPath = path_1.default.join(process.cwd(), '.env.example');
        fs_1.default.writeFileSync(envPath, template);
    }
    getConfigStatus() {
        const validation = this.validateConfig();
        let status = 'Configuration Status:\n';
        if (validation.errors.length > 0) {
            status += '\nErrors:\n' + validation.errors.map(err => `- ${err}`).join('\n');
        }
        if (validation.warnings.length > 0) {
            status += '\nWarnings:\n' + validation.warnings.map(warn => `- ${warn}`).join('\n');
        }
        if (validation.isValid) {
            status += '\nConfiguration is valid and ready to use.';
        }
        return status;
    }
}
exports.config = GlobalConfig.getInstance();
exports.default = GlobalConfig;
