import fetch from 'node-fetch';
import { logRpcCall } from './utils/logger.js';
// Default RPC endpoint
export const DEFAULT_RPC_URL = 'https://node.somenano.com/proxy';
// RPC helper function
export async function rpcCall(action, params = {}, rpcUrl = DEFAULT_RPC_URL) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    let response = null;
    let error;
    try {
        const rpcResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...params }),
        });
        if (!rpcResponse.ok) {
            throw new Error(`HTTP error: ${rpcResponse.status} - ${rpcResponse.statusText}`);
        }
        response = await rpcResponse.json();
        if (response.error) {
            throw new Error(`RPC error: ${response.error}`);
        }
        return response;
    }
    catch (err) {
        error = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to execute RPC call ${action}: ${error}`);
    }
    finally {
        // Log the RPC call regardless of success or failure
        logRpcCall({
            timestamp,
            action,
            params,
            response,
            duration: Date.now() - startTime,
            error,
        });
    }
}
