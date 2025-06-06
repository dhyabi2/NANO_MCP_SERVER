import { ConfigValidationResult } from '../types/config';
import { AccountInfo, Block, PendingBlocks } from '../types/nano';
export declare class NanoTransactions {
    private apiUrl;
    private rpcKey;
    private gpuKey;
    private defaultRepresentative;
    private config;
    constructor(customConfig?: Partial<{
        apiUrl: string;
        rpcKey: string;
        gpuKey: string;
        defaultRepresentative: string;
    }>, config?: any);
    private rpcCall;
    validateConfig(errors: string[]): Promise<ConfigValidationResult>;
    generateWork(hash: string): Promise<string>;
    getAccountInfo(account: string): Promise<AccountInfo>;
    getPendingBlocks(account: string): Promise<PendingBlocks>;
    createOpenBlock(address: string, privateKey: string, sourceBlock: string, sourceAmount: string): Promise<Block>;
    createSendBlock(fromAddress: string, privateKey: string, toAddress: string, amount: string, accountInfo: AccountInfo): Promise<Block>;
    receiveAllPending(address: string, privateKey: string): Promise<Block[]>;
    private makeRequest;
}
