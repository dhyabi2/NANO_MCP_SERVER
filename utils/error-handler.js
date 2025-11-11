/**
 * Enhanced Error Handler for Autonomous Agents
 * Provides descriptive, actionable error messages that guide agents without needing documentation
 */

"use strict";

const { BalanceConverter } = require('./balance-converter');

class EnhancedErrorHandler {
    /**
     * Create an insufficient balance error with detailed guidance
     * @param {string} currentBalance - Current balance in raw
     * @param {string} attemptedAmount - Attempted send amount in raw
     * @param {string} address - Account address
     * @returns {Object} Enhanced error object
     */
    static insufficientBalance(currentBalance, attemptedAmount, address) {
        console.log('[EnhancedErrorHandler] Creating insufficient balance error');
        
        const current = BigInt(currentBalance);
        const attempted = BigInt(attemptedAmount);
        const shortfall = attempted - current;

        return {
            success: false,
            error: "Insufficient balance",
            errorCode: "INSUFFICIENT_BALANCE",
            details: {
                address: address,
                currentBalance: currentBalance,
                currentBalanceNano: BalanceConverter.rawToNano(currentBalance),
                attemptedAmount: attemptedAmount,
                attemptedAmountNano: BalanceConverter.rawToNano(attemptedAmount),
                shortfall: shortfall.toString(),
                shortfallNano: BalanceConverter.rawToNano(shortfall.toString())
            },
            nextSteps: [
                "Step 1: Check current balance using getBalance or getAccountInfo",
                `Step 2: Either reduce send amount to maximum ${BalanceConverter.rawToNano(currentBalance)} NANO or less`,
                `Step 3: Or fund account with additional ${BalanceConverter.rawToNano(shortfall.toString())} NANO minimum`,
                "Step 4: After funding, use receiveAllPending to process pending blocks",
                "Step 5: Retry your send transaction"
            ],
            relatedFunctions: ["getBalance", "getAccountInfo", "receiveAllPending"],
            exampleRequest: {
                jsonrpc: "2.0",
                method: "getBalance",
                params: {
                    address: address
                },
                id: 1
            }
        };
    }

    /**
     * Create an account not initialized error
     * @param {string} address - Account address
     * @param {Object} pendingInfo - Pending blocks information
     * @returns {Object} Enhanced error object
     */
    static accountNotInitialized(address, pendingInfo = null) {
        console.log('[EnhancedErrorHandler] Creating account not initialized error');
        
        const hasPending = pendingInfo && pendingInfo.blocks && Object.keys(pendingInfo.blocks).length > 0;
        const nextSteps = [];

        if (hasPending) {
            const pendingCount = Object.keys(pendingInfo.blocks).length;
            let totalPending = BigInt(0);
            for (const block of Object.values(pendingInfo.blocks)) {
                totalPending += BigInt(block.amount);
            }

            nextSteps.push(
                "Step 1: You have pending blocks! Initialize account by receiving them",
                "Step 2: Use initializeAccount to open account and receive first block",
                "Step 3: Or use receiveAllPending to receive all pending blocks at once",
                "Step 4: After initialization, retry your send transaction"
            );

            return {
                success: false,
                error: "Account not initialized (unopened)",
                errorCode: "ACCOUNT_NOT_INITIALIZED",
                details: {
                    address: address,
                    initialized: false,
                    hasPendingBlocks: true,
                    pendingCount: pendingCount,
                    totalPendingAmount: totalPending.toString(),
                    totalPendingAmountNano: BalanceConverter.rawToNano(totalPending.toString())
                },
                nextSteps: nextSteps,
                relatedFunctions: ["initializeAccount", "receiveAllPending", "getPendingBlocks"],
                exampleRequests: [
                    {
                        description: "Option 1: Initialize account (opens account and receives first block)",
                        request: {
                            jsonrpc: "2.0",
                            method: "initializeAccount",
                            params: {
                                address: address,
                                privateKey: "your_private_key_here"
                            },
                            id: 1
                        }
                    },
                    {
                        description: "Option 2: Receive all pending blocks (opens account and receives all)",
                        request: {
                            jsonrpc: "2.0",
                            method: "receiveAllPending",
                            params: {
                                address: address,
                                privateKey: "your_private_key_here"
                            },
                            id: 1
                        }
                    }
                ]
            };
        } else {
            nextSteps.push(
                "Step 1: Account has no pending blocks to initialize with",
                "Step 2: Send some NANO to this address first",
                "Step 3: Then use initializeAccount or receiveAllPending to open the account",
                "Step 4: After receiving funds, you can send transactions"
            );

            return {
                success: false,
                error: "Account not initialized and no pending blocks",
                errorCode: "ACCOUNT_NOT_INITIALIZED_NO_PENDING",
                details: {
                    address: address,
                    initialized: false,
                    hasPendingBlocks: false,
                    pendingCount: 0
                },
                nextSteps: nextSteps,
                relatedFunctions: ["initializeAccount", "receiveAllPending"],
                note: "An account must receive its first transaction before it can send. Send NANO to this address first."
            };
        }
    }

