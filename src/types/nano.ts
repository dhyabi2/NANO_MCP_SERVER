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

export interface Block {
    type: string;
    account: string;
    previous: string;
    representative: string;
    balance: string;
    link: string;
    signature?: string;
    work?: string;
}

export interface PendingBlocks {
    blocks: {
        [key: string]: {
            amount: string;
            source: string;
        };
    };
} 