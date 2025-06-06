import { KeyManager } from './key-manager';
export declare class WalletService {
    private apiUrl;
    private apiKey;
    private logger;
    keyManager: KeyManager;
    constructor();
    makeRpcCall(action: string, params?: {}): Promise<any>;
    generateWallet(): Promise<{
        seed: string;
        privateKey: string;
        publicKey: string;
        address: string;
    }>;
    initializeAccount(address: string, privateKey: string): Promise<any>;
    getBalance(address: string): Promise<{
        balance: any;
        pending: any;
    }>;
    generateWork(hash: string): Promise<any>;
    receivePending(address: string, privateKey: string): Promise<{
        received: number;
    }>;
    sendTransaction(fromAddress: string, privateKey: string, toAddress: string, amountRaw: string): Promise<{
        success: boolean;
        hash: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        hash?: undefined;
    }>;
}
declare const walletService: WalletService;
export default walletService;