    /**
     * Create a pending blocks not received warning
     * @param {string} address - Account address
     * @param {Object} pendingInfo - Pending blocks information
     * @returns {Object} Enhanced error/warning object
     */
    static pendingBlocksDetected(address, pendingInfo) {
        console.log('[EnhancedErrorHandler] Creating pending blocks warning');
        
        const pendingCount = Object.keys(pendingInfo.blocks).length;
        let totalPending = BigInt(0);
        for (const block of Object.values(pendingInfo.blocks)) {
            totalPending += BigInt(block.amount);
        }

        return {
            success: false,
            error: "Pending blocks detected - should receive first",
            errorCode: "PENDING_BLOCKS_NOT_RECEIVED",
            details: {
                address: address,
                pendingCount: pendingCount,
                totalPendingAmount: totalPending.toString(),
                totalPendingAmountNano: BalanceConverter.rawToNano(totalPending.toString())
            },
            recommendation: "Receive pending blocks first to ensure accurate balance and avoid transaction issues",
            nextSteps: [
                "Step 1: Use receiveAllPending to process all pending transactions",
                "Step 2: Wait for block confirmation (usually < 1 second)",
                "Step 3: Verify new balance with getBalance",
                "Step 4: Retry your send transaction"
            ],
            relatedFunctions: ["receiveAllPending", "getBalance"],
            exampleRequest: {
                jsonrpc: "2.0",
                method: "receiveAllPending",
                params: {
                    address: address,
                    privateKey: "your_private_key_here"
                },
                id: 1
            }
        };
    }

    /**
     * Create an invalid amount format error
     * @param {string} providedAmount - The invalid amount provided
     * @param {string} reason - Reason for invalidity
     * @returns {Object} Enhanced error object
     */
    static invalidAmountFormat(providedAmount, reason = null) {
        console.log('[EnhancedErrorHandler] Creating invalid amount format error');
        
        // Try to detect if user provided NANO instead of raw
        const looksLikeNano = /^\d+\.?\d*$/.test(providedAmount) && parseFloat(providedAmount) < 1000;
        let suggestedConversion = null;

        if (looksLikeNano) {
            try {
                suggestedConversion = BalanceConverter.nanoToRaw(providedAmount);
            } catch (e) {
                // Ignore conversion errors
            }
        }

        const error = {
            success: false,
            error: "Invalid amount format",
            errorCode: "INVALID_AMOUNT_FORMAT",
            details: {
                providedAmount: providedAmount,
                expectedFormat: "String of digits representing raw units",
                reason: reason || "Amount must be in raw units (10^30 raw = 1 NANO)"
            },
            conversionHelper: {
                description: "NANO amounts must be converted to raw units",
                formula: "raw = NANO × 10^30",
                examples: BalanceConverter.getConversionExamples()
            },
            nextSteps: [
                "Step 1: Convert your NANO amount to raw units using the formula above",
                "Step 2: Provide amount as a string of digits (no decimals) in raw units",
                "Step 3: Example: To send 0.1 NANO, use '100000000000000000000000000'"
            ],
            relatedInfo: BalanceConverter.getConversionHelp()
        };

        if (suggestedConversion) {
            error.suggestedCorrection = {
                description: `If you meant to send ${providedAmount} NANO, use this value:`,
                correctedAmount: suggestedConversion,
                correctedAmountNano: providedAmount
            };
        }

        return error;
    }

