export declare class NanoTransactions {
    private apiUrl;
    private rpcKey;
    private gpuKey;
    private defaultRepresentative;
    constructor(customConfig?: Partial<{
        apiUrl: string;
        rpcKey: string;
        gpuKey: string;
        defaultRepresentative: string;
    }>);
    private rpcCall;
    generateWork(hash: string): Promise<string>;
    getAccountInfo(account: string): Promise<unknown>;
    getPendingBlocks(account: string): Promise<unknown>;
    createOpenBlock(address: string, privateKey: string, sourceBlock: string, sourceAmount: string): Promise<unknown>;
    createSendBlock(fromAddress: string, privateKey: string, toAddress: string, amount: string, accountInfo: any): Promise<unknown>;
    receiveAllPending(address: string, privateKey: string): Promise<unknown[]>;
}
