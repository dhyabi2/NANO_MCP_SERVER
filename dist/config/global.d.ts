export interface NanoConfig {
    rpcUrl: string;
    rpcKey: string;
    gpuKey: string;
    defaultRepresentative: string;
}
export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
declare class GlobalConfig {
    private static instance;
    private config;
    private initialized;
    private constructor();
    static getInstance(): GlobalConfig;
    getNanoConfig(): NanoConfig;
    initializeConfig(config?: Partial<NanoConfig>): ConfigValidationResult;
    validateConfig(): ConfigValidationResult;
    static generateEnvTemplate(): void;
    getConfigStatus(): string;
}
export declare const config: GlobalConfig;
export default GlobalConfig;