    /**
     * Create an insufficient work error with detailed guidance
     * @param {string} hash - The hash that work was generated for
     * @param {string} work - The work value that was rejected
     * @param {string} blockType - Type of block (send, receive, open, change)
     * @returns {Object} Enhanced error object
     */
    static insufficientWork(hash, work, blockType = 'unknown') {
        console.log('[EnhancedErrorHandler] Creating insufficient work error');
        
        const expectedThreshold = (blockType === 'receive' || blockType === 'open') 
            ? 'fffffe0000000000' 
            : 'fffffff800000000';
        
        return {
            success: false,
            error: "Block work is insufficient - work does not meet NANO network difficulty threshold",
            errorCode: "INSUFFICIENT_WORK",
            details: {
                hash: hash,
                generatedWork: work,
                blockType: blockType,
                expectedThreshold: expectedThreshold,
                reason: "The Proof-of-Work (PoW) computation did not meet the network's difficulty requirement"
            },
            nextSteps: [
                "Step 1: This is likely a transient issue - SIMPLY RETRY the same operation",
                "Step 2: Work generation now uses correct NANO network difficulty thresholds:",
                `   • Send/Change blocks: fffffff800000000 (takes 10-15 seconds)`,
                `   • Receive/Open blocks: fffffe0000000000 (takes 4-6 seconds)`,
                "Step 3: If retrying fails repeatedly, possible causes:",
                "   • CPU too slow for reliable work generation",
                "   • nanocurrency library not properly initialized",
                "Step 4: Solutions if issue persists:",
                "   • Wait a few moments and retry (work generation is probabilistic)",
                "   • Use a more powerful machine",
                "   • Implement GPU-accelerated work generation",
                "   • Use an external work generation service"
            ],
            relatedFunctions: ["sendTransaction", "receiveAllPending", "initializeAccount"],
            technicalDetails: {
                workGenerationMethod: "Local CPU (nanocurrency library)",
                timeEstimate: blockType === 'send' ? "10-15 seconds" : "4-6 seconds",
                cpuIntensive: true,
                probabilistic: true
            },
            exampleRetry: {
                jsonrpc: "2.0",
                method: blockType === 'send' ? "sendTransaction" : "receiveAllPending",
                params: {},
                id: 1,
                note: "Simply retry the EXACT same request - work will be regenerated automatically"
            }
        };
    }

    /**
     * Create a generic blockchain error with context
     * @param {string} originalError - Original error message
     * @param {string} context - Context about what operation was being performed
     * @param {Object} additionalInfo - Additional contextual information
     * @returns {Object} Enhanced error object
     */
    static blockchainError(originalError, context, additionalInfo = {}) {
        console.log('[EnhancedErrorHandler] Creating blockchain error');
        
        // Try to detect specific error types
        if (originalError.toLowerCase().includes('work') && originalError.toLowerCase().includes('insufficient')) {
            // Work insufficient error - provide specific guidance
            return EnhancedErrorHandler.insufficientWork(
                additionalInfo.hash || 'unknown',
                additionalInfo.work || 'unknown',
                additionalInfo.blockType || context.includes('send') ? 'send' : 'receive'
            );
        }
        
        if (originalError.toLowerCase().includes('insufficient')) {
            // This should be caught earlier, but just in case
            return {
                success: false,
                error: "Blockchain rejected transaction - likely insufficient balance",
                errorCode: "BLOCKCHAIN_INSUFFICIENT_BALANCE",
                details: {
                    originalError: originalError,
                    context: context,
                    ...additionalInfo
                },
                nextSteps: [
                    "Step 1: Check your account balance with getBalance",
                    "Step 2: Verify you have enough NANO for the transaction",
                    "Step 3: Remember: You cannot spend your entire balance (need to leave dust amount)"
                ],
                relatedFunctions: ["getBalance", "getAccountInfo"]
            };
        }

        if (originalError.toLowerCase().includes('invalid') && originalError.toLowerCase().includes('block')) {
            return {
                success: false,
                error: "Blockchain rejected block as invalid",
                errorCode: "BLOCKCHAIN_INVALID_BLOCK",
                details: {
                    originalError: originalError,
                    context: context,
                    ...additionalInfo
                },
                possibleCauses: [
                    "Insufficient balance for transaction",
                    "Account frontier hash is incorrect (stale state)",
                    "Invalid work/signature",
                    "Attempting to send more than available balance"
                ],
                nextSteps: [
                    "Step 1: Verify account balance is sufficient",
                    "Step 2: Check if account has pending blocks to receive first",
                    "Step 3: Ensure you're not trying to send entire balance (leave some raw units)",
                    "Step 4: Try refreshing account state with getAccountInfo"
                ],
                relatedFunctions: ["getBalance", "getAccountInfo", "receiveAllPending"]
            };
        }

        // Generic blockchain error
        return {
            success: false,
            error: "Blockchain operation failed",
            errorCode: "BLOCKCHAIN_ERROR",
            details: {
                originalError: originalError,
                context: context,
                ...additionalInfo
            },
            nextSteps: [
                "Step 1: Check the blockchain error message for specific details",
                "Step 2: Verify your account state with getAccountInfo",
                "Step 3: Ensure all prerequisites are met (account initialized, sufficient balance)",
                "Step 4: If problem persists, check RPC node status"
            ],
            relatedFunctions: ["getAccountInfo", "getBalance"]
        };
    }

