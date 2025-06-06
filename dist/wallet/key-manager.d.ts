import { Logger } from '../utils/logger';
export declare class KeyManager {
    private logger;
    constructor(logger: Logger);
    generateKeyPair(): Promise<{
        seed: string;
        privateKey: string;
        publicKey: string;
        address: string;
    }>;
    validateKeyFormat(privateKey: string): boolean;
    verifyKeyPair(privateKey: string, publicKey: string): Promise<boolean>;
    signBlock(block: any, privateKey: string): Promise<import("nanocurrency-web/dist/lib/block-signer").SignedBlock>;
}
