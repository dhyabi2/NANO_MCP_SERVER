import * as nanocurrency from 'nanocurrency';
import * as nanoWeb from 'nanocurrency-web';
import crypto from 'crypto';

export class KeyManager {
    constructor(logger) {
        this.logger = logger;
    }

    validateKeyFormat(key) {
        if (!key) {
            this.logger.log('KEY_VALIDATION', 'Key is null or undefined');
            return false;
        }
        if (typeof key !== 'string') {
            this.logger.log('KEY_VALIDATION', `Key is not a string, got ${typeof key}`);
            return false;
        }
        if (!/^[0-9a-fA-F]{64}$/.test(key)) {
            this.logger.log('KEY_VALIDATION', `Key does not match hex format: ${key}`);
            return false;
        }
        return true;
    }

    async generateKeyPair() {
        try {
            // Generate entropy
            const entropy = crypto.randomBytes(32).toString('hex').toLowerCase();
            
            // Log entropy generation
            this.logger.log('KEY_GENERATION', {
                entropy_length: entropy.length,
                entropy: entropy
            });

            // Generate wallet using nanocurrency-web
            const wallet = await nanoWeb.wallet.generate(entropy);
            const account = wallet.accounts[0];
            
            // Log raw account data
            this.logger.log('WALLET_GENERATED', {
                address: account.address,
                public_key: account.publicKey,
                private_key_length: account.privateKey.length
            });

            // Extract and format the private key
            let privateKey = account.privateKey.toLowerCase();
            if (privateKey.startsWith('0x')) {
                privateKey = privateKey.slice(2);
            }
            
            // Ensure the private key is in the correct format
            if (!/^[0-9a-f]{64}$/.test(privateKey)) {
                throw new Error('Generated private key is in invalid format');
            }
            
            // Log key processing
            this.logger.log('KEY_PROCESSING', {
                original_private_key_length: account.privateKey.length,
                processed_private_key_length: privateKey.length,
                is_hex: /^[0-9a-f]{64}$/.test(privateKey)
            });

            // Verify the key pair
            const verifiedPublicKey = nanocurrency.derivePublicKey(privateKey);
            if (!verifiedPublicKey) {
                throw new Error('Failed to derive public key from private key');
            }

            const publicKeyMatches = verifiedPublicKey.toLowerCase() === account.publicKey.toLowerCase();
            
            // Log key verification
            this.logger.log('KEY_VERIFICATION', {
                original_public: account.publicKey,
                derived_public: verifiedPublicKey,
                match: publicKeyMatches
            });

            if (!publicKeyMatches) {
                throw new Error('Key pair verification failed');
            }

            // Store the keys in the correct format
            return {
                address: account.address,
                privateKey: privateKey,
                publicKey: account.publicKey.toLowerCase()
            };
        } catch (error) {
            this.logger.logError('KEY_GENERATION_ERROR', error);
            throw new Error(`Failed to generate key pair: ${error.message}`);
        }
    }

    verifyKeyPair(privateKey, publicKey) {
        try {
            // Log input validation
            this.logger.log('KEY_PAIR_VERIFICATION', {
                private_key_length: privateKey?.length,
                public_key_length: publicKey?.length
            });

            // Validate key formats
            if (!this.validateKeyFormat(privateKey)) {
                throw new Error(`Invalid private key format: ${privateKey}`);
            }

            if (!this.validateKeyFormat(publicKey)) {
                throw new Error(`Invalid public key format: ${publicKey}`);
            }

            // Derive public key and compare
            const derivedPublicKey = nanocurrency.derivePublicKey(privateKey.toLowerCase());
            const matches = derivedPublicKey.toLowerCase() === publicKey.toLowerCase();

            // Log verification result
            this.logger.log('KEY_PAIR_VERIFICATION_RESULT', {
                original_public: publicKey,
                derived_public: derivedPublicKey,
                match: matches
            });

            return matches;
        } catch (error) {
            this.logger.logError('KEY_VERIFICATION_ERROR', error);
            return false;
        }
    }

    signBlock(block, privateKey) {
        try {
            // Log input validation
            this.logger.log('BLOCK_SIGNING_INPUT', {
                block_type: block?.type,
                private_key_length: privateKey?.length
            });

            // Validate and format private key
            if (!privateKey || typeof privateKey !== 'string') {
                throw new Error('Invalid private key: must be a string');
            }

            let formattedPrivateKey = privateKey.toLowerCase();
            if (formattedPrivateKey.startsWith('0x')) {
                formattedPrivateKey = formattedPrivateKey.slice(2);
            }

            if (!/^[0-9a-f]{64}$/.test(formattedPrivateKey)) {
                throw new Error('Invalid private key format');
            }

            // Validate block structure
            if (!block || typeof block !== 'object') {
                throw new Error('Invalid block: must be an object');
            }

            const requiredFields = ['type', 'account', 'previous', 'representative', 'balance', 'link'];
            for (const field of requiredFields) {
                if (!block[field]) {
                    throw new Error(`Missing required block field: ${field}`);
                }
            }

            // Ensure all strings are lowercase for consistency
            const formattedBlock = {
                ...block,
                type: block.type.toLowerCase(),
                account: block.account.toLowerCase(),
                previous: block.previous.toLowerCase(),
                representative: block.representative.toLowerCase(),
                link: block.link.toLowerCase(),
            };

            // Create block hash
            const blockHash = nanocurrency.hashBlock(formattedBlock);
            if (!blockHash) {
                throw new Error('Failed to generate block hash');
            }

            // Sign the block
            const signature = nanocurrency.signBlock({
                hash: blockHash,
                privateKey: formattedPrivateKey
            });

            if (!signature) {
                throw new Error('Failed to generate signature');
            }

            // Log signing result
            this.logger.log('BLOCK_SIGNING_RESULT', {
                hash: blockHash,
                signature_length: signature.length
            });

            return {
                signature,
                block: {
                    ...formattedBlock,
                    signature,
                    work: block.work || null // Preserve work if present
                }
            };
        } catch (error) {
            this.logger.logError('BLOCK_SIGNING_ERROR', error);
            throw new Error(`Failed to sign block: ${error.message}`);
        }
    }

    deriveAddress(publicKey) {
        try {
            // Log input validation
            this.logger.log('ADDRESS_DERIVATION_INPUT', {
                public_key_length: publicKey?.length
            });

            if (!this.validateKeyFormat(publicKey)) {
                throw new Error(`Invalid public key format: ${publicKey}`);
            }

            const address = nanocurrency.deriveAddress(publicKey.toLowerCase());
            
            // Log derivation result
            this.logger.log('ADDRESS_DERIVATION_RESULT', {
                public_key: publicKey,
                derived_address: address
            });

            return address;
        } catch (error) {
            this.logger.logError('ADDRESS_DERIVATION_ERROR', error);
            throw new Error(`Failed to derive address: ${error.message}`);
        }
    }
} 