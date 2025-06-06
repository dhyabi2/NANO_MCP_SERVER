import fetch from 'node-fetch';
let rpcConfig = {
    url: 'https://rpc.nano.to/',
    rpcKey: '',
    gpuKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23'
};
export function setRPCConfig(config) {
    rpcConfig = { ...rpcConfig, ...config };
}
export async function rpcCall(action, params = {}) {
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
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    }
    catch (error) {
        throw new Error(`RPC call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
