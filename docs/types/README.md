# MCP TypeScript Type Definitions

## Common Types

```typescript
/**
 * NANO address format with nano_ prefix
 * @example "nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf"
 */
type NanoAddress = string;

/**
 * 64-character hexadecimal private key
 * @example "4bc2e9c2df4be93e5cbeb41b52c2fc9efc1b4c0e67951fc6c5098c117913d25a"
 */
type PrivateKey = string;

/**
 * Raw amount in string format to handle large numbers
 * @example "1000000000000000000000000"
 */
type RawAmount = string;

/**
 * 64-character hexadecimal block hash
 * @example "991CF190094C00F0B68E2E5F75F6BEE95A2E0BD93CEAA4A6734DB9F19B728948"
 */
type BlockHash = string;
```

## JSON-RPC Types

```typescript
/**
 * Standard JSON-RPC 2.0 request format
 */
interface JsonRpcRequest<T> {
    jsonrpc: "2.0";
    method: string;
    params: T;
    id: number;
}

/**
 * Standard JSON-RPC 2.0 success response format
 */
interface JsonRpcResponse<T> {
    jsonrpc: "2.0";
    result: T;
    id: number;
}

/**
 * Standard JSON-RPC 2.0 error response format
 */
interface JsonRpcError {
    jsonrpc: "2.0";
    error: {
        code: number;
        message: string;
        data?: any;
    };
    id: number | null;
}
```

## Method-Specific Types

### Wallet Operations

```typescript
/**
 * Response from generateWallet method
 */
interface WalletResponse {
    /** The public address starting with nano_ */
    address: NanoAddress;
    /** The private key for the wallet */
    privateKey: PrivateKey;
    /** The public key portion of the address */
    publicKey: string;
}

/**
 * Response from getBalance method
 */
interface BalanceResponse {
    /** Current confirmed balance in raw units */
    balance: RawAmount;
    /** Sum of pending incoming transactions */
    pending: RawAmount;
}

/**
 * Detailed account information response
 */
interface AccountInfoResponse {
    /** Hash of the latest block in the account chain */
    frontier: BlockHash;
    /** Hash of the first block in the account chain */
    open_block: BlockHash;
    /** Hash of the block setting the current representative */
    representative_block: BlockHash;
    /** Current account balance in raw units */
    balance: RawAmount;
    /** Last modified timestamp */
    modified_timestamp: string;
    /** Total number of blocks in the account chain */
    block_count: string;
    /** Current representative address */
    representative: NanoAddress;
    /** Voting weight of the account */
    weight: string;
    /** Sum of pending incoming transactions */
    pending: RawAmount;
}
```

### Transaction Operations

```typescript
/**
 * Information about a pending block
 */
interface PendingBlock {
    /** Amount being transferred in raw units */
    amount: RawAmount;
    /** Address that sent the transaction */
    source: NanoAddress;
}

/**
 * Response containing all pending blocks
 */
interface PendingBlocksResponse {
    /** Map of block hashes to pending block information */
    blocks: {
        [hash: BlockHash]: PendingBlock;
    };
}

/**
 * Response from a send transaction
 */
interface TransactionResponse {
    /** Whether the transaction was successful */
    success: boolean;
    /** Hash of the transaction block */
    hash: BlockHash;
    /** Amount that was sent in raw units */
    amount: RawAmount;
    /** New balance after the transaction */
    balance: RawAmount;
}

/**
 * Response from receiving pending transactions
 */
interface ReceiveResponse {
    /** Array of received transactions */
    received: Array<{
        /** Hash of the received block */
        hash: BlockHash;
        /** Amount received in raw units */
        amount: RawAmount;
        /** Address that sent the transaction */
        source: NanoAddress;
    }>;
}
```

## Usage Examples

### Sending a Transaction

```typescript
async function sendNano(
    fromAddress: NanoAddress,
    toAddress: NanoAddress,
    amount: RawAmount,
    privateKey: PrivateKey
): Promise<TransactionResponse> {
    const request: JsonRpcRequest<{
        fromAddress: NanoAddress;
        toAddress: NanoAddress;
        amountRaw: RawAmount;
        privateKey: PrivateKey;
    }> = {
        jsonrpc: "2.0",
        method: "sendTransaction",
        params: {
            fromAddress,
            toAddress,
            amountRaw: amount,
            privateKey
        },
        id: 1
    };

    // Make the request to the MCP server
    const response = await fetch("http://localhost:3000", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
    });

    return (await response.json()).result;
}
```

### Checking Balance

```typescript
async function checkBalance(address: NanoAddress): Promise<BalanceResponse> {
    const request: JsonRpcRequest<{
        address: NanoAddress;
    }> = {
        jsonrpc: "2.0",
        method: "getBalance",
        params: {
            address
        },
        id: 1
    };

    const response = await fetch("http://localhost:3000", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
    });

    return (await response.json()).result;
}
``` 