    /**
     * Create a validation error for missing or invalid parameters
     * @param {string} parameter - Parameter name
     * @param {string} issue - What's wrong with the parameter
     * @param {Object} correctExample - Example of correct usage
     * @returns {Object} Enhanced error object
     */
    static validationError(parameter, issue, correctExample = null) {
        console.log(`[EnhancedErrorHandler] Creating validation error for ${parameter}`);
        
        return {
            success: false,
            error: `Invalid parameter: ${parameter}`,
            errorCode: "VALIDATION_ERROR",
            details: {
                parameter: parameter,
                issue: issue
            },
            nextSteps: [
                `Step 1: Fix the ${parameter} parameter`,
                "Step 2: Ensure it matches the expected format",
                "Step 3: Refer to the example below for correct usage"
            ],
            correctExample: correctExample
        };
    }

    /**
     * Validate NANO address format
     * @param {string} address - Address to validate
     * @param {string} parameterName - Name of the parameter for error messages
     * @returns {Object|null} Error object if invalid, null if valid
     */
    static validateAddress(address, parameterName = 'address') {
        if (!address || typeof address !== 'string') {
            return {
                success: false,
                error: `Missing or invalid ${parameterName}`,
                errorCode: "INVALID_ADDRESS_FORMAT",
                details: {
                    parameter: parameterName,
                    providedValue: address,
                    providedType: typeof address,
                    expectedType: "string",
                    issue: address ? "Invalid type" : "Missing required parameter"
                },
                nextSteps: [
                    `Step 1: Provide a valid NANO address for ${parameterName}`,
                    "Step 2: NANO addresses start with 'nano_' or 'xrb_'",
                    "Step 3: Addresses are 64-65 characters long",
                    "Step 4: Example: nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn"
                ],
                exampleRequest: {
                    jsonrpc: "2.0",
                    method: "getBalance",
                    params: {
                        address: "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn"
                    },
                    id: 1
                }
            };
        }

        const trimmedAddress = address.trim();
        
        // Check if address starts with nano_ or xrb_
        if (!trimmedAddress.startsWith('nano_') && !trimmedAddress.startsWith('xrb_')) {
            return {
                success: false,
                error: `Invalid ${parameterName} format - must start with 'nano_' or 'xrb_'`,
                errorCode: "INVALID_ADDRESS_PREFIX",
                details: {
                    parameter: parameterName,
                    providedValue: address,
                    issue: "Address must start with 'nano_' or 'xrb_' prefix",
                    detectedPrefix: trimmedAddress.substring(0, 5)
                },
                nextSteps: [
                    "Step 1: Ensure address starts with 'nano_' (modern format) or 'xrb_' (legacy format)",
                    "Step 2: Check for typos in the address prefix",
                    "Step 3: Example valid address: nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn"
                ],
                relatedFunctions: ["generateWallet"]
            };
        }

        // Check address length (should be 64-65 characters)
        if (trimmedAddress.length < 64 || trimmedAddress.length > 65) {
            return {
                success: false,
                error: `Invalid ${parameterName} length`,
                errorCode: "INVALID_ADDRESS_LENGTH",
                details: {
                    parameter: parameterName,
                    providedValue: address,
                    providedLength: trimmedAddress.length,
                    expectedLength: "64-65 characters",
                    issue: trimmedAddress.length < 64 ? "Address too short" : "Address too long"
                },
                nextSteps: [
                    "Step 1: Verify you copied the complete address",
                    "Step 2: NANO addresses are exactly 64-65 characters including prefix",
                    "Step 3: Check for extra spaces or missing characters",
                    "Step 4: Generate a new address with generateWallet if needed"
                ],
                relatedFunctions: ["generateWallet"]
            };
        }

        // Check for valid characters (alphanumeric after prefix)
        const addressBody = trimmedAddress.substring(trimmedAddress.indexOf('_') + 1);
        if (!/^[13456789abcdefghijkmnopqrstuwxyz]+$/.test(addressBody)) {
            return {
                success: false,
                error: `Invalid ${parameterName} contains invalid characters`,
                errorCode: "INVALID_ADDRESS_CHARACTERS",
                details: {
                    parameter: parameterName,
                    providedValue: address,
                    issue: "Address contains invalid characters (NANO uses base32 encoding: 13456789abcdefghijkmnopqrstuwxyz)",
                    invalidCharacters: "Detected characters not in base32 alphabet"
                },
                nextSteps: [
                    "Step 1: NANO addresses use only specific characters: 13456789abcdefghijkmnopqrstuwxyz",
                    "Step 2: Check for typos (note: 0, 2, l, o, v are NOT valid)",
                    "Step 3: Verify the address was copied correctly without corruption",
                    "Step 4: Generate a new address with generateWallet if address is corrupted"
                ],
                relatedFunctions: ["generateWallet"]
            };
        }

        return null; // Valid
    }

