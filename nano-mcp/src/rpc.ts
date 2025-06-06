import fetch from 'node-fetch';
import { logRpcCall } from './utils/logger.js';
import { RPCConfig } from './mcp-types.js';

// Default RPC endpoint
const DEFAULT_RPC_URL = 'https://proxy.nanos.cc/proxy';

// Type definitions for RPC responses
interface RPCResponse {
  error?: string;
  [key: string]: any;
}

// RPC helper function
export async function rpcCall(action: string, params: Record<string, any> = {}, config?: RPCConfig): Promise<RPCResponse> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  let response: RPCResponse | null = null;
  let error: string | undefined;

  try {
    const response = await fetch(config?.nodeUrl || DEFAULT_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config?.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
      },
      body: JSON.stringify({
        action,
        ...params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as RPCResponse;
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`RPC call failed: ${errorMessage}`);
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