import fetch from 'node-fetch';
import { tools, wallet } from 'nanocurrency-web';
import { config } from '../config/global';
import { ConfigValidationResult } from '../types/config';
import { AccountInfo, Block, PendingBlocks } from '../types/nano';
import { BigNumber } from 'bignumber.js';

export class NanoTransactions {
    private apiUrl: string;
    private rpcKey: string;
    private gpuKey: string;
    private defaultRepresentative: string;
    private config: any;

    constructor(customConfig?: Partial<{
        apiUrl: string;
        rpcKey: string;
        gpuKey: string;
        defaultRepresentative: string;
    }>, config?: any) {
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

    private async rpcCall<T>(action: string, params: Record<string, any> = {}): Promise<T> {
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

        const data = await response.json();
        return data as T;
    }

    async validateConfig(errors: string[]): Promise<ConfigValidationResult> {
        if (errors.length > 0) {
            throw new Error(`Configuration errors: ${errors.join(', ')}`);
        }
        return { isValid: true, errors: [], warnings: [] };
    }

    async generateWork(hash: string): Promise<string> {
        const result = await this.makeRequest('work_generate', { hash });
        return result.work as string;
    }

    async getAccountInfo(account: string): Promise<AccountInfo> {
        const info = await this.makeRequest('account_info', { account });
        return info as AccountInfo;
    }

    async getPendingBlocks(account: string): Promise<PendingBlocks> {
        const pending = await this.makeRequest('pending', { account });
        return pending as PendingBlocks;
    }

    async createOpenBlock(address: string, privateKey: string, sourceBlock: string, sourceAmount: string): Promise<Block> {
        const walletData = await wallet.generate(privateKey);
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

        const signature = tools.sign(privateKey, tools.blake2b(JSON.stringify(block)));

        return this.rpcCall<Block>('process', {
            json_block: 'true',
            subtype: 'open',
            block: {
                ...block,
                signature,
                work
            }
        });
    }

    async createSendBlock(fromAddress: string, privateKey: string, toAddress: string, amount: string, accountInfo: AccountInfo): Promise<Block> {
        const walletData = await wallet.generate(privateKey);
        const publicKey = walletData.accounts[0].publicKey;
        const account = fromAddress;

        if (!tools.validateAddress(toAddress)) {
            throw new Error('Invalid sender address');
        }

        const previous = accountInfo.frontier;
        const rawAmount = tools.convert(amount, 'NANO', 'raw');
        const balance = (BigInt(accountInfo.balance) - BigInt(rawAmount)).toString();
        
        const work = await this.generateWork(previous);
        
        const recipientWallet = await wallet.generate(toAddress);
        const recipientPublicKey = recipientWallet.accounts[0].publicKey;
        
        const block = {
            type: 'state',
            account,
            previous,
            representative: accountInfo.representative,
            balance,
            link: recipientPublicKey
        };

        const signature = tools.sign(privateKey, tools.blake2b(JSON.stringify(block)));

        return this.rpcCall<Block>('process', {
            json_block: 'true',
            subtype: 'send',
            block: {
                ...block,
                signature,
                work
            }
        });
    }

    async receiveAllPending(address: string, privateKey: string): Promise<Block[]> {
        const accountInfo = await this.getAccountInfo(address) as AccountInfo;
        const pending = await this.getPendingBlocks(address) as PendingBlocks;
        const blocks: Block[] = [];

        for (const [hash, details] of Object.entries(pending.blocks)) {
            const previous = accountInfo.frontier;
            const representative = accountInfo.representative;
            const newBalance = (BigInt(accountInfo.balance) + BigInt((details as any).amount)).toString();

            const block: Block = {
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

    private async makeRequest(method: string, params: any): Promise<any> {
        // Implementation
        return {};
    }
} 