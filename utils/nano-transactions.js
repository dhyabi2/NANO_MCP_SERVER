// WARNING: This file is locked and should not be modified in the future.
// Any changes to this file may affect the compatibility of nano-mcp.
// Please refer to the documentation for any updates or modifications.

// ⚠️⚠️⚠️ CRITICAL: RPC NODE CONFIGURATION ⚠️⚠️⚠️
// ⚠️ DO NOT CHANGE THE RPC NODE: https://uk1.public.xnopay.com/proxy
// ⚠️ DO NOT add fallback nodes or alternative RPC endpoints
// ⚠️ This node has been specifically configured by the user
// ⚠️ Work generation is done LOCALLY - not on the RPC node
// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️

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
const { EnhancedErrorHandler } = require('./error-handler');
const { BalanceConverter } = require('./balance-converter');
class NanoTransactions {
    /**
     * Constructs a NanoTransactions instance with custom and global configuration.
     * @param {Object} customConfig - Custom configuration for this instance.
     * @param {Object} config - Optional global configuration object.
     */
    constructor(customConfig, config) {
        const globalConfig = config?.getNanoConfig() || {};
        this.rpcNodes = customConfig?.rpcNodes || [customConfig?.apiUrl] || [globalConfig.rpcUrl] || ['https://rpc.nano.to'];
        this.currentNodeIndex = 0;
        // Allow null rpcKey to be explicitly set
        this.rpcKey = customConfig?.hasOwnProperty('rpcKey') ? customConfig.rpcKey : (globalConfig.rpcKey || null);
        this.gpuKey = customConfig?.gpuKey || globalConfig.gpuKey;
        this.defaultRepresentative = customConfig?.defaultRepresentative || globalConfig.defaultRepresentative || 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf';
        this.config = config;
        if (config) {
            const errors = config.validateConfig();
            if (errors.length > 0) {
                throw new Error(`Configuration errors: ${errors.join(', ')}`);
            }
        }
        this.failoverAttempts = 0;
        this.maxFailoverAttempts = this.rpcNodes.length * 2; // Try each node twice before giving up
    }

    async getCurrentRpcNode() {
        return this.rpcNodes[this.currentNodeIndex];
    }

    switchToNextNode() {
        this.currentNodeIndex = (this.currentNodeIndex + 1) % this.rpcNodes.length;
        console.log(`Switching to RPC node: ${this.rpcNodes[this.currentNodeIndex]}`);
    }

