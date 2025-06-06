import fetch from 'node-fetch';

export interface RPCConfig {
    url: string;
    rpcKey?: string;
    gpuKey?: string;
}

let rpcConfig: RPCConfig = {
    url: 'https://rpc.nano.to/',
    rpcKey: '',
    gpuKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23'
};

export function setRPCConfig(config: Partial<RPCConfig>): void {
    rpcConfig = { ...rpcConfig, ...config };
}

export async function rpcCall<T>(action: string, params: Record<string, any> = {}): Promise<T> {
    try {
        const response = await fetch(rpcConfig.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(rpcConfig.rpcKey && { 'Authorization': rpcConfig.rpcKey }),
                ...(rpcConfig.gpuKey && { 'X-GPU-Key': rpcConfig.gpuKey })
            },
            body: JSON.stringify({
                action,
                ...params
            })
        });

        const data = await response.json();
        
        // Type guard to check if data has error property
        if (typeof data === 'object' && data !== null && 'error' in data) {
            throw new Error(String(data.error));
        }
        
        return data as T;
    } catch (error) {
        throw new Error(`RPC call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
} 