    /**
     * Validate private key format
     * @param {string} privateKey - Private key to validate
     * @returns {Object|null} Error object if invalid, null if valid
     */
    static validatePrivateKey(privateKey) {
        if (!privateKey || typeof privateKey !== 'string') {
            return {
                success: false,
                error: "Missing or invalid privateKey",
                errorCode: "INVALID_PRIVATE_KEY_FORMAT",
                details: {
                    parameter: "privateKey",
                    providedValue: privateKey ? "[PROVIDED]" : null,
                    providedType: typeof privateKey,
                    expectedType: "string",
                    issue: privateKey ? "Invalid type" : "Missing required parameter"
                },
                nextSteps: [
                    "Step 1: Provide a valid NANO private key",
                    "Step 2: Private keys are 64-character hexadecimal strings",
                    "Step 3: Characters allowed: 0-9, a-f (lowercase or uppercase)",
                    "Step 4: Generate a new wallet with generateWallet if you don't have a private key"
                ],
                securityNote: "⚠️ NEVER share your private key. It grants full control of the account.",
                relatedFunctions: ["generateWallet"]
            };
        }

        const trimmedKey = privateKey.trim();

        // Check length (should be 64 hex characters)
        if (trimmedKey.length !== 64) {
            return {
                success: false,
                error: "Invalid privateKey length",
                errorCode: "INVALID_PRIVATE_KEY_LENGTH",
                details: {
                    parameter: "privateKey",
                    providedLength: trimmedKey.length,
                    expectedLength: 64,
                    issue: trimmedKey.length < 64 ? "Private key too short" : "Private key too long"
                },
                nextSteps: [
                    "Step 1: Private keys must be exactly 64 characters",
                    "Step 2: Verify you copied the complete private key",
                    "Step 3: Check for extra spaces or missing characters",
                    "Step 4: Private keys are hexadecimal (0-9, a-f)"
                ],
                securityNote: "⚠️ NEVER share your private key. It grants full control of the account.",
                relatedFunctions: ["generateWallet"]
            };
        }

        // Check for valid hex characters
        if (!/^[0-9a-fA-F]{64}$/.test(trimmedKey)) {
            return {
                success: false,
                error: "Invalid privateKey format - must be hexadecimal",
                errorCode: "INVALID_PRIVATE_KEY_CHARACTERS",
                details: {
                    parameter: "privateKey",
                    issue: "Private key must contain only hexadecimal characters (0-9, a-f, A-F)",
                    invalidCharacters: "Detected non-hexadecimal characters"
                },
                nextSteps: [
                    "Step 1: Private keys must be hexadecimal (0-9, a-f, A-F only)",
                    "Step 2: Check for typos or invalid characters",
                    "Step 3: Common mistakes: confusing 'O' with '0', 'l' with '1'",
                    "Step 4: Verify the private key was copied correctly"
                ],
                securityNote: "⚠️ NEVER share your private key. It grants full control of the account.",
                relatedFunctions: ["generateWallet"]
            };
        }

        return null; // Valid
    }

