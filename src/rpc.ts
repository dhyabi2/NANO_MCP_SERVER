import fetch from 'node-fetch';
import { logRpcCall } from './utils/logger.js';

// Default RPC endpoint
export const DEFAULT_RPC_URL = 'https://node.somenano.com/proxy';

// Type definitions for RPC responses
export interface RpcResponse {
  error?: string;
  [key: string]: any;
}

// RPC helper function
export async function rpcCall(action: string, params: Record<string, any> = {}, rpcUrl: string = DEFAULT_RPC_URL): Promise<RpcResponse> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  let response: RpcResponse | null = null;
  let error: string | undefined;

  try {
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    });

    if (!rpcResponse.ok) {
      throw new Error(`HTTP error: ${rpcResponse.status} - ${rpcResponse.statusText}`);
    }

    response = await rpcResponse.json() as RpcResponse;
    
    if (response.error) {
      throw new Error(`RPC error: ${response.error}`);
    }

    return response;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to execute RPC call ${action}: ${error}`);
  } finally {
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