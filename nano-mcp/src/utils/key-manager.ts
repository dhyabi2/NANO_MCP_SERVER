import * as nanocurrency from 'nanocurrency';
import * as nanoWeb from 'nanocurrency-web';
import { Logger } from './logger.js';

interface SignBlockParams {
    hash: string;
    secretKey: string;
}

export class KeyManager {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    async generateKeyPair() {
        try {
            const wallet = await nanoWeb.wallet.generate();
            const account = wallet.accounts[0];
            
            // Convert xrb_ prefix to nano_
            const address = account.address.replace('xrb_', 'nano_');
            
            return {
                address,
                privateKey: account.privateKey,
                publicKey: account.publicKey
            };
        } catch (error) {
            this.logger.logError('KEY_GENERATION_ERROR', error);
            throw error;
        }
    }

    validateKeyFormat(privateKey: string): boolean {
        return /^[0-9A-Fa-f]{64}$/.test(privateKey);
    }

    verifyKeyPair(privateKey: string, publicKey: string): boolean {
        try {
            const derivedPublicKey = nanocurrency.derivePublicKey(privateKey);
            return derivedPublicKey === publicKey;
        } catch (error) {
            this.logger.logError('KEY_VERIFICATION_ERROR', error);
            return false;
        }
    }

    signBlock(block: any, privateKey: string) {
        try {
            const signature = nanocurrency.signBlock({
                hash: block.hash,
                secretKey: privateKey
            });
            
            return {
                block: {
                    ...block,
                    signature
                }
            };
        } catch (error) {
            this.logger.logError('BLOCK_SIGNING_ERROR', error);
            throw error;
        }
    }
} 