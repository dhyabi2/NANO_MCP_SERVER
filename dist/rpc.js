"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRPCConfig = setRPCConfig;
exports.rpcCall = rpcCall;
const node_fetch_1 = __importDefault(require("node-fetch"));
let rpcConfig = {
    url: 'https://rpc.nano.to/',
    rpcKey: '',
    gpuKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23'
};
function setRPCConfig(config) {
    rpcConfig = { ...rpcConfig, ...config };
}
async function rpcCall(action, params = {}) {
    try {
        const response = await (0, node_fetch_1.default)(rpcConfig.url, {
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
        return data;
    }
    catch (error) {
        throw new Error(`RPC call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
