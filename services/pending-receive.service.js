const { wallet, tools, block } = require('nanocurrency-web');
const { makeRPCCall } = require('../utils/rpc-helper');
const config = require('../config/pending-receive.config');

class PendingReceiveService {
    constructor() {
        this.config = config;
    }

    /**
     * Get pending blocks for an account
     * @param {string} account - The account address
     * @returns {Promise<Object>} Pending blocks information
     */
    async getPendingBlocks(account) {
        try {
            const pending = await makeRPCCall(this.config.rpcNodes[0], {
                action: 'pending',
                account,
                count: this.config.maxPendingBlocks.toString(),
                source: 'true',
                include_active: 'true',
                sorting: 'true',
                threshold: '1'  // Minimum amount in raw
            }, this.config.rpcKey);

            return pending;
        } catch (error) {
            throw new Error(`Failed to get pending blocks: ${error.message}`);
        }
    }

    /**
     * Generate work for receiving blocks
     * @param {string} hash - Hash to generate work for
     * @param {boolean} isOpen - Whether this is an open block
     * @returns {Promise<string>} Generated work
     */
    async generateWork(hash, isOpen = false) {
        try {
            const difficulty = isOpen ? this.config.workDifficulty.open : this.config.workDifficulty.receive;
            const workResult = await makeRPCCall(this.config.rpcNodes[0], {
                action: 'work_generate',
                hash,
                difficulty
            }, this.config.rpcKey);

            if (!workResult.work) {
                throw new Error('Work generation failed');
            }

            return workResult.work;
        } catch (error) {
            throw new Error(`Work generation failed: ${error.message}`);
        }
    }

    /**
     * Process a single pending block
     * @param {string} account - Account address
     * @param {string} privateKey - Account private key
     * @param {string} pendingHash - Hash of pending block
     * @param {string} pendingAmount - Amount in raw
     * @param {Object} accountInfo - Account information
     * @returns {Promise<Object>} Processing result
     */
    async processPendingBlock(account, privateKey, pendingHash, pendingAmount, accountInfo = null) {
        try {
            const isNewAccount = !accountInfo || accountInfo.error;
            const workHash = isNewAccount ? 
                tools.addressToPublicKey(account) : 
                accountInfo.frontier;

            const work = await this.generateWork(workHash, isNewAccount);
            
            const representative = isNewAccount ? 
                this.config.defaultRepresentative : 
                accountInfo.representative;

            const blockData = {
                walletBalanceRaw: isNewAccount ? '0' : accountInfo.balance,
                toAddress: account,
                representativeAddress: representative,
                frontier: isNewAccount ? '0'.repeat(64) : accountInfo.frontier,
                transactionHash: pendingHash,
                amountRaw: pendingAmount,
                work
            };

            const signedBlock = block.receive(blockData, privateKey);

            const processResult = await makeRPCCall(this.config.rpcNodes[0], {
                action: 'process',
                json_block: 'true',
                subtype: isNewAccount ? 'open' : 'receive',
                block: signedBlock
            }, this.config.rpcKey);

            return processResult;
        } catch (error) {
            throw new Error(`Failed to process pending block: ${error.message}`);
        }
    }

    /**
     * Receive all pending blocks for an account
     * @param {string} account - Account address
     * @param {string} privateKey - Account private key
     * @returns {Promise<Object>} Processing results
     */
    async receiveAllPending(account, privateKey) {
        try {
            let accountInfo;
            try {
                accountInfo = await makeRPCCall(this.config.rpcNodes[0], {
                    action: 'account_info',
                    account
                }, this.config.rpcKey);
            } catch (error) {
                // Account might not exist yet, which is fine
                accountInfo = null;
            }

            const pending = await this.getPendingBlocks(account);
            const results = {
                processed: [],
                failed: [],
                total: 0,
                successful: 0,
                failed_count: 0
            };

            if (pending.blocks && Object.keys(pending.blocks).length > 0) {
                results.total = Object.keys(pending.blocks).length;

                for (const [hash, blockInfo] of Object.entries(pending.blocks)) {
                    try {
                        const result = await this.processPendingBlock(
                            account,
                            privateKey,
                            hash,
                            blockInfo.amount,
                            accountInfo
                        );

                        results.processed.push({
                            hash,
                            amount: blockInfo.amount,
                            result
                        });
                        results.successful++;

                        // Update account info for next iteration
                        if (result.hash) {
                            accountInfo = await makeRPCCall(this.config.rpcNodes[0], {
                                action: 'account_info',
                                account
                            }, this.config.rpcKey);
                        }
                    } catch (error) {
                        results.failed.push({
                            hash,
                            amount: blockInfo.amount,
                            error: error.message
                        });
                        results.failed_count++;
                    }
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to receive pending blocks: ${error.message}`);
        }
    }
}

module.exports = new PendingReceiveService();
