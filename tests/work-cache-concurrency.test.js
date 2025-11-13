/**
 * Work Cache Concurrency Tests - TDD approach
 * Tests for handling concurrent transactions from multiple users
 */

const { WorkCache } = require('../utils/work-cache');

describe('Work Cache Concurrency Safety', () => {
    let workCache;
    let mockRpcCall;
    
    beforeEach(() => {
        mockRpcCall = jest.fn().mockResolvedValue({
            work: 'precomputed_work_12345'
        });
        
        workCache = new WorkCache(mockRpcCall);
        
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
        if (workCache) {
            workCache.stopBackgroundWorker();
        }
    });

    describe('Work Reuse Prevention', () => {
        test('should mark work as "in use" when retrieved', async () => {
            const hash = 'frontier_hash_001';
            
            await workCache.precomputeWork(hash, false);
            
            // First retrieval should succeed and mark as "in use"
            const work1 = workCache.getWorkAndMarkUsed(hash, false);
            expect(work1).toBe('precomputed_work_12345');
            
            // Second retrieval should return null (work already in use)
            const work2 = workCache.getWorkAndMarkUsed(hash, false);
            expect(work2).toBeNull();
        });

        test('should prevent work reuse across concurrent requests', async () => {
            const hash = 'frontier_hash_001';
            
            await workCache.precomputeWork(hash, false);
            
            // Simulate two concurrent transactions
            const work1 = workCache.getWorkAndMarkUsed(hash, false);
            const work2 = workCache.getWorkAndMarkUsed(hash, false);
            
            // Only first should succeed
            expect(work1).not.toBeNull();
            expect(work2).toBeNull();
        });

        test('should allow new work after invalidation', async () => {
            const hash = 'frontier_hash_001';
            
            await workCache.precomputeWork(hash, false);
            
            // Use the work
            const work1 = workCache.getWorkAndMarkUsed(hash, false);
            expect(work1).not.toBeNull();
            
            // Try to use again - should fail
            const work2 = workCache.getWorkAndMarkUsed(hash, false);
            expect(work2).toBeNull();
            
            // Invalidate and precompute new work
            workCache.invalidate(hash, false);
            mockRpcCall.mockResolvedValueOnce({ work: 'new_work_67890' });
            await workCache.precomputeWork(hash, false);
            
            // Should be able to use new work
            const work3 = workCache.getWorkAndMarkUsed(hash, false);
            expect(work3).toBe('new_work_67890');
        });
    });

    describe('Concurrent Transaction Scenarios', () => {
        test('should handle two users sending from same account simultaneously', async () => {
            const hash = 'shared_frontier_001';
            
            // Precompute work for the account
            await workCache.precomputeWork(hash, false);
            
            // Simulate two users trying to send at the same time
            const results = await Promise.all([
                Promise.resolve(workCache.getWorkAndMarkUsed(hash, false)),
                Promise.resolve(workCache.getWorkAndMarkUsed(hash, false))
            ]);
            
            // Only one should get work
            const successCount = results.filter(r => r !== null).length;
            expect(successCount).toBe(1);
        });

        test('should handle multiple accounts sending concurrently', async () => {
            const hashes = [
                'account1_frontier',
                'account2_frontier',
                'account3_frontier'
            ];
            
            // Precompute work for all accounts
            await Promise.all(hashes.map(hash => workCache.precomputeWork(hash, false)));
            
            // All should be able to send simultaneously (different accounts)
            const results = await Promise.all(
                hashes.map(hash => Promise.resolve(workCache.getWorkAndMarkUsed(hash, false)))
            );
            
            // All should succeed
            results.forEach(result => {
                expect(result).not.toBeNull();
            });
        });

        test('should handle rapid sequential sends from same account', async () => {
            let currentFrontier = 'initial_frontier';
            const sendCount = 5;
            const results = [];
            
            for (let i = 0; i < sendCount; i++) {
                // Precompute work for current frontier
                mockRpcCall.mockResolvedValueOnce({ work: `work_${i}` });
                await workCache.precomputeWork(currentFrontier, false);
                
                // Get work (simulating send)
                const work = workCache.getWorkAndMarkUsed(currentFrontier, false);
                results.push(work);
                
                // Simulate successful send: invalidate old, prepare new
                workCache.invalidate(currentFrontier, false);
                currentFrontier = `frontier_after_send_${i}`;
            }
            
            // All sends should have gotten work
            expect(results.filter(r => r !== null).length).toBe(sendCount);
            expect(results.every(r => r !== null)).toBe(true);
        });
    });

    describe('Fallback Behavior', () => {
        test('should fallback to regular getWork if getWorkAndMarkUsed not available', async () => {
            const hash = 'frontier_hash_001';
            
            await workCache.precomputeWork(hash, false);
            
            // Regular getWork should still work
            const work = workCache.getWork(hash, false);
            expect(work).toBe('precomputed_work_12345');
        });
    });

    describe('Work State Management', () => {
        test('should track used work separately from cache', async () => {
            const hash = 'frontier_hash_001';
            
            await workCache.precomputeWork(hash, false);
            
            // Mark as used
            workCache.getWorkAndMarkUsed(hash, false);
            
            // Work should still be in cache but marked as used
            const stats = workCache.getStats();
            expect(stats.size).toBeGreaterThan(0);
        });

        test('should clean up used work markers after invalidation', async () => {
            const hash = 'frontier_hash_001';
            
            await workCache.precomputeWork(hash, false);
            workCache.getWorkAndMarkUsed(hash, false);
            
            // Invalidate should clean up used marker
            workCache.invalidate(hash, false);
            
            // Should be able to precompute and use again
            mockRpcCall.mockResolvedValueOnce({ work: 'new_work' });
            await workCache.precomputeWork(hash, false);
            const work = workCache.getWorkAndMarkUsed(hash, false);
            expect(work).toBe('new_work');
        });
    });

    describe('Statistics with Concurrent Access', () => {
        test('should accurately track hits with concurrent access', async () => {
            const hash = 'frontier_hash_001';
            
            await workCache.precomputeWork(hash, false);
            
            // Multiple concurrent reads (before marking as used)
            await Promise.all([
                Promise.resolve(workCache.getWork(hash, false)),
                Promise.resolve(workCache.getWork(hash, false)),
                Promise.resolve(workCache.getWork(hash, false))
            ]);
            
            const stats = workCache.getStats();
            expect(stats.hits).toBe(3);
        });

        test('should track both hits and "work in use" separately', async () => {
            const hash = 'frontier_hash_001';
            
            await workCache.precomputeWork(hash, false);
            
            // First use
            workCache.getWorkAndMarkUsed(hash, false);
            
            // Try to use again
            workCache.getWorkAndMarkUsed(hash, false);
            
            const stats = workCache.getStats();
            expect(stats.workInUse).toBeGreaterThan(0);
        });
    });

    describe('Cache Cleanup', () => {
        test('should clear used markers when clearing cache', async () => {
            const hash = 'frontier_hash_001';
            
            await workCache.precomputeWork(hash, false);
            workCache.getWorkAndMarkUsed(hash, false);
            
            workCache.clear();
            
            // After clear, should be able to precompute and use
            mockRpcCall.mockResolvedValueOnce({ work: 'new_work' });
            await workCache.precomputeWork(hash, false);
            const work = workCache.getWorkAndMarkUsed(hash, false);
            expect(work).toBe('new_work');
        });
    });
});

