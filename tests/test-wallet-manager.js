/**
 * Test Wallet Manager
 * Manages generation, storage, and tracking of test wallets for NANO MCP integration testing
 * Provides functionality to create two test wallets, track their funding status, and persist data
 */

"use strict";

const fs = require('fs').promises;
const path = require('path');
const { wallet } = require('nanocurrency-web');

/**
 * TestWalletManager class for managing test wallets
 * Handles wallet generation, storage, balance tracking, and funding status
 */
class TestWalletManager {
    /**
     * Constructor for TestWalletManager
     * @param {string} walletFilePath - Path to the JSON file where test wallets will be stored
     */
    constructor(walletFilePath = null) {
        // Default to tests/test-wallets.json if no path provided
        this.walletFilePath = walletFilePath || path.join(__dirname, '..', 'tests', 'test-wallets.json');
        console.log(`[TestWalletManager] Initialized with wallet file path: ${this.walletFilePath}`);
    }

    /**
     * Generates two new test wallets with complete information
     * Creates wallets, initializes their funding status, and saves to file
     * @returns {Promise<Object>} Object containing both wallets, creation timestamp, status, and instructions
     */
    async generateTestWallets() {
        console.log('[TestWalletManager] Starting test wallet generation...');
        
        try {
            // Generate first wallet
            console.log('[TestWalletManager] Generating wallet1...');
            const wallet1Data = wallet.generateLegacy();
            const wallet1 = {
                address: wallet1Data.accounts[0].address,
                privateKey: wallet1Data.accounts[0].privateKey,
                publicKey: wallet1Data.accounts[0].publicKey,
                seed: wallet1Data.seed,
                balance: '0',
                funded: false
            };
            console.log(`[TestWalletManager] Wallet1 generated: ${wallet1.address}`);

            // Generate second wallet
            console.log('[TestWalletManager] Generating wallet2...');
            const wallet2Data = wallet.generateLegacy();
            const wallet2 = {
                address: wallet2Data.accounts[0].address,
                privateKey: wallet2Data.accounts[0].privateKey,
                publicKey: wallet2Data.accounts[0].publicKey,
                seed: wallet2Data.seed,
                balance: '0',
                funded: false
            };
            console.log(`[TestWalletManager] Wallet2 generated: ${wallet2.address}`);

            const created = new Date().toISOString();

            const walletsData = {
                wallet1,
                wallet2,
                created,
                lastUpdated: created
            };

            // Save to file
            console.log(`[TestWalletManager] Saving wallets to file: ${this.walletFilePath}`);
            await this._saveWallets(walletsData);
            console.log('[TestWalletManager] Wallets saved successfully');

            // Return result with funding instructions
            return {
                wallet1,
                wallet2,
                created,
                status: 'awaiting_funding',
                message: 'Test wallets generated successfully. Please fund both wallets with test NANO to proceed with testing.',
                fundingInstructions: [
                    `Send test NANO to Wallet 1: ${wallet1.address}`,
                    `Send test NANO to Wallet 2: ${wallet2.address}`,
                    'After funding, use checkFundingStatus to verify both wallets are funded',
                    'Recommended test amount: 0.1 NANO or more per wallet'
                ]
            };
        } catch (error) {
            console.error('[TestWalletManager] Error generating test wallets:', error);
            throw new Error(`Failed to generate test wallets: ${error.message}`);
        }
    }

    /**
     * Retrieves existing test wallets from file
     * @param {boolean} includePrivateKeys - Whether to include private keys in response (default: true)
     * @returns {Promise<Object|null>} Wallets object or null if no wallets exist
     */
    async getTestWallets(includePrivateKeys = true) {
        console.log('[TestWalletManager] Retrieving test wallets from file...');
        
        try {
            const exists = await this._fileExists(this.walletFilePath);
            
            if (!exists) {
                console.log('[TestWalletManager] No test wallets file found');
                return null;
            }

            const fileContent = await fs.readFile(this.walletFilePath, 'utf8');
            const walletsData = JSON.parse(fileContent);
            console.log('[TestWalletManager] Test wallets retrieved successfully');

            // Remove private keys if requested
            if (!includePrivateKeys) {
                console.log('[TestWalletManager] Removing private keys from response');
                const sanitized = { ...walletsData };
                if (sanitized.wallet1) {
                    delete sanitized.wallet1.privateKey;
                    delete sanitized.wallet1.seed;
                }
                if (sanitized.wallet2) {
                    delete sanitized.wallet2.privateKey;
                    delete sanitized.wallet2.seed;
                }
                return sanitized;
            }

            return walletsData;
        } catch (error) {
            console.error('[TestWalletManager] Error retrieving test wallets:', error);
            throw new Error(`Failed to retrieve test wallets: ${error.message}`);
        }
    }

