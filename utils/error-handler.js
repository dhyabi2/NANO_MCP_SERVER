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
     * Create a generic blockchain error with context
     * @param {string} originalError - Original error message
     * @param {string} context - Context about what operation was being performed
     * @param {Object} additionalInfo - Additional contextual information
     * @returns {Object} Enhanced error object
     */
    static blockchainError(originalError, context, additionalInfo = {}) {
        console.log('[EnhancedErrorHandler] Creating blockchain error');
        
        // Try to detect specific error types
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
}

module.exports = { EnhancedErrorHandler };