    /**
     * Validate amount in raw format
     * @param {string} amountRaw - Amount to validate
     * @param {string} parameterName - Name of the parameter for error messages
     * @returns {Object|null} Error object if invalid, null if valid
     */
    static validateAmountRaw(amountRaw, parameterName = 'amountRaw') {
        if (!amountRaw || typeof amountRaw !== 'string') {
            return {
                success: false,
                error: `Missing or invalid ${parameterName}`,
                errorCode: "INVALID_AMOUNT_FORMAT",
                details: {
                    parameter: parameterName,
                    providedValue: amountRaw,
                    providedType: typeof amountRaw,
                    expectedType: "string",
                    expectedFormat: "String of digits (raw units)",
                    issue: amountRaw ? "Invalid type - must be string" : "Missing required parameter"
                },
                nextSteps: [
                    `Step 1: Provide ${parameterName} as a string of digits`,
                    "Step 2: Amount must be in raw units (not NANO)",
                    "Step 3: Use convertBalance to convert NANO to raw",
                    "Step 4: Example: '100000000000000000000000000000' (0.1 NANO in raw)"
                ],
                conversionHelper: BalanceConverter.getConversionHelp(),
                relatedFunctions: ["convertBalance"],
                exampleRequest: {
                    jsonrpc: "2.0",
                    method: "convertBalance",
                    params: {
                        amount: "0.1",
                        from: "nano",
                        to: "raw"
                    },
                    id: 1
                }
            };
        }

        const trimmedAmount = amountRaw.trim();

        // Check if it's a valid number string (digits only)
        if (!/^\d+$/.test(trimmedAmount)) {
            // Check if it looks like a decimal (NANO format instead of raw)
            if (/^\d+\.\d+$/.test(trimmedAmount) || /^\d+\.?\d*$/.test(trimmedAmount)) {
                let converted = null;
                try {
                    converted = BalanceConverter.nanoToRaw(trimmedAmount);
                } catch (e) {
                    // Conversion failed
                }

                return {
                    success: false,
                    error: `${parameterName} appears to be in NANO format, not raw`,
                    errorCode: "AMOUNT_WRONG_UNIT",
                    details: {
                        parameter: parameterName,
                        providedValue: amountRaw,
                        detectedFormat: "NANO (decimal)",
                        expectedFormat: "raw (integer string)",
                        issue: "Amounts must be in raw units, not NANO"
                    },
                    nextSteps: [
                        "Step 1: Convert NANO amount to raw units",
                        "Step 2: Use convertBalance function to convert",
                        `Step 3: If you meant ${trimmedAmount} NANO, use the corrected value below`,
                        "Step 4: Retry your request with the raw amount"
                    ],
                    suggestedCorrection: converted ? {
                        originalValue: trimmedAmount,
                        originalUnit: "NANO",
                        correctedValue: converted,
                        correctedUnit: "raw"
                    } : null,
                    relatedFunctions: ["convertBalance"],
                    exampleConversion: {
                        jsonrpc: "2.0",
                        method: "convertBalance",
                        params: {
                            amount: trimmedAmount,
                            from: "nano",
                            to: "raw"
                        },
                        id: 1
                    }
                };
            }

            return {
                success: false,
                error: `Invalid ${parameterName} format`,
                errorCode: "INVALID_AMOUNT_CHARACTERS",
                details: {
                    parameter: parameterName,
                    providedValue: amountRaw,
                    expectedFormat: "String of digits only (no decimals, no letters)",
                    issue: "Amount contains invalid characters"
                },
                nextSteps: [
                    "Step 1: Amount must be a string of digits only",
                    "Step 2: No decimals allowed (raw units are integers)",
                    "Step 3: Use convertBalance to convert NANO to raw if needed",
                    "Step 4: Example valid amount: '100000000000000000000000000000'"
                ],
                relatedFunctions: ["convertBalance"]
            };
        }

        // Check if amount is zero or negative (BigInt handles this)
        try {
            const amountBigInt = BigInt(trimmedAmount);
            if (amountBigInt <= 0) {
                return {
                    success: false,
                    error: `${parameterName} must be greater than zero`,
                    errorCode: "INVALID_AMOUNT_ZERO_OR_NEGATIVE",
                    details: {
                        parameter: parameterName,
                        providedValue: amountRaw,
                        issue: "Amount must be a positive number"
                    },
                    nextSteps: [
                        "Step 1: Provide an amount greater than zero",
                        "Step 2: Minimum: '1' raw (extremely small)",
                        "Step 3: Typical minimum: '1000000000000000000000000' (0.000001 NANO)",
                        "Step 4: Check your amount calculation"
                    ]
                };
            }
        } catch (e) {
            return {
                success: false,
                error: `${parameterName} is too large or invalid`,
                errorCode: "INVALID_AMOUNT_OVERFLOW",
                details: {
                    parameter: parameterName,
                    providedValue: amountRaw,
                    issue: "Amount cannot be processed (too large or invalid format)"
                },
                nextSteps: [
                    "Step 1: Verify the amount is reasonable",
                    "Step 2: Maximum NANO supply: ~133 million NANO",
                    "Step 3: Check for extra zeros or calculation errors",
                    "Step 4: Use convertBalance to verify your amount"
                ],
                relatedFunctions: ["convertBalance"]
            };
        }

        return null; // Valid
    }