    /**
     * Updates the balance and funding status for a specific wallet
     * @param {string} walletIdentifier - 'wallet1' or 'wallet2'
     * @param {string} balance - New balance in raw units
     * @returns {Promise<Object>} Updated wallet information
     */
    async updateWalletBalance(walletIdentifier, balance) {
        console.log(`[TestWalletManager] Updating balance for ${walletIdentifier} to ${balance} raw`);
        
        try {
            if (walletIdentifier !== 'wallet1' && walletIdentifier !== 'wallet2') {
                throw new Error('Invalid wallet identifier. Must be "wallet1" or "wallet2"');
            }

            // Load existing wallets
            const walletsData = await this.getTestWallets();
            if (!walletsData) {
                throw new Error('No test wallets found. Generate wallets first.');
            }

            // Update balance and funding status
            const balanceNum = BigInt(balance);
            walletsData[walletIdentifier].balance = balance;
            walletsData[walletIdentifier].funded = balanceNum > 0;
            walletsData.lastUpdated = new Date().toISOString();

            console.log(`[TestWalletManager] ${walletIdentifier} balance updated. Funded: ${walletsData[walletIdentifier].funded}`);

            // Save updated data
            await this._saveWallets(walletsData);

            return {
                success: true,
                wallet: walletIdentifier,
                balance: balance,
                funded: walletsData[walletIdentifier].funded,
                address: walletsData[walletIdentifier].address
            };
        } catch (error) {
            console.error(`[TestWalletManager] Error updating wallet balance:`, error);
            throw error;
        }
    }

    /**
     * Checks the funding status of both test wallets
     * @returns {Promise<Object>} Status object with funding information for both wallets
     */
    async checkFundingStatus() {
        console.log('[TestWalletManager] Checking funding status for test wallets...');
        
        try {
            const walletsData = await this.getTestWallets();
            if (!walletsData) {
                throw new Error('No test wallets found. Generate wallets first.');
            }

            const wallet1Funded = walletsData.wallet1.funded;
            const wallet2Funded = walletsData.wallet2.funded;
            const bothFunded = wallet1Funded && wallet2Funded;

            console.log(`[TestWalletManager] Funding status - Wallet1: ${wallet1Funded}, Wallet2: ${wallet2Funded}`);

            return {
                wallet1: {
                    address: walletsData.wallet1.address,
                    funded: wallet1Funded,
                    balance: walletsData.wallet1.balance
                },
                wallet2: {
                    address: walletsData.wallet2.address,
                    funded: wallet2Funded,
                    balance: walletsData.wallet2.balance
                },
                bothFunded,
                readyForTesting: bothFunded,
                message: bothFunded 
                    ? 'Both wallets are funded and ready for testing' 
                    : 'One or more wallets need funding before testing can begin'
            };
        } catch (error) {
            console.error('[TestWalletManager] Error checking funding status:', error);
            throw new Error(`Failed to check funding status: ${error.message}`);
        }
    }

    /**
     * Resets test wallets by deleting the wallet file
     * @returns {Promise<Object>} Success status
     */
    async resetTestWallets() {
        console.log('[TestWalletManager] Resetting test wallets...');
        
        try {
            const exists = await this._fileExists(this.walletFilePath);
            
            if (exists) {
                await fs.unlink(this.walletFilePath);
                console.log('[TestWalletManager] Test wallets file deleted successfully');
            } else {
                console.log('[TestWalletManager] No test wallets file to delete');
            }

            return {
                success: true,
                message: 'Test wallets deleted successfully. Generate new wallets to start fresh.'
            };
        } catch (error) {
            console.error('[TestWalletManager] Error resetting test wallets:', error);
            throw new Error(`Failed to reset test wallets: ${error.message}`);
        }
    }

    /**
     * Private method to save wallets data to file
     * @param {Object} walletsData - Wallets data to save
     * @returns {Promise<void>}
     */
    async _saveWallets(walletsData) {
        try {
            const dir = path.dirname(this.walletFilePath);
            
            // Ensure directory exists
            try {
                await fs.access(dir);
            } catch (error) {
                console.log(`[TestWalletManager] Creating directory: ${dir}`);
                await fs.mkdir(dir, { recursive: true });
            }

            // Write to file with pretty formatting
            const jsonData = JSON.stringify(walletsData, null, 4);
            await fs.writeFile(this.walletFilePath, jsonData, 'utf8');
            console.log(`[TestWalletManager] Wallets data saved to ${this.walletFilePath}`);
        } catch (error) {
            console.error('[TestWalletManager] Error saving wallets to file:', error);
            throw new Error(`Failed to save wallets: ${error.message}`);
        }
    }

    /**
     * Private method to check if file exists
     * @param {string} filePath - Path to check
     * @returns {Promise<boolean>}
     */
    async _fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = { TestWalletManager };

