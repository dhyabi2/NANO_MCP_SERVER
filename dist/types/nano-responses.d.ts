export interface AccountInfo {
    frontier: string;
    open_block: string;
    representative_block: string;
    balance: string;
    modified_timestamp: string;
    block_count: string;
    representative: string;
    weight: string;
    pending: string;
    error?: string;
}
export interface WorkResponse {
    work: string;
    difficulty: string;
    multiplier: string;
    error?: string;
}
export interface ProcessResponse {
    hash: string;
    error?: string;
}
export interface PendingBlock {
    amount: string;
    source: string;
}
export interface PendingBlocks {
    blocks: Record<string, PendingBlock>;
    error?: string;
}
export interface TransactionResult {
    hash: string;
    result?: ProcessResponse;
    error?: string;
}