    /**
     * Create a method not found error
     * @param {string} method - The method that was not found
     * @param {Array} availableMethods - List of available methods
     * @returns {Object} Enhanced error object
     */
    static methodNotFound(method, availableMethods = []) {
        return {
            success: false,
            error: `Method not found: ${method}`,
            errorCode: "METHOD_NOT_FOUND",
            details: {
                requestedMethod: method,
                issue: "The requested method does not exist"
            },
            nextSteps: [
                "Step 1: Check the method name for typos",
                "Step 2: Ensure you're using a valid MCP method name",
                "Step 3: Call 'initialize' to get list of all available methods",
                "Step 4: Refer to the available methods list below"
            ],
            availableMethods: availableMethods.length > 0 ? availableMethods : [
                "initialize", "generateWallet", "getBalance", "getAccountInfo",
                "getPendingBlocks", "initializeAccount", "sendTransaction",
                "receiveAllPending", "generateQrCode", "convertBalance",
                "getAccountStatus", "setupTestWallets", "getTestWallets",
                "updateTestWalletBalance", "checkTestWalletsFunding", "resetTestWallets"
            ],
            exampleRequest: {
                jsonrpc: "2.0",
                method: "initialize",
                params: {},
                id: 1
            }
        };
    }

    /**
     * Create a missing parameter error
     * @param {string} parameter - The missing parameter
     * @param {string} method - The method being called
     * @param {Object} exampleParams - Example parameters
     * @returns {Object} Enhanced error object
     */
    static missingParameter(parameter, method, exampleParams = {}) {
        return {
            success: false,
            error: `Missing required parameter: ${parameter}`,
            errorCode: "MISSING_PARAMETER",
            details: {
                parameter: parameter,
                method: method,
                issue: `The parameter '${parameter}' is required but was not provided`
            },
            nextSteps: [
                `Step 1: Add the '${parameter}' parameter to your request`,
                "Step 2: Ensure the parameter is spelled correctly",
                "Step 3: Check the parameter type and format requirements",
                "Step 4: Refer to the example request below"
            ],
            exampleRequest: {
                jsonrpc: "2.0",
                method: method,
                params: exampleParams,
                id: 1
            }
        };
    }
}

module.exports = { EnhancedErrorHandler };

