/**
 * Stale Frontier Bug Tests - TDD approach
 * Tests that frontier is properly refreshed after receiving pending blocks
 */

const { NanoTransactions } = require('../utils/nano-transactions');

describe('Stale Frontier Bug Fix', () => {
    let nanoTransactions;
    let mockRpcCallCount;
    let mockFrontiers;
    
    beforeEach(() => {
        nanoTransactions = new NanoTransactions({
            apiUrl: 'https://uk1.public.xnopay.com/proxy',
            rpcKey: null
        });
        
        mockRpcCallCount = 0;
        mockFrontiers = {
            initial: '0000000000000000000000000000000000000000000000000000000000000001',
            afterReceive: '0000000000000000000000000000000000000000000000000000000000000002'
        };
        
        // Clear console output for cleaner test logs
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Frontier Tracking', () => {
        test('should wait for RPC node to confirm new frontier after receive', async () => {
            const testWallet = {
                address: 'nano_3test1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg',
                privateKey: '0000000000000000000000000000000000000000000000000000000000000001'
            };
            
            // Mock the RPC calls
            jest.spyOn(nanoTransactions, 'makeRequest').mockImplementation(async (action, params) => {
                mockRpcCallCount++;
                
                if (action === 'pending') {
                    // Return pending blocks on first call, then empty
                    if (mockRpcCallCount === 1) {
                        return {
                            blocks: {
                                'hash1': { amount: '1000000000000000000000000000', source: 'nano_1source1' }
                            }
                        };
                    }
                    return { blocks: {} };
                }
                
                if (action === 'account_info') {
                    // Simulate RPC delay in updating frontier
                    if (mockRpcCallCount <= 4) {
                        // Return old frontier for first few calls
                        return {
                            frontier: mockFrontiers.initial,
                            balance: '1000000000000000000000000000',
                            representative: 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf'
                        };
                    } else {
                        // Return new frontier after "RPC updates"
                        return {
                            frontier: mockFrontiers.afterReceive,
                            balance: '2000000000000000000000000000',
                            representative: 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf'
                        };
                    }
                }
                
                return {};
            });
            
            // Mock receiveAllPending to return new frontier
            jest.spyOn(nanoTransactions, 'receiveAllPending').mockResolvedValue([
                { hash: mockFrontiers.afterReceive }
            ]);
            
            // Mock work generation
            jest.spyOn(nanoTransactions, 'generateWork').mockResolvedValue('mock_work_value');
            
            try {
                await nanoTransactions.sendTransaction(
                    testWallet.address,
                    testWallet.privateKey,
                    'nano_1dest1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg',
                    '500000000000000000000000000' // 0.0005 NANO
                );
            } catch (error) {
                // Transaction may fail due to mocking, but we're testing frontier tracking
            }
            
            // Verify that frontier tracking happened
            const logs = console.log.mock.calls.flat().join(' ');
            expect(logs).toContain('[FrontierTrack]');
            expect(logs).toContain('Frontier before receive');
            expect(logs).toContain('New frontier from receive');
        }, 30000);

        test('should retry multiple times if frontier not confirmed', async () => {
            const testWallet = {
                address: 'nano_3test1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg',
                privateKey: '0000000000000000000000000000000000000000000000000000000000000001'
            };
            
            let accountInfoCallCount = 0;
            
            // Mock the RPC calls
            jest.spyOn(nanoTransactions, 'makeRequest').mockImplementation(async (action, params) => {
                if (action === 'pending') {
                    return {
                        blocks: {
                            'hash1': { amount: '1000000000000000000000000000', source: 'nano_1source1' }
                        }
                    };
                }
                
                if (action === 'account_info') {
                    accountInfoCallCount++;
                    // Always return old frontier to test retry mechanism
                    return {
                        frontier: mockFrontiers.initial,
                        balance: '1000000000000000000000000000',
                        representative: 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf'
                    };
                }
                
                return {};
            });
            
            jest.spyOn(nanoTransactions, 'receiveAllPending').mockResolvedValue([
                { hash: mockFrontiers.afterReceive }
            ]);
            
            jest.spyOn(nanoTransactions, 'generateWork').mockResolvedValue('mock_work_value');
            
            try {
                await nanoTransactions.sendTransaction(
                    testWallet.address,
                    testWallet.privateKey,
                    'nano_1dest1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg',
                    '500000000000000000000000000'
                );
            } catch (error) {
                // Expected to fail due to mocking
            }
            
            // Should have made multiple account_info calls (retries)
            expect(accountInfoCallCount).toBeGreaterThan(1);
            
            const logs = console.warn.mock.calls.flat().join(' ');
            expect(logs).toContain('Max retries reached');
        }, 30000);
    });

    describe('No Pending Blocks', () => {
        test('should not do frontier tracking when no pending blocks', async () => {
            const testWallet = {
                address: 'nano_3test1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg',
                privateKey: '0000000000000000000000000000000000000000000000000000000000000001'
            };
            
            // Mock the RPC calls
            jest.spyOn(nanoTransactions, 'makeRequest').mockImplementation(async (action, params) => {
                if (action === 'pending') {
                    return { blocks: {} }; // No pending blocks
                }
                
                if (action === 'account_info') {
                    return {
                        frontier: mockFrontiers.initial,
                        balance: '1000000000000000000000000000',
                        representative: 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf'
                    };
                }
                
                if (action === 'process') {
                    return { hash: 'new_block_hash' };
                }
                
                return {};
            });
            
            jest.spyOn(nanoTransactions, 'generateWork').mockResolvedValue('mock_work_value');
            
            const result = await nanoTransactions.sendTransaction(
                testWallet.address,
                testWallet.privateKey,
                'nano_1dest1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg',
                '500000000000000000000000000'
            );
            
            expect(result.success).toBe(true);
            expect(result.hash).toBe('new_block_hash');
            
            const logs = console.log.mock.calls.flat().join(' ');
            expect(logs).toContain('No pending blocks to receive');
            expect(logs).not.toContain('Frontier before receive');
        });
    });
});

