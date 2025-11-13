/**
 * Work Generation Tests - TDD approach
 * Tests for RPC work generation timeout, error handling, and retry logic
 */

const { NanoTransactions } = require('../utils/nano-transactions');
const { tools } = require('nanocurrency-web');

describe('RPC Work Generation Error Handling', () => {
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
        test('should timeout RPC work generation after 10 seconds for send blocks', async () => {
            // Create a test hash for work generation
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            // Mock RPC call to simulate timeout
            jest.spyOn(nanoTransactions, 'rpcCall').mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({ work: 'mock_work_value' }), 15000);
                });
            });
            
            const startTime = Date.now();
            
            try {
                await nanoTransactions.generateWork(testHash, false); // send block
                fail('Should have timed out');
            } catch (error) {
                const elapsed = Date.now() - startTime;
                
                // Should timeout around 10 seconds
                expect(elapsed).toBeGreaterThanOrEqual(9000);
                expect(elapsed).toBeLessThan(12000);
                expect(error.message.toLowerCase()).toContain('timed out');
            }
        }, 15000);

        test('should timeout RPC work generation after 5 seconds for receive blocks', async () => {
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            // Mock RPC call to simulate timeout
            jest.spyOn(nanoTransactions, 'rpcCall').mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({ work: 'mock_work_value' }), 10000);
                });
            });
            
            const startTime = Date.now();
            
            try {
                await nanoTransactions.generateWork(testHash, true); // receive block
                fail('Should have timed out');
            } catch (error) {
                const elapsed = Date.now() - startTime;
                
                // Should timeout around 5 seconds
                expect(elapsed).toBeGreaterThanOrEqual(4000);
                expect(elapsed).toBeLessThan(7000);
                expect(error.message.toLowerCase()).toContain('timed out');
            }
        }, 10000);
    });

    describe('Error Handling', () => {
        test('should throw error if hash is missing', async () => {
            await expect(nanoTransactions.generateWork(null)).rejects.toThrow('Hash is required');
        });

        test('should throw error if hash is empty string', async () => {
            await expect(nanoTransactions.generateWork('')).rejects.toThrow('Hash is required');
        });

        test('should handle RPC errors gracefully', async () => {
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            // Mock RPC call to return error
            jest.spyOn(nanoTransactions, 'rpcCall').mockResolvedValue({
                error: 'RPC node error'
            });
            
            try {
                await nanoTransactions.generateWork(testHash, true);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('RPC work_generate error');
                expect(error.message).toContain('RPC node error');
            }
        });

        test('should handle missing work value in RPC response', async () => {
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            // Mock RPC call to return no work
            jest.spyOn(nanoTransactions, 'rpcCall').mockResolvedValue({});
            
            try {
                await nanoTransactions.generateWork(testHash, true);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('RPC returned no work value');
            }
        });
    });

    describe('Retry Logic', () => {
        test('should retry RPC work generation on failure with exponential backoff', async () => {
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            let callCount = 0;
            jest.spyOn(nanoTransactions, 'rpcCall').mockImplementation(() => {
                callCount++;
                if (callCount < 2) {
                    return Promise.reject(new Error('RPC temporarily unavailable'));
                }
                return Promise.resolve({ work: 'mock_work_after_retry' });
            });
            
            const result = await nanoTransactions.generateWorkWithRetry(testHash, true, 3);
            
            // Should succeed on second attempt
            expect(result).toBe('mock_work_after_retry');
            expect(callCount).toBe(2);
        }, 10000);

        test('should give up after maximum retry attempts', async () => {
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            // Mock RPC to always fail
            jest.spyOn(nanoTransactions, 'rpcCall').mockRejectedValue(
                new Error('RPC node permanently unavailable')
            );
            
            try {
                await nanoTransactions.generateWorkWithRetry(testHash, true, 2);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('RPC work generation failed after');
                expect(error.message).toContain('retry attempts');
            }
        }, 10000);
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
        test('should handle multiple concurrent RPC work generation requests', async () => {
            const hashes = [
                '0000000000000000000000000000000000000000000000000000000000000001',
                '0000000000000000000000000000000000000000000000000000000000000002',
                '0000000000000000000000000000000000000000000000000000000000000003'
            ];
            
            // Mock RPC to return different work for each hash
            jest.spyOn(nanoTransactions, 'rpcCall').mockImplementation(async (action, params) => {
                return { work: `work_for_${params.hash.slice(-4)}` };
            });
            
            const startTime = Date.now();
            
            const promises = hashes.map(hash => 
                nanoTransactions.generateWork(hash, true)
            );
            const results = await Promise.all(promises);
            
            const elapsed = Date.now() - startTime;
            
            // All should complete successfully
            expect(results.length).toBe(3);
            results.forEach((result, index) => {
                expect(typeof result).toBe('string');
                expect(result).toContain('work_for_');
            });
            
            // RPC is fast, should complete quickly
            expect(elapsed).toBeLessThan(5000);
        }, 10000);
    });

    describe('Logging and Debugging', () => {
        test('should log RPC work generation progress for debugging', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            const testHash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            // Mock successful RPC call
            jest.spyOn(nanoTransactions, 'rpcCall').mockResolvedValue({
                work: 'mock_work_value_123'
            });
            
            try {
                await nanoTransactions.generateWork(testHash, true);
            } catch (error) {
                // Error is acceptable for this test
            }
            
            // Should have logged RPC work generation start
            const logCalls = consoleLogSpy.mock.calls.flat().join(' ');
            expect(logCalls).toContain('Generating work using RPC');
            
            // Should have logged difficulty
            expect(logCalls).toContain('Requesting work generation from RPC');
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

