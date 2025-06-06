"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyManager = void 0;
const nanoWeb = __importStar(require("nanocurrency-web"));
class KeyManager {
    constructor(logger) {
        this.logger = logger;
    }
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
        }
        catch (error) {
            this.logger.logError('KEY_GENERATION_ERROR', error);
            throw error;
        }
    }
    validateKeyFormat(privateKey) {
        return /^[0-9A-F]{64}$/i.test(privateKey);
    }
    async verifyKeyPair(privateKey, publicKey) {
        try {
            const wallet = await nanoWeb.wallet.generate(privateKey);
            const derivedPublicKey = wallet.accounts[0].publicKey;
            return derivedPublicKey === publicKey;
        }
        catch (error) {
            this.logger.logError('KEY_VERIFICATION_ERROR', error);
            return false;
        }
    }
    async signBlock(block, privateKey) {
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
            }
            else if (block.subtype === 'receive' || block.subtype === 'open') {
                signedBlock = nanoWeb.block.receive(blockData, privateKey);
            }
            else {
                throw new Error(`Unsupported block type: ${block.subtype}`);
            }
            return signedBlock;
        }
        catch (error) {
            this.logger.logError('BLOCK_SIGNING_ERROR', error);
            throw error;
        }
    }
}
exports.KeyManager = KeyManager;
