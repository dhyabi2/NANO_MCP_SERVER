import fetch from 'node-fetch';
import { tools } from 'nanocurrency';
import { convert } from 'nanocurrency-web';
import { config } from '../config/global';
export class NanoTransactions {
    apiUrl;
    rpcKey;
    gpuKey;
    defaultRepresentative;
    constructor(customConfig) {
        const globalConfig = config.getNanoConfig();
        this.apiUrl = customConfig?.apiUrl || globalConfig.rpcUrl;
        this.rpcKey = customConfig?.rpcKey || globalConfig.rpcKey;
        this.gpuKey = customConfig?.gpuKey || globalConfig.gpuKey;
        this.defaultRepresentative = customConfig?.defaultRepresentative || globalConfig.defaultRepresentative;
        const errors = config.validateConfig();
        if (errors.length > 0) {
            throw new Error(`Configuration errors: ${errors.join(', ')}`);
        }
    }
    async rpcCall(action, params = {}) {
        const response = await fetch(this.apiUrl, {
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
        return response.json();
    }
    async generateWork(hash) {
        const response = await fetch('https://gpuwork.nano.to/work', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.gpuKey}`
            },
            body: JSON.stringify({ hash })
        });
        if (!response.ok) {
            throw new Error('Work generation failed');
        }
        const result = await response.json();
        return result.work;
    }
    async getAccountInfo(account) {
        return this.rpcCall('account_info', {
            account,
            representative: true,
            pending: true,
            weight: true
        });
    }
    async getPendingBlocks(account) {
        return this.rpcCall('pending', {
            account,
            count: 10,
            source: true
        });
    }
    async createOpenBlock(address, privateKey, sourceBlock, sourceAmount) {
        const publicKey = tools.getPublicKey(privateKey);
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
        const signature = tools.sign(JSON.stringify(block), privateKey);
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
        const publicKey = tools.getPublicKey(privateKey);
        const account = fromAddress; // Use provided address
        if (!tools.validateAddress(account)) {
            throw new Error('Invalid sender address');
        }
        const previous = accountInfo.frontier;
        const rawAmount = convert('NANO', 'raw', amount);
        const balance = (BigInt(accountInfo.balance) - BigInt(rawAmount)).toString();
        const work = await this.generateWork(previous);
        const block = {
            type: 'state',
            account,
            previous,
            representative: accountInfo.representative,
            balance,
            link: tools.getPublicKey(toAddress)
        };
        const signature = tools.sign(JSON.stringify(block), privateKey);
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
        const pending = await this.getPendingBlocks(address);
        const accountInfo = await this.getAccountInfo(address);
        const results = [];
        for (const [hash, details] of Object.entries(pending.blocks)) {
            const previous = accountInfo.frontier;
            const work = await this.generateWork(previous);
            const newBalance = (BigInt(accountInfo.balance) + BigInt(details.amount)).toString();
            const block = {
                type: 'state',
                account: address,
                previous,
                representative: accountInfo.representative,
                balance: newBalance,
                link: hash
            };
            const signature = tools.sign(JSON.stringify(block), privateKey);
            const result = await this.rpcCall('process', {
                json_block: 'true',
                subtype: 'receive',
                block: {
                    ...block,
                    signature,
                    work
                }
            });
            results.push(result);
        }
        return results;
    }
}
