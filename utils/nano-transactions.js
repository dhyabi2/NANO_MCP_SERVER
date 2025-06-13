// WARNING: This file is locked and should not be modified in the future.
// Any changes to this file may affect the compatibility of nano-mcp.
// Please refer to the documentation for any updates or modifications.

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NanoTransactions = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const nanocurrency_web_1 = require("nanocurrency-web");
const nanocurrency = require('nanocurrency');
const { block } = require('nanocurrency-web');
class NanoTransactions {
    /**
     * Constructs a NanoTransactions instance with custom and global configuration.
     * @param {Object} customConfig - Custom configuration for this instance.
     * @param {Object} config - Optional global configuration object.
     */
    constructor(customConfig, config) {
        const globalConfig = config?.getNanoConfig() || {};
        this.apiUrl = customConfig?.apiUrl || globalConfig.rpcUrl || 'https://rpc.nano.to';
        this.rpcKey = customConfig?.rpcKey || globalConfig.rpcKey || 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23';
        this.gpuKey = customConfig?.gpuKey || globalConfig.gpuKey;
        this.defaultRepresentative = customConfig?.defaultRepresentative || globalConfig.defaultRepresentative || 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf';
        this.config = config;
        if (config) {
            const errors = config.validateConfig();
            if (errors.length > 0) {
                throw new Error(`Configuration errors: ${errors.join(', ')}`);
            }
        }
    }
    /**
     * Makes a generic RPC call to the configured Nano node.
     * @param {string} action - The RPC action to perform.
     * @param {Object} params - Additional parameters for the RPC call.
     * @returns {Promise<Object>} - The response from the Nano node.
     */
    async rpcCall(action, params = {}) {
        console.log('Making RPC call:', { action, ...params });
        const response = await (0, node_fetch_1.default)(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action,
                ...params,
                key: this.rpcKey
            })
        });
        if (!response.ok) {
            throw new Error(`RPC call failed: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('RPC Response:', data);
        return data;
    }
    /**
     * Validates the provided configuration and throws if errors are found.
     * @param {Array<string>} errors - List of configuration errors.
     * @returns {Promise<Object>} - Validation result object.
     */
    async validateConfig(errors) {
        if (errors?.length > 0) {
            throw new Error(`Configuration errors: ${errors.join(', ')}`);
        }
        return { isValid: true, errors: [], warnings: [] };
    }
    /**
     * Retrieves account information for a given Nano account.
     * @param {string} account - The Nano account address.
     * @returns {Promise<Object>} - Account information from the node.
     */
    async getAccountInfo(account) {
        const info = await this.rpcCall('account_info', { account });
        return info;
    }
    /**
     * Retrieves pending (unreceived) blocks for a given Nano account.
     * @param {string} account - The Nano account address.
     * @returns {Promise<Object>} - Pending blocks information.
     */
    async getPendingBlocks(account) {
        const pending = await this.rpcCall('pending', { 
            account,
            count: '1',
            source: 'true'
        });
        return pending;
    }
    /**
     * Generates proof-of-work for a given hash, with difficulty based on block type.
     * @param {string} hash - The hash to generate work for.
     * @param {boolean} isOpen - Whether this is for an open block (lower difficulty).
     * @returns {Promise<string>} - The generated work value.
     */
    async generateWork(hash, isOpen = false) {
        if (!hash) {
            throw new Error('Hash is required for work generation');
        }
        console.log('Generating work for hash:', hash);
        const workResult = await this.rpcCall('work_generate', {
            hash,
            key: this.rpcKey,
            difficulty: isOpen ? 'fffffe0000000000' : 'fffffff800000000' // Use lower difficulty for receive blocks
        });
        if (!workResult.work) {
            throw new Error('Failed to generate work');
        }
        return workResult.work;
    }
    /**
     * Creates and processes a receive (or open) block for a pending transaction.
     * Handles both new and existing accounts, calculates the correct new balance, and submits the block.
     * @param {string} account - The Nano account address.
     * @param {string} privateKey - The private key for signing the block.
     * @param {string} pendingBlock - The hash of the pending block to receive.
     * @param {string|number|BigInt} pendingAmount - The amount to receive (in raw).
     * @param {Object|null} accountInfo - Optional account info; if null, treated as a new account.
     * @returns {Promise<Object>} - The result of the process RPC call.
     */
    async createReceiveBlock(account, privateKey, pendingBlock, pendingAmount, accountInfo = null) {
        try {
            // For first receive (opening account), use the account's public key
            // For subsequent receives, use the account's frontier
            let workHash;
            if (accountInfo && !accountInfo.error) {
                workHash = accountInfo.frontier;
                console.log('Using frontier as work hash:', workHash);
            } else {
                // For new accounts, we need to use the account's public key
                console.log('Account for public key derivation:', account);
                workHash = nanocurrency_web_1.tools.addressToPublicKey(account);
                console.log('Derived public key from address:', workHash);
            }
            
            if (!workHash) {
                throw new Error('Failed to determine work hash');
            }
            
            console.log('Using work hash:', workHash);

            // Generate work with appropriate difficulty
            const work = await this.rpcCall('work_generate', {
                hash: workHash,
                difficulty: !accountInfo || accountInfo.error ? 'fffffe0000000000' : 'fffffff800000000' // Lower difficulty for open blocks
            });

            if (!work.work) {
                throw new Error('Failed to generate work');
            }

            // Ensure account is in nano_ format
            const nanoAccount = account.replace('xrb_', 'nano_');
            
            // Get the representative
            let representative = this.defaultRepresentative;
            if (accountInfo && !accountInfo.error && accountInfo.representative) {
                representative = accountInfo.representative;
            }
            console.log('Using representative:', representative);

            // Calculate new balance
            let newBalance;
            if (accountInfo && !accountInfo.error) {
                // For existing accounts, add pending amount to current balance
                newBalance = (BigInt(accountInfo.balance) + BigInt(pendingAmount)).toString();
            } else {
                // For new accounts, balance is just the pending amount
                newBalance = pendingAmount;
            }
            console.log('New balance:', newBalance);

            // Prepare block data for block.receive
            const receiveBlockData = {
                walletBalanceRaw: accountInfo && !accountInfo.error ? accountInfo.balance : '0',
                toAddress: nanoAccount,
                representativeAddress: representative,
                frontier: accountInfo && !accountInfo.error ? accountInfo.frontier : '0000000000000000000000000000000000000000000000000000000000000000',
                transactionHash: pendingBlock,
                amountRaw: pendingAmount,
                work: work.work
            };

            console.log('Block data for nanocurrency-web:', receiveBlockData);

            // Sign the block using nanocurrency-web's block.receive
            const signedBlock = block.receive(receiveBlockData, privateKey);
            console.log('Signed block:', signedBlock);

            // Process the block using the signed block
            const processResult = await this.rpcCall('process', {
                json_block: 'true',
                subtype: accountInfo && !accountInfo.error ? 'receive' : 'open',
                block: signedBlock
            });

            if (processResult.error) {
                throw new Error(`Failed to process block: ${processResult.error}`);
            }

            return processResult;
        } catch (error) {
            console.error('Error in createReceiveBlock:', error);
            throw error;
        }
    }
    /**
     * Receives all pending blocks for a given account, processing each one sequentially.
     * @param {string} address - The Nano account address.
     * @param {string} privateKey - The private key for signing receive blocks.
     * @returns {Promise<Array<Object>>} - Results of processing each pending block.
     */
    async receiveAllPending(address, privateKey) {
        // Get account info
        let accountInfo;
        try {
            accountInfo = await this.getAccountInfo(address);
        } catch (error) {
            // Account not opened yet, which is fine
            accountInfo = null;
        }

        // Get pending blocks
        const pending = await this.getPendingBlocks(address);
        
        const results = [];
        if (pending.blocks && Object.keys(pending.blocks).length > 0) {
            for (const [hash, blockInfo] of Object.entries(pending.blocks)) {
                try {
                    // Convert raw amount to nano for display
                    const rawToNanoResult = await this.rpcCall('raw_to_nano', {
                        amount: blockInfo.amount
                    });
                    console.log(`Receiving ${rawToNanoResult.nano} NANO from block ${hash}`);

                    const result = await this.createReceiveBlock(
                        address,
                        privateKey,
                        hash,
                        blockInfo.amount,
                        accountInfo
                    );
                    results.push(result);
                    
                    // Update accountInfo for next iteration if the block was processed
                    if (result.hash) {
                        try {
                            accountInfo = await this.getAccountInfo(address);
                        } catch (error) {
                            console.error('Failed to update account info:', error);
                        }
                    }
                } catch (error) {
                    console.error('Failed to process pending block:', error);
                    results.push({ error: error.message });
                }
            }
        }
        return results;
    }
    /**
     * Generates a new Nano wallet (seed, account, private/public key).
     * @returns {Promise<Object>} - The generated wallet information.
     */
    async generateWallet() {
        const walletData = nanocurrency_web_1.wallet.generateLegacy();
        return {
            address: walletData.accounts[0].address,
            privateKey: walletData.accounts[0].privateKey,
            publicKey: walletData.accounts[0].publicKey,
            seed: walletData.seed
        };
    }
    /**
     * Makes a generic RPC request to the Nano node.
     * @param {string} method - The RPC method/action.
     * @param {Object} params - Parameters for the RPC call.
     * @returns {Promise<Object>} - The response from the Nano node.
     */
    async makeRequest(method, params) {
        return this.rpcCall(method, params);
    }
    /**
     * Sends a transaction from one Nano account to another.
     * Handles work generation, block signing, and submission.
     * @param {string} fromAddress - The sender's Nano account address.
     * @param {string} privateKey - The sender's private key.
     * @param {string} toAddress - The recipient's Nano account address.
     * @param {string|number|BigInt} amountRaw - The amount to send (in raw).
     * @returns {Promise<Object>} - Success status and block hash or error message.
     */
    async sendTransaction(fromAddress, privateKey, toAddress, amountRaw) {
        try {
            const formattedFromAddress = fromAddress.replace('xrb_', 'nano_');
            const formattedToAddress = toAddress.replace('xrb_', 'nano_');
            // Ensure amountRaw is a string
            const amountRawString = amountRaw.toString();

            // Get account info for current balance and frontier
            const accountInfo = await this.makeRequest('account_info', {
                account: formattedFromAddress,
                representative: true,
                json_block: 'true'
            });
            
            if (accountInfo.error) {
                if (accountInfo.error === 'Account not found') {
                    throw new Error('Account has no previous blocks. Please make sure it has received some NANO first.');
                }
                throw new Error(accountInfo.error);
            }

            console.log('Account info:', accountInfo);

            // Calculate new balance after sending
            const currentBalance = BigInt(accountInfo.balance);
            const sendAmount = BigInt(amountRawString);
            const newBalance = (currentBalance - sendAmount).toString();

            console.log('Current balance:', currentBalance.toString());
            console.log('Send amount:', sendAmount.toString());
            console.log('New balance after send:', newBalance);

            // Generate work
            const workData = await this.makeRequest('work_generate', {
                hash: accountInfo.frontier,
                difficulty: 'fffffff800000000'  // Higher difficulty for send blocks
            });

            if (!workData || !workData.work) {
                throw new Error('Failed to generate work');
            }

            // Get the representative
            let representative = this.defaultRepresentative;
            if (accountInfo && accountInfo.representative) {
                representative = accountInfo.representative;
            }
            console.log('Using representative:', representative);

            // Prepare block data
            const blockData = {
                walletBalanceRaw: newBalance,
                fromAddress: formattedFromAddress,
                toAddress: formattedToAddress,
                representativeAddress: representative,
                frontier: accountInfo.frontier,
                amountRaw: amountRawString,
                work: workData.work
            };

            console.log('Block data for send:', blockData);

            // Sign the block using nanocurrency-web
            const signedBlock = nanocurrency_web_1.block.send(blockData, privateKey);
            console.log('Signed block:', signedBlock);

            // Process the block
            const processResult = await this.makeRequest('process', {
                json_block: 'true',
                subtype: 'send',
                block: signedBlock
            });

            if (processResult.error) {
                throw new Error(processResult.error);
            }

            return { success: true, hash: processResult.hash };
        } catch (error) {
            console.error('Send Transaction Error:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Retrieves the balance for a given Nano account.
     * @param {string} account - The Nano account address.
     * @returns {Promise<Object>} - Balance information from the node.
     */
    async getBalance(account) {
        const balance = await this.rpcCall('account_balance', { account });
        return {
            balance: balance.balance,
            pending: balance.pending
        };
    }
}
exports.NanoTransactions = NanoTransactions;
