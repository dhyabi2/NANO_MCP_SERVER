"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NanoTransactions = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const nanocurrency_web_1 = require("nanocurrency-web");
class NanoTransactions {
    constructor(customConfig, config) {
        const globalConfig = config.getNanoConfig();
        this.apiUrl = customConfig?.apiUrl || globalConfig.rpcUrl;
        this.rpcKey = customConfig?.rpcKey || globalConfig.rpcKey;
        this.gpuKey = customConfig?.gpuKey || globalConfig.gpuKey;
        this.defaultRepresentative = customConfig?.defaultRepresentative || globalConfig.defaultRepresentative;
        this.config = config;
        const errors = config.validateConfig();
        if (errors.length > 0) {
            throw new Error(`Configuration errors: ${errors.join(', ')}`);
        }
    }
    async rpcCall(action, params = {}) {
        const response = await (0, node_fetch_1.default)(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.rpcKey}`
            },
            body: JSON.stringify({
                action,
                ...params
            })
        });
        if (!response.ok) {
            throw new Error(`RPC call failed: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    }
    async validateConfig(errors) {
        if (errors.length > 0) {
            throw new Error(`Configuration errors: ${errors.join(', ')}`);
        }
        return { isValid: true, errors: [], warnings: [] };
    }
    async generateWork(hash) {
        const result = await this.makeRequest('work_generate', { hash });
        return result.work;
    }
    async getAccountInfo(account) {
        const info = await this.makeRequest('account_info', { account });
        return info;
    }
    async getPendingBlocks(account) {
        const pending = await this.makeRequest('pending', { account });
        return pending;
    }
    async createOpenBlock(address, privateKey, sourceBlock, sourceAmount) {
        const walletData = await nanocurrency_web_1.wallet.generate(privateKey);
        const publicKey = walletData.accounts[0].publicKey;
        const account = address;
        const previous = '0000000000000000000000000000000000000000000000000000000000000000';
        const representative = this.defaultRepresentative;
        const work = await this.generateWork(previous);
        const block = {
            type: 'state',
            account,
            previous,
            representative,
            balance: sourceAmount,
            link: sourceBlock
        };
        const signature = nanocurrency_web_1.tools.sign(privateKey, nanocurrency_web_1.tools.blake2b(JSON.stringify(block)));
        return this.rpcCall('process', {
            json_block: 'true',
            subtype: 'open',
            block: {
                ...block,
                signature,
                work
            }
        });
    }
    async createSendBlock(fromAddress, privateKey, toAddress, amount, accountInfo) {
        const walletData = await nanocurrency_web_1.wallet.generate(privateKey);
        const publicKey = walletData.accounts[0].publicKey;
        const account = fromAddress;
        if (!nanocurrency_web_1.tools.validateAddress(toAddress)) {
            throw new Error('Invalid sender address');
        }
        const previous = accountInfo.frontier;
        const rawAmount = nanocurrency_web_1.tools.convert(amount, 'NANO', 'raw');
        const balance = (BigInt(accountInfo.balance) - BigInt(rawAmount)).toString();
        const work = await this.generateWork(previous);
        const recipientWallet = await nanocurrency_web_1.wallet.generate(toAddress);
        const recipientPublicKey = recipientWallet.accounts[0].publicKey;
        const block = {
            type: 'state',
            account,
            previous,
            representative: accountInfo.representative,
            balance,
            link: recipientPublicKey
        };
        const signature = nanocurrency_web_1.tools.sign(privateKey, nanocurrency_web_1.tools.blake2b(JSON.stringify(block)));
        return this.rpcCall('process', {
            json_block: 'true',
            subtype: 'send',
            block: {
                ...block,
                signature,
                work
            }
        });
    }
    async receiveAllPending(address, privateKey) {
        const accountInfo = await this.getAccountInfo(address);
        const pending = await this.getPendingBlocks(address);
        const blocks = [];
        for (const [hash, details] of Object.entries(pending.blocks)) {
            const previous = accountInfo.frontier;
            const representative = accountInfo.representative;
            const newBalance = (BigInt(accountInfo.balance) + BigInt(details.amount)).toString();
            const block = {
                type: 'state',
                account: address,
                previous,
                representative,
                balance: newBalance,
                link: hash
            };
            blocks.push(block);
        }
        return blocks;
    }
    async makeRequest(method, params) {
        // Implementation
        return {};
    }
}
exports.NanoTransactions = NanoTransactions;
