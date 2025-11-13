/**
 * Work Cache Tests - TDD approach
 * Tests for work precomputation and caching system
 */

const { WorkCache } = require('../utils/work-cache');

describe('Work Cache System', () => {
    let workCache;
    let mockRpcCall;
    
    beforeEach(() => {
        // Mock RPC call function
        mockRpcCall = jest.fn().mockResolvedValue({
            work: 'precomputed_work_12345'
        });
        
        workCache = new WorkCache(mockRpcCall);
        
        // Clear console output for cleaner test logs
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
        if (workCache) {
            workCache.stopBackgroundWorker();
        }
    });

    describe('Cache Operations', () => {
        test('should store precomputed work', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            await workCache.precomputeWork(hash, false);
            
            const cachedWork = workCache.getWork(hash, false);
            expect(cachedWork).toBe('precomputed_work_12345');
        });

        test('should return null for non-existent work', () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            const cachedWork = workCache.getWork(hash, false);
            expect(cachedWork).toBeNull();
        });

        test('should store separate work for send and receive', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            mockRpcCall.mockResolvedValueOnce({ work: 'send_work' });
            mockRpcCall.mockResolvedValueOnce({ work: 'receive_work' });
            
            await workCache.precomputeWork(hash, false); // send
            await workCache.precomputeWork(hash, true);  // receive
            
            expect(workCache.getWork(hash, false)).toBe('send_work');
            expect(workCache.getWork(hash, true)).toBe('receive_work');
        });

        test('should invalidate work for a specific hash', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            await workCache.precomputeWork(hash, false);
            expect(workCache.getWork(hash, false)).toBe('precomputed_work_12345');
            
            workCache.invalidate(hash, false);
            expect(workCache.getWork(hash, false)).toBeNull();
        });

        test('should clear entire cache', async () => {
            const hash1 = '0000000000000000000000000000000000000000000000000000000000000001';
            const hash2 = '0000000000000000000000000000000000000000000000000000000000000002';
            
            await workCache.precomputeWork(hash1, false);
            await workCache.precomputeWork(hash2, false);
            
            workCache.clear();
            
            expect(workCache.getWork(hash1, false)).toBeNull();
            expect(workCache.getWork(hash2, false)).toBeNull();
        });
    });

    describe('Precomputation', () => {
        test('should precompute work using RPC', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            await workCache.precomputeWork(hash, false);
            
            expect(mockRpcCall).toHaveBeenCalledWith('work_generate', {
                hash,
                difficulty: 'fffffff800000000'
            });
        });

        test('should use correct difficulty for send blocks', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            await workCache.precomputeWork(hash, false);
            
            expect(mockRpcCall).toHaveBeenCalledWith('work_generate', {
                hash,
                difficulty: 'fffffff800000000'
            });
        });

        test('should use correct difficulty for receive blocks', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            await workCache.precomputeWork(hash, true);
            
            expect(mockRpcCall).toHaveBeenCalledWith('work_generate', {
                hash,
                difficulty: 'fffffe0000000000'
            });
        });

        test('should handle RPC errors gracefully', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            mockRpcCall.mockRejectedValue(new Error('RPC unavailable'));
            
            await workCache.precomputeWork(hash, false);
            
            // Should not store failed work
            expect(workCache.getWork(hash, false)).toBeNull();
        });

        test('should not overwrite existing valid work', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            mockRpcCall.mockResolvedValueOnce({ work: 'first_work' });
            mockRpcCall.mockResolvedValueOnce({ work: 'second_work' });
            
            await workCache.precomputeWork(hash, false);
            await workCache.precomputeWork(hash, false); // Try to precompute again
            
            // Should still have first work (unless forced)
            expect(workCache.getWork(hash, false)).toBe('first_work');
            expect(mockRpcCall).toHaveBeenCalledTimes(1);
        });

        test('should force recompute when specified', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            mockRpcCall.mockResolvedValueOnce({ work: 'first_work' });
            mockRpcCall.mockResolvedValueOnce({ work: 'second_work' });
            
            await workCache.precomputeWork(hash, false);
            await workCache.precomputeWork(hash, false, true); // Force recompute
            
            expect(workCache.getWork(hash, false)).toBe('second_work');
            expect(mockRpcCall).toHaveBeenCalledTimes(2);
        });
    });

    describe('Cache Statistics', () => {
        test('should track cache hits', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            await workCache.precomputeWork(hash, false);
            
            workCache.getWork(hash, false);
            workCache.getWork(hash, false);
            workCache.getWork(hash, false);
            
            const stats = workCache.getStats();
            expect(stats.hits).toBe(3);
        });

        test('should track cache misses', () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            workCache.getWork(hash, false);
            workCache.getWork(hash, false);
            
            const stats = workCache.getStats();
            expect(stats.misses).toBe(2);
        });

        test('should calculate hit rate', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            await workCache.precomputeWork(hash, false);
            
            workCache.getWork(hash, false); // hit
            workCache.getWork(hash, false); // hit
            workCache.getWork('different_hash', false); // miss
            
            const stats = workCache.getStats();
            expect(stats.hitRate).toBeCloseTo(0.667, 2);
        });

        test('should track cache size', async () => {
            const hash1 = '0000000000000000000000000000000000000000000000000000000000000001';
            const hash2 = '0000000000000000000000000000000000000000000000000000000000000002';
            
            await workCache.precomputeWork(hash1, false);
            await workCache.precomputeWork(hash2, false);
            
            const stats = workCache.getStats();
            expect(stats.size).toBe(2);
        });

        test('should reset statistics', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            await workCache.precomputeWork(hash, false);
            workCache.getWork(hash, false);
            workCache.getWork('different', false);
            
            workCache.resetStats();
            
            const stats = workCache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
        });
    });

    describe('Cache Expiration', () => {
        test('should expire old cached work', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            // Create cache with 1 second TTL
            const shortTTLCache = new WorkCache(mockRpcCall, { ttl: 1000 });
            
            await shortTTLCache.precomputeWork(hash, false);
            expect(shortTTLCache.getWork(hash, false)).toBe('precomputed_work_12345');
            
            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            expect(shortTTLCache.getWork(hash, false)).toBeNull();
            
            shortTTLCache.stopBackgroundWorker();
        });

        test('should not return expired work', async () => {
            const hash = '0000000000000000000000000000000000000000000000000000000000000001';
            
            const shortTTLCache = new WorkCache(mockRpcCall, { ttl: 500 });
            
            await shortTTLCache.precomputeWork(hash, false);
            
            await new Promise(resolve => setTimeout(resolve, 600));
            
            const work = shortTTLCache.getWork(hash, false);
            expect(work).toBeNull();
            
            shortTTLCache.stopBackgroundWorker();
        });
    });

    describe('Cache Limits', () => {
        test('should enforce maximum cache size', async () => {
            const limitedCache = new WorkCache(mockRpcCall, { maxSize: 2 });
            
            await limitedCache.precomputeWork('hash1', false);
            await limitedCache.precomputeWork('hash2', false);
            await limitedCache.precomputeWork('hash3', false);
            
            const stats = limitedCache.getStats();
            expect(stats.size).toBeLessThanOrEqual(2);
            
            limitedCache.stopBackgroundWorker();
        });

        test('should evict oldest entries when cache is full', async () => {
            const limitedCache = new WorkCache(mockRpcCall, { maxSize: 2 });
            
            await limitedCache.precomputeWork('hash1', false);
            await new Promise(resolve => setTimeout(resolve, 10));
            await limitedCache.precomputeWork('hash2', false);
            await new Promise(resolve => setTimeout(resolve, 10));
            await limitedCache.precomputeWork('hash3', false);
            
            // hash1 should be evicted (oldest)
            expect(limitedCache.getWork('hash1', false)).toBeNull();
            expect(limitedCache.getWork('hash2', false)).not.toBeNull();
            expect(limitedCache.getWork('hash3', false)).not.toBeNull();
            
            limitedCache.stopBackgroundWorker();
        });
    });

    describe('Background Worker', () => {
        test('should have background worker disabled by default', () => {
            expect(workCache.isBackgroundWorkerRunning()).toBe(false);
        });

        test('should start background worker', () => {
            workCache.startBackgroundWorker(5000);
            expect(workCache.isBackgroundWorkerRunning()).toBe(true);
        });

        test('should stop background worker', () => {
            workCache.startBackgroundWorker(5000);
            workCache.stopBackgroundWorker();
            expect(workCache.isBackgroundWorkerRunning()).toBe(false);
        });
    });

    describe('Concurrent Precomputation', () => {
        test('should handle concurrent precomputation requests', async () => {
            const hashes = [
                'hash1',
                'hash2',
                'hash3',
                'hash4',
                'hash5'
            ];
            
            const promises = hashes.map(hash => workCache.precomputeWork(hash, false));
            await Promise.all(promises);
            
            hashes.forEach(hash => {
                expect(workCache.getWork(hash, false)).not.toBeNull();
            });
        });
    });
});