    /**
     * Makes a generic RPC call to the configured Nano node.
     * @param {string} action - The RPC action to perform.
     * @param {Object} params - Additional parameters for the RPC call.
     * @returns {Promise<Object>} - The response from the Nano node.
     */
    async rpcCall(action, params = {}) {
        let lastError = null;
        this.failoverAttempts = 0;

        while (this.failoverAttempts < this.maxFailoverAttempts) {
            const currentNode = await this.getCurrentRpcNode();
            console.log(`Making RPC call to ${currentNode}:`, { action, ...params });

            try {
                const requestBody = {
                    action,
                    ...params
                };
                
                // Only include key if it's not null
                if (this.rpcKey) {
                    requestBody.key = this.rpcKey;
                }
                
                const response = await node_fetch_1.default(currentNode, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                // Check for rate limiting response
                if (response.status === 429) {
                    console.log('Rate limit hit, switching nodes...');
                    this.switchToNextNode();
                    this.failoverAttempts++;
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`RPC call failed: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('RPC Response:', data);

                // Reset failover attempts on successful call
                this.failoverAttempts = 0;
                return data;
            } catch (error) {
                console.error(`Error with RPC node ${currentNode}:`, error.message);
                lastError = error;
                this.switchToNextNode();
                this.failoverAttempts++;
            }
        }

        // If we've tried all nodes and still failed, throw the last error
        throw new Error(`All RPC nodes failed. Last error: ${lastError?.message}`);
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
     * Uses LOCAL computation - does NOT rely on RPC node for work generation.
     * ⚠️ DO NOT change this to use remote work generation from RPC nodes.
     * @param {string} hash - The hash to generate work for.
     * @param {boolean} isOpen - Whether this is for an open block (lower difficulty).
     * @returns {Promise<string>} - The generated work value.
     */
    async generateWork(hash, isOpen = false) {
        if (!hash) {
            throw new Error('Hash is required for work generation');
        }
        console.log('Generating work LOCALLY for hash:', hash);
        
        try {
            // Ensure nanocurrency library is initialized
            if (!nanocurrency.isReady()) {
                console.log('Initializing nanocurrency library...');
                await nanocurrency.init();
                console.log('Nanocurrency library initialized');
            }
            
            // Use nanocurrency's local work generation (CPU-based)
            // This computes work locally without relying on RPC nodes
            console.log('Computing work (this may take a few seconds)...');
            const work = await nanocurrency.work(hash);
            
            if (!work) {
                throw new Error('Work generation returned null - threshold not met');
            }
            
            console.log('Work generated locally:', work);
            return work;
        } catch (error) {
            console.error('Local work generation failed:', error);
            throw new Error(`Failed to generate work locally: ${error.message}`);
        }
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

            // Generate work LOCALLY - does not use RPC node
            console.log('Generating work locally...');
            const workValue = await this.generateWork(workHash, !accountInfo || accountInfo.error);
            
            const work = { work: workValue };

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
                    // Log the raw amount (avoid RPC call for conversion)
                    console.log(`Receiving ${blockInfo.amount} raw from block ${hash}`);

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
     * Initializes a NANO account by receiving the first pending block.
     * This is used to open/activate a new account that has received funds.
     * @param {string} address - The Nano account address to initialize.
     * @param {string} privateKey - The private key for signing the block.
     * @returns {Promise<Object>} - Initialization result with status and details.
     */
    async initializeAccount(address, privateKey) {
        try {
            // Check if account is already initialized
            let accountInfo;
            try {
                accountInfo = await this.getAccountInfo(address);
                if (accountInfo && !accountInfo.error) {
                    return {
                        initialized: true,
                        alreadyInitialized: true,
                        message: 'Account is already initialized',
                        representative: accountInfo.representative,
                        balance: accountInfo.balance,
                        frontier: accountInfo.frontier
                    };
                }
            } catch (error) {
                // Account doesn't exist yet, which is expected
                console.log('Account not yet initialized, checking for pending blocks...');
            }

            // Get pending blocks to initialize the account
            const pending = await this.getPendingBlocks(address);
            
            if (!pending.blocks || Object.keys(pending.blocks).length === 0) {
                return {
                    initialized: false,
                    message: 'No pending blocks to initialize the account. Send some NANO to this address first.',
                    address: address
                };
            }

            // Process the first pending block to initialize the account
            const firstBlockHash = Object.keys(pending.blocks)[0];
            const firstBlockInfo = pending.blocks[firstBlockHash];
            
            console.log(`Initializing account with pending block ${firstBlockHash}...`);
            
            const result = await this.createReceiveBlock(
                address,
                privateKey,
                firstBlockHash,
                firstBlockInfo.amount,
                null // null accountInfo indicates this is a new account
            );

            if (result.hash) {
                // Get updated account info
                const updatedAccountInfo = await this.getAccountInfo(address);
                return {
                    initialized: true,
                    alreadyInitialized: false,
                    message: 'Account successfully initialized',
                    blockHash: result.hash,
                    representative: updatedAccountInfo.representative || this.defaultRepresentative,
                    balance: updatedAccountInfo.balance,
                    frontier: updatedAccountInfo.frontier
                };
            } else {
                throw new Error('Failed to process initialization block');
            }
        } catch (error) {
            console.error('Error initializing account:', error);
            throw new Error(`Failed to initialize account: ${error.message}`);
        }
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
            // Ensure all parameters are properly typed
            const formattedFromAddress = String(fromAddress).replace('xrb_', 'nano_');
            const formattedToAddress = String(toAddress).replace('xrb_', 'nano_');
            const privateKeyString = String(privateKey);
            const amountRawString = String(amountRaw);

            // IMPORTANT: Check for pending blocks and receive them first
            console.log('Checking for pending blocks before sending...');
            const pending = await this.getPendingBlocks(formattedFromAddress);
            
            if (pending.blocks && Object.keys(pending.blocks).length > 0) {
                console.log(`Found ${Object.keys(pending.blocks).length} pending block(s). Receiving them first...`);
                const receiveResults = await this.receiveAllPending(formattedFromAddress, privateKeyString);
                console.log('Received all pending blocks:', receiveResults);
                
                // Wait a moment for the account to update
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                console.log('No pending blocks to receive.');
            }

            // Get account info for current balance and frontier
            const accountInfo = await this.makeRequest('account_info', {
                account: formattedFromAddress,
                representative: true,
                json_block: 'true'
            });
            
            if (accountInfo.error) {
                if (accountInfo.error === 'Account not found') {
                    // Check if there are pending blocks to initialize with
                    const pendingCheck = await this.getPendingBlocks(formattedFromAddress);
                    return EnhancedErrorHandler.accountNotInitialized(formattedFromAddress, pendingCheck);
                }
                throw new Error(accountInfo.error);
            }

            console.log('Account info:', accountInfo);

            // Calculate new balance after sending
            const currentBalance = BigInt(accountInfo.balance);
            const sendAmount = BigInt(amountRawString);
            
            // Check if sufficient balance BEFORE attempting transaction
            if (currentBalance < sendAmount) {
                console.log('Insufficient balance detected');
                return EnhancedErrorHandler.insufficientBalance(
                    accountInfo.balance,
                    amountRawString,
                    formattedFromAddress
                );
            }
            
            const newBalance = (currentBalance - sendAmount).toString();

            console.log('Current balance:', currentBalance.toString());
            console.log('Send amount:', sendAmount.toString());
            console.log('New balance after send:', newBalance);

            // Generate work LOCALLY - does not use RPC node
            console.log('Generating work locally for send transaction...');
            const workValue = await this.generateWork(accountInfo.frontier, false);
            const workData = { work: workValue };

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
            const signedBlock = nanocurrency_web_1.block.send(blockData, privateKeyString);
            console.log('Signed block:', signedBlock);

            // Process the block
            const processResult = await this.makeRequest('process', {
                json_block: 'true',
                subtype: 'send',
                block: signedBlock
            });

            if (processResult.error) {
                // Handle blockchain errors with enhanced messaging
                return EnhancedErrorHandler.blockchainError(
                    processResult.error,
                    'send transaction',
                    {
                        fromAddress: formattedFromAddress,
                        toAddress: formattedToAddress,
                        amountRaw: amountRawString,
                        currentBalance: accountInfo.balance
                    }
                );
            }

            return { success: true, hash: processResult.hash };
        } catch (error) {
            console.error('Send Transaction Error:', error);
            // Return enhanced error if it's already an enhanced error object
            if (error.errorCode) {
                return error;
            }
            // Otherwise wrap in blockchain error
            return EnhancedErrorHandler.blockchainError(
                error.message,
                'send transaction preparation',
                { fromAddress: formattedFromAddress, toAddress: formattedToAddress }
            );
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

    /**
     * Generate QR code for Nano payment
     * @param {string} address - Nano address to receive payment
     * @param {string} amount - Amount in decimal XNO (e.g., "0.140366")
     * @returns {Promise<Object>} - QR code data with base64 image and payment string
     */
    async generateQrCode(address, amount) {
        try {
            // Validate address format
            if (!address || !address.startsWith('nano_')) {
                throw new Error('Invalid Nano address format. Address must start with "nano_"');
            }

            // Validate amount
            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                throw new Error('Invalid amount. Must be a positive number');
            }

            // Use format: nano:nano_address?amount=0.140366 (decimal, not raw)
            const paymentString = `nano:${address}?amount=${amount}`;
            
            console.log('Generating QR code for payment:', paymentString);

            // Generate QR code using the qrcode library
            const QRCode = require('qrcode');
            const qrDataUrl = await QRCode.toDataURL(paymentString, {
                errorCorrectionLevel: 'L',
                width: 400,
                margin: 4,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });

            console.log('QR code generated successfully');

            return {
                success: true,
                qrCode: qrDataUrl,
                paymentString: paymentString,
                address: address,
                amount: amount,
                format: 'base64 Data URL (PNG)'
            };
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error(`Failed to generate QR code: ${error.message}`);
        }
    }
}
exports.NanoTransactions = NanoTransactions;
