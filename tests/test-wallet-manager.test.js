/**
 * TDD Tests for Test Wallet Manager
 * These tests define the expected behavior of the test wallet management system
 * Following TDD principles: Write tests first, watch them fail, then implement
 */

const { TestWalletManager } = require('./test-wallet-manager');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_WALLET_FILE = path.join(__dirname, 'test-wallets.json');

describe('TestWalletManager', () => {
    let walletManager;

    beforeEach(() => {
        // Clean up any existing test wallet file before each test
        if (fs.existsSync(TEST_WALLET_FILE)) {
            fs.unlinkSync(TEST_WALLET_FILE);
        }
        walletManager = new TestWalletManager(TEST_WALLET_FILE);
    });

    afterEach(() => {
        // Clean up after each test
        if (fs.existsSync(TEST_WALLET_FILE)) {
            fs.unlinkSync(TEST_WALLET_FILE);
        }
    });

    describe('generateTestWallets', () => {
        test('should generate two wallets with all required properties', async () => {
            const result = await walletManager.generateTestWallets();

            expect(result).toHaveProperty('wallet1');
            expect(result).toHaveProperty('wallet2');
            expect(result).toHaveProperty('created');
            expect(result).toHaveProperty('status');

            // Verify wallet1 properties
            expect(result.wallet1).toHaveProperty('address');
            expect(result.wallet1).toHaveProperty('privateKey');
            expect(result.wallet1).toHaveProperty('publicKey');
            expect(result.wallet1).toHaveProperty('seed');
            expect(result.wallet1).toHaveProperty('balance');
            expect(result.wallet1).toHaveProperty('funded');

            // Verify wallet2 properties
            expect(result.wallet2).toHaveProperty('address');
            expect(result.wallet2).toHaveProperty('privateKey');
            expect(result.wallet2).toHaveProperty('publicKey');
            expect(result.wallet2).toHaveProperty('seed');
            expect(result.wallet2).toHaveProperty('balance');
            expect(result.wallet2).toHaveProperty('funded');

            // Verify address format
            expect(result.wallet1.address).toMatch(/^nano_[13][13-9a-km-uw-z]{59}$/);
            expect(result.wallet2.address).toMatch(/^nano_[13][13-9a-km-uw-z]{59}$/);

            // Verify wallets are different
            expect(result.wallet1.address).not.toBe(result.wallet2.address);
            expect(result.wallet1.privateKey).not.toBe(result.wallet2.privateKey);
        });

        test('should initialize both wallets as unfunded', async () => {
            const result = await walletManager.generateTestWallets();

            expect(result.wallet1.funded).toBe(false);
            expect(result.wallet2.funded).toBe(false);
            expect(result.wallet1.balance).toBe('0');
            expect(result.wallet2.balance).toBe('0');
        });

        test('should save wallets to file system', async () => {
            await walletManager.generateTestWallets();

            expect(fs.existsSync(TEST_WALLET_FILE)).toBe(true);
            const fileContent = fs.readFileSync(TEST_WALLET_FILE, 'utf8');
            const wallets = JSON.parse(fileContent);

            expect(wallets).toHaveProperty('wallet1');
            expect(wallets).toHaveProperty('wallet2');
        });

        test('should include creation timestamp', async () => {
            const beforeTime = Date.now();
            const result = await walletManager.generateTestWallets();
            const afterTime = Date.now();

            expect(result.created).toBeDefined();
            const createdTime = new Date(result.created).getTime();
            expect(createdTime).toBeGreaterThanOrEqual(beforeTime);
            expect(createdTime).toBeLessThanOrEqual(afterTime);
        });

        test('should return status indicating wallets need funding', async () => {
            const result = await walletManager.generateTestWallets();

            expect(result.status).toBe('awaiting_funding');
            expect(result).toHaveProperty('message');
            expect(result.message).toContain('fund');
        });

        test('should include funding instructions', async () => {
            const result = await walletManager.generateTestWallets();

            expect(result).toHaveProperty('fundingInstructions');
            expect(Array.isArray(result.fundingInstructions)).toBe(true);
            expect(result.fundingInstructions.length).toBeGreaterThan(0);
        });
    });

    describe('getTestWallets', () => {
        test('should retrieve existing wallets from file', async () => {
            // First generate wallets
            const generated = await walletManager.generateTestWallets();

            // Then retrieve them
            const retrieved = await walletManager.getTestWallets();

            expect(retrieved.wallet1.address).toBe(generated.wallet1.address);
            expect(retrieved.wallet2.address).toBe(generated.wallet2.address);
            expect(retrieved.wallet1.privateKey).toBe(generated.wallet1.privateKey);
            expect(retrieved.wallet2.privateKey).toBe(generated.wallet2.privateKey);
        });

        test('should return null when no wallets exist', async () => {
            const result = await walletManager.getTestWallets();

            expect(result).toBeNull();
        });

        test('should not include private keys when includePrivateKeys is false', async () => {
            await walletManager.generateTestWallets();
            const retrieved = await walletManager.getTestWallets(false);

            expect(retrieved.wallet1.privateKey).toBeUndefined();
            expect(retrieved.wallet2.privateKey).toBeUndefined();
            expect(retrieved.wallet1.address).toBeDefined();
            expect(retrieved.wallet2.address).toBeDefined();
        });
    });

    describe('updateWalletBalance', () => {
        test('should update wallet balance and funding status', async () => {
            await walletManager.generateTestWallets();
            const testBalance = '1000000000000000000000000000'; // 1 NANO in raw

            const result = await walletManager.updateWalletBalance('wallet1', testBalance);

            expect(result.success).toBe(true);
            expect(result.wallet).toBe('wallet1');
            expect(result.balance).toBe(testBalance);
            expect(result.funded).toBe(true);
        });

        test('should mark wallet as unfunded when balance is zero', async () => {
            await walletManager.generateTestWallets();
            
            // First fund it
            await walletManager.updateWalletBalance('wallet1', '1000000000000000000000000000');
            
            // Then set to zero
            const result = await walletManager.updateWalletBalance('wallet1', '0');

            expect(result.funded).toBe(false);
        });

        test('should persist balance updates to file', async () => {
            await walletManager.generateTestWallets();
            const testBalance = '2000000000000000000000000000'; // 2 NANO in raw

            await walletManager.updateWalletBalance('wallet1', testBalance);

            // Create new manager instance to verify persistence
            const newManager = new TestWalletManager(TEST_WALLET_FILE);
            const wallets = await newManager.getTestWallets();

            expect(wallets.wallet1.balance).toBe(testBalance);
            expect(wallets.wallet1.funded).toBe(true);
        });

        test('should throw error for invalid wallet identifier', async () => {
            await walletManager.generateTestWallets();

            await expect(
                walletManager.updateWalletBalance('wallet3', '1000')
            ).rejects.toThrow('Invalid wallet identifier');
        });
    });

    describe('checkFundingStatus', () => {
        test('should return funding status for both wallets', async () => {
            await walletManager.generateTestWallets();

            const status = await walletManager.checkFundingStatus();

            expect(status).toHaveProperty('wallet1');
            expect(status).toHaveProperty('wallet2');
            expect(status).toHaveProperty('bothFunded');
            expect(status).toHaveProperty('readyForTesting');

            expect(status.wallet1).toHaveProperty('funded');
            expect(status.wallet1).toHaveProperty('balance');
            expect(status.wallet2).toHaveProperty('funded');
            expect(status.wallet2).toHaveProperty('balance');
        });

        test('should indicate when both wallets are funded', async () => {
            await walletManager.generateTestWallets();
            await walletManager.updateWalletBalance('wallet1', '1000000000000000000000000000');
            await walletManager.updateWalletBalance('wallet2', '1000000000000000000000000000');

            const status = await walletManager.checkFundingStatus();

            expect(status.bothFunded).toBe(true);
            expect(status.readyForTesting).toBe(true);
        });

        test('should indicate when wallets are not fully funded', async () => {
            await walletManager.generateTestWallets();
            await walletManager.updateWalletBalance('wallet1', '1000000000000000000000000000');

            const status = await walletManager.checkFundingStatus();

            expect(status.bothFunded).toBe(false);
            expect(status.readyForTesting).toBe(false);
        });
    });

    describe('resetTestWallets', () => {
        test('should delete existing wallet file', async () => {
            await walletManager.generateTestWallets();
            expect(fs.existsSync(TEST_WALLET_FILE)).toBe(true);

            const result = await walletManager.resetTestWallets();

            expect(result.success).toBe(true);
            expect(fs.existsSync(TEST_WALLET_FILE)).toBe(false);
        });

        test('should return success even if no wallet file exists', async () => {
            const result = await walletManager.resetTestWallets();

            expect(result.success).toBe(true);
            expect(result.message).toContain('deleted');
        });
    });

    describe('logging', () => {
        test('should log wallet generation', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await walletManager.generateTestWallets();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Starting test wallet generation')
            );

            consoleSpy.mockRestore();
        });

        test('should log wallet balance updates', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            await walletManager.generateTestWallets();
            await walletManager.updateWalletBalance('wallet1', '1000000000000000000000000000');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Updating balance')
            );

            consoleSpy.mockRestore();
        });

        test('should log errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            await walletManager.generateTestWallets();
            
            try {
                await walletManager.updateWalletBalance('invalid_wallet', '1000');
            } catch (error) {
                // Expected error
            }

            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });
});

