import * as nanocurrency from 'nanocurrency';
import crypto from 'crypto';

export class KeyManager {
    constructor(logger) {
        this.logger = logger;
    }

    async generateKeyPair() {
        try {
            // Generate random seed
            const seed = crypto.randomBytes(32).toString('hex');
            
            // Derive key pair from seed
            const privateKey = nanocurrency.deriveSecretKey(seed, 0);
            const publicKey = nanocurrency.derivePublicKey(privateKey);
            const address = nanocurrency.deriveAddress(publicKey, { useNanoPrefix: true });

            this.logger.log('KEY_GENERATION', {
                publicKey,
                address,
                message: 'New key pair generated successfully'
            });

            return {
                privateKey,
                publicKey,
                address
            };
        } catch (error) {
            this.logger.logError('KEY_GENERATION_ERROR', error);
            throw error;
        }
    }

    validateKeyFormat(privateKey) {
        try {
            return nanocurrency.checkKey(privateKey);
        } catch (error) {
            this.logger.logError('KEY_VALIDATION_ERROR', error);
            return false;
        }
    }

    verifyKeyPair(privateKey, publicKey) {
        try {
            const derivedPublicKey = nanocurrency.derivePublicKey(privateKey);
            return derivedPublicKey === publicKey;
        } catch (error) {
            this.logger.logError('KEY_VERIFICATION_ERROR', error);
            return false;
        }
    }

    signBlock(block, privateKey) {
        try {
            const signature = nanocurrency.signBlock({
                hash: nanocurrency.hashBlock(block),
                privateKey,
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