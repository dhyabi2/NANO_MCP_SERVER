export interface RPCConfig {
    url: string;
    rpcKey?: string;
    gpuKey?: string;
}
export declare function setRPCConfig(config: Partial<RPCConfig>): void;
export declare function rpcCall<T>(action: string, params?: Record<string, any>): Promise<T>;
