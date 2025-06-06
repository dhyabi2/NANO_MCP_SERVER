import * as nanocurrency from 'nanocurrency';
import * as nanoWeb from 'nanocurrency-web';
import { Logger } from '../utils/logger';
import { block, tools } from 'nanocurrency-web';

export class KeyManager {
    constructor(private logger: Logger) {}

    async generateKeyPair() {
        try {
            const wallet = await nanoWeb.wallet.generate();
            const seed = wallet.seed;
            const account = wallet.accounts[0];
            const privateKey = account.privateKey;
            const publicKey = account.publicKey;
            const address = account.address;

            return {
                seed,
                privateKey,
                publicKey,
                address
            };
        } catch (error) {
            this.logger.logError('KEY_GENERATION_ERROR', error);
            throw error;
        }
    }

    validateKeyFormat(privateKey: string): boolean {
        return /^[0-9A-F]{64}$/i.test(privateKey);
    }

    async verifyKeyPair(privateKey: string, publicKey: string): Promise<boolean> {
        try {
            const wallet = await nanoWeb.wallet.generate(privateKey);
            const derivedPublicKey = wallet.accounts[0].publicKey;
            return derivedPublicKey === publicKey;
        } catch (error) {
            this.logger.logError('KEY_VERIFICATION_ERROR', error);
            return false;
        }
    }

    async signBlock(block: any, privateKey: string) {
        try {
            // Use nanocurrency-web's block signing
            const blockData = {
                ...block,
                balance: block.balance || '0',
                link: block.link || block.source || '0'.repeat(64),
                previous: block.previous || '0'.repeat(64),
                representative: block.representative || block.account
            };

            // Sign using the appropriate block type
            let signedBlock;
            if (block.subtype === 'send') {
                signedBlock = nanoWeb.block.send(blockData, privateKey);
            } else if (block.subtype === 'receive' || block.subtype === 'open') {
                signedBlock = nanoWeb.block.receive(blockData, privateKey);
            } else {
                throw new Error(`Unsupported block type: ${block.subtype}`);
            }

            return signedBlock;
        } catch (error) {
            this.logger.logError('BLOCK_SIGNING_ERROR', error);
            throw error;
        }
    }
} 