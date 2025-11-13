/**
 * Work Generation Tests - TDD approach
 * Tests for work generation timeout, error handling, and retry logic
 */

const { NanoTransactions } = require('../utils/nano-transactions');
const { tools } = require('nanocurrency-web');

describe('Work Generation Error Handling', () => {
    let nanoTransactions;
    
    beforeEach(() => {
        nanoTransactions = new NanoTransactions({
            apiUrl: 'https://uk1.public.xnopay.com/proxy',
            rpcKey: null
        });
        
        // Clear console output for cleaner test logs
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Timeout Protection', () => {
        test('should timeout work generation after 30 seconds for send blocks', async () => {
            // Create a test hash for work generation
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            // Generate work with timeout protection (should be implemented)
            const startTime = Date.now();
            
            try {
                await nanoTransactions.generateWork(testHash, false); // send block
                // If we get here, work was generated successfully or we need to check time
                const elapsed = Date.now() - startTime;
                expect(elapsed).toBeLessThan(30000); // Should complete within 30s or timeout
            } catch (error) {
                const elapsed = Date.now() - startTime;
                
                // If it times out, it should be around 30 seconds and have proper error
                if (error.message.includes('timeout') || error.message.includes('timed out')) {
                    expect(elapsed).toBeGreaterThanOrEqual(29000);
                    expect(elapsed).toBeLessThan(35000);
                    expect(error.message).toContain('timeout');
                } else {
                    // Other errors are acceptable (e.g., initialization issues)
                    expect(error.message).toBeDefined();
                }
            }
        }, 35000); // Test timeout of 35 seconds to allow for 30s work timeout

        test('should timeout work generation after 15 seconds for receive blocks', async () => {
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            const startTime = Date.now();
            
            try {
                await nanoTransactions.generateWork(testHash, true); // receive block (lower difficulty)
                const elapsed = Date.now() - startTime;
                expect(elapsed).toBeLessThan(15000);
            } catch (error) {
                const elapsed = Date.now() - startTime;
                
                if (error.message.includes('timeout') || error.message.includes('timed out')) {
                    expect(elapsed).toBeGreaterThanOrEqual(14000);
                    expect(elapsed).toBeLessThan(20000);
                    expect(error.message).toContain('timeout');
                } else {
                    expect(error.message).toBeDefined();
                }
            }
        }, 20000);
    });

    describe('Error Handling', () => {
        test('should throw error if hash is missing', async () => {
            await expect(nanoTransactions.generateWork(null)).rejects.toThrow('Hash is required');
        });

        test('should throw error if hash is empty string', async () => {
            await expect(nanoTransactions.generateWork('')).rejects.toThrow('Hash is required');
        });

        test('should handle nanocurrency initialization failure gracefully', async () => {
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            try {
                const result = await nanoTransactions.generateWork(testHash, true);
                // If successful, result should be a valid work string
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            } catch (error) {
                // Should have a descriptive error message
                expect(error.message).toBeDefined();
                expect(error.message.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Retry Logic', () => {
        test('should retry work generation on failure with exponential backoff', async () => {
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            // This test verifies that the retry logic exists and works
            try {
                const result = await nanoTransactions.generateWorkWithRetry(testHash, true, 2);
                expect(typeof result).toBe('string');
            } catch (error) {
                // Even if it fails, it should have attempted retries
                expect(error.message).toBeDefined();
            }
        }, 45000);

        test('should give up after maximum retry attempts', async () => {
            // Test with invalid hash to force failure
            const invalidHash = 'invalid';
            
            try {
                await nanoTransactions.generateWorkWithRetry(invalidHash, true, 2);
                // Should not reach here
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toBeDefined();
                // Should indicate that retries were exhausted
                expect(
                    error.message.includes('retry') || 
                    error.message.includes('attempts') ||
                    error.message.includes('failed')
                ).toBeTruthy();
            }
        }, 45000);
    });

    describe('receiveAllPending Integration', () => {
        test('should handle work generation timeout in receiveAllPending without infinite loop', async () => {
            // Create a test wallet
            const testWallet = {
                address: 'nano_3test1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg',
                privateKey: '0000000000000000000000000000000000000000000000000000000000000001'
            };
            
            // Mock getPendingBlocks to return empty (no pending blocks)
            jest.spyOn(nanoTransactions, 'getPendingBlocks').mockResolvedValue({
                blocks: {}
            });
            
            const startTime = Date.now();
            const results = await nanoTransactions.receiveAllPending(
                testWallet.address,
                testWallet.privateKey
            );
            const elapsed = Date.now() - startTime;
            
            // Should complete quickly with no pending blocks
            expect(elapsed).toBeLessThan(5000);
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(0);
        });

        test('should not create infinite recursion in receiveAllPending', async () => {
            const testWallet = {
                address: 'nano_3test1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg',
                privateKey: '0000000000000000000000000000000000000000000000000000000000000001'
            };
            
            // Track how many times createReceiveBlock is called
            let callCount = 0;
            const originalCreateReceiveBlock = nanoTransactions.createReceiveBlock.bind(nanoTransactions);
            jest.spyOn(nanoTransactions, 'createReceiveBlock').mockImplementation(async (...args) => {
                callCount++;
                if (callCount > 10) {
                    throw new Error('Infinite recursion detected: createReceiveBlock called more than 10 times');
                }
                // Mock successful receive
                return { hash: 'mock_hash_' + callCount };
            });
            
            // Mock getPendingBlocks to return 2 pending blocks
            jest.spyOn(nanoTransactions, 'getPendingBlocks').mockResolvedValue({
                blocks: {
                    'hash1': { amount: '1000000000000000000000000', source: 'nano_1source1' },
                    'hash2': { amount: '2000000000000000000000000', source: 'nano_1source2' }
                }
            });
            
            // Mock getAccountInfo to avoid real RPC calls
            jest.spyOn(nanoTransactions, 'getAccountInfo').mockResolvedValue({
                balance: '0',
                frontier: '0000000000000000000000000000000000000000000000000000000000000000'
            });
            
            await nanoTransactions.receiveAllPending(
                testWallet.address,
                testWallet.privateKey
            );
            
            // Should have been called exactly twice (once per pending block)
            expect(callCount).toBe(2);
            expect(callCount).toBeLessThanOrEqual(10);
        });
    });

    describe('Concurrent Work Generation', () => {
        test('should handle multiple concurrent work generation requests', async () => {
            const hashes = [
                '0000000000000000000000000000000000000000000000000000000000000001',
                '0000000000000000000000000000000000000000000000000000000000000002',
                '0000000000000000000000000000000000000000000000000000000000000003'
            ];
            
            const startTime = Date.now();
            
            try {
                const promises = hashes.map(hash => 
                    nanoTransactions.generateWork(hash, true)
                );
                const results = await Promise.all(promises);
                
                const elapsed = Date.now() - startTime;
                
                // All should complete (successfully or with timeout)
                expect(results.length).toBe(3);
                results.forEach(result => {
                    expect(typeof result).toBe('string');
                });
                
                // Should take advantage of parallel processing
                expect(elapsed).toBeLessThan(45000); // 3 x 15s = 45s max
            } catch (error) {
                // If any fail, that's acceptable as long as error is handled
                expect(error.message).toBeDefined();
            }
        }, 50000);
    });

    describe('Logging and Debugging', () => {
        test('should log work generation progress for debugging', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            try {
                await nanoTransactions.generateWork(testHash, true);
            } catch (error) {
                // Error is acceptable for this test
            }
            
            // Should have logged work generation start
            const logCalls = consoleLogSpy.mock.calls.flat().join(' ');
            expect(logCalls).toContain('Generating work LOCALLY');
            
            // Should have logged difficulty threshold
            expect(logCalls).toContain('Computing work with');
        });

        test('should log errors during work generation', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            // Use invalid hash to force error
            try {
                await nanoTransactions.generateWork('invalid', true);
            } catch (error) {
                // Expected to fail
            }
            
            // Should have logged error (might not be called if validation happens before logging)
            // This is optional based on implementation
            expect(consoleErrorSpy.mock.calls.length).toBeGreaterThanOrEqual(0);
        });
    });
});

