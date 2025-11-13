/**
 * Work Cache System
 * Precomputes and caches work for faster transactions
 * 
 * This system dramatically improves transaction speed by:
 * 1. Precomputing work before it's needed
 * 2. Caching work in memory for instant retrieval
 * 3. Background refresh to keep cache fresh
 * 4. Automatic expiration of stale work
 */

"use strict";

class WorkCache {
    /**
     * Creates a new WorkCache instance
     * @param {Function} rpcCallFn - Function to call RPC (work_generate)
     * @param {Object} options - Configuration options
     * @param {number} options.ttl - Time to live for cached work in ms (default: 10 minutes)
     * @param {number} options.maxSize - Maximum cache size (default: 1000)
     */
    constructor(rpcCallFn, options = {}) {
        this.rpcCall = rpcCallFn;
        this.cache = new Map();
        this.usedWork = new Set(); // Track work that's been retrieved and is "in use"
        this.ttl = options.ttl || 10 * 60 * 1000; // 10 minutes default
        this.maxSize = options.maxSize || 1000;
        
        // Statistics
        this.stats = {
            hits: 0,
            misses: 0,
            precomputed: 0,
            evictions: 0,
            workInUse: 0
        };
        
        // Background worker
        this.backgroundWorker = null;
        this.isRunning = false;
        
        console.log('[WorkCache] Initialized with TTL:', this.ttl, 'ms, maxSize:', this.maxSize);
        console.log('[WorkCache] Concurrency-safe work reuse prevention enabled');
    }
    
    /**
     * Generate cache key
     * @private
     */
    _getCacheKey(hash, isOpen) {
        return `${hash}:${isOpen ? 'open' : 'send'}`;
    }
    
    /**
     * Get difficulty for block type
     * @private
     */
    _getDifficulty(isOpen) {
        return isOpen ? 'fffffe0000000000' : 'fffffff800000000';
    }
    
    /**
     * Check if cached entry is expired
     * @private
     */
    _isExpired(entry) {
        return Date.now() > entry.expiresAt;
    }
    
    /**
     * Evict oldest entry if cache is at max size
     * @private
     */
    _evictOldest() {
        if (this.cache.size < this.maxSize) {
            return;
        }
        
        // Find oldest entry
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            console.log('[WorkCache] Evicted oldest entry:', oldestKey);
        }
    }
    
    /**
     * Precompute work for a given hash
     * @param {string} hash - The hash to compute work for
     * @param {boolean} isOpen - Whether this is for an open/receive block
     * @param {boolean} force - Force recomputation even if work exists
     * @returns {Promise<string|null>} - The computed work or null on failure
     */
    async precomputeWork(hash, isOpen = false, force = false) {
        const cacheKey = this._getCacheKey(hash, isOpen);
        
        // Check if work already exists and is not expired
        if (!force && this.cache.has(cacheKey)) {
            const entry = this.cache.get(cacheKey);
            if (!this._isExpired(entry)) {
                console.log('[WorkCache] Work already cached for:', hash);
                return entry.work;
            }
        }
        
        try {
            console.log('[WorkCache] Precomputing work for hash:', hash, isOpen ? '(receive/open)' : '(send)');
            
            const difficulty = this._getDifficulty(isOpen);
            const result = await this.rpcCall('work_generate', {
                hash,
                difficulty
            });
            
            if (!result.work) {
                console.error('[WorkCache] RPC returned no work');
                return null;
            }
            
            // Evict oldest BEFORE adding new entry if cache will be full
            // Need to check if key exists first - if updating existing, no need to evict
            if (!this.cache.has(cacheKey)) {
                this._evictOldest();
            }
            
            // Store in cache
            this.cache.set(cacheKey, {
                work: result.work,
                timestamp: Date.now(),
                expiresAt: Date.now() + this.ttl,
                hash,
                isOpen
            });
            
            this.stats.precomputed++;
            console.log('[WorkCache] Work precomputed and cached:', result.work);
            
            return result.work;
        } catch (error) {
            console.error('[WorkCache] Failed to precompute work:', error.message);
            return null;
        }
    }
    
    /**
     * Get precomputed work from cache (read-only, doesn't mark as used)
     * @param {string} hash - The hash to get work for
     * @param {boolean} isOpen - Whether this is for an open/receive block
     * @returns {string|null} - The cached work or null if not found/expired
     */
    getWork(hash, isOpen = false) {
        const cacheKey = this._getCacheKey(hash, isOpen);
        
        if (!this.cache.has(cacheKey)) {
            this.stats.misses++;
            console.log('[WorkCache] Cache MISS for:', hash);
            return null;
        }
        
        const entry = this.cache.get(cacheKey);
        
        // Check if expired
        if (this._isExpired(entry)) {
            this.cache.delete(cacheKey);
            this.usedWork.delete(cacheKey); // Clean up used marker too
            this.stats.misses++;
            console.log('[WorkCache] Cache MISS (expired) for:', hash);
            return null;
        }
        
        this.stats.hits++;
        console.log('[WorkCache] Cache HIT for:', hash, '- Work:', entry.work);
        return entry.work;
    }
    
    /**
     * Get precomputed work and mark as "in use" (concurrency-safe)
     * Once work is retrieved with this method, it cannot be retrieved again
     * until invalidated and recomputed. This prevents work reuse in concurrent scenarios.
     * @param {string} hash - The hash to get work for
     * @param {boolean} isOpen - Whether this is for an open/receive block
     * @returns {string|null} - The cached work or null if not found/expired/already in use
     */
    getWorkAndMarkUsed(hash, isOpen = false) {
        const cacheKey = this._getCacheKey(hash, isOpen);
        
        // Check if work is already in use (prevents concurrent reuse)
        if (this.usedWork.has(cacheKey)) {
            this.stats.misses++;
            this.stats.workInUse++;
            console.log('[WorkCache] Work already IN USE for:', hash, '- preventing reuse');
            return null;
        }
        
        if (!this.cache.has(cacheKey)) {
            this.stats.misses++;
            console.log('[WorkCache] Cache MISS for:', hash);
            return null;
        }
        
        const entry = this.cache.get(cacheKey);
        
        // Check if expired
        if (this._isExpired(entry)) {
            this.cache.delete(cacheKey);
            this.usedWork.delete(cacheKey);
            this.stats.misses++;
            console.log('[WorkCache] Cache MISS (expired) for:', hash);
            return null;
        }
        
        // Mark as in use (prevents concurrent transactions from using same work)
        this.usedWork.add(cacheKey);
        this.stats.hits++;
        console.log('[WorkCache] ⚡ Cache HIT and MARKED IN USE for:', hash, '- Work:', entry.work);
        return entry.work;
    }
    
    /**
     * Invalidate cached work for a specific hash
     * Also removes "in use" marker to allow new work to be used
     * @param {string} hash - The hash to invalidate
     * @param {boolean} isOpen - Whether this is for an open/receive block
     */
    invalidate(hash, isOpen = false) {
        const cacheKey = this._getCacheKey(hash, isOpen);
        const deletedCache = this.cache.delete(cacheKey);
        const deletedUsed = this.usedWork.delete(cacheKey);
        
        if (deletedCache || deletedUsed) {
            console.log('[WorkCache] Invalidated cache and usage marker for:', hash);
        }
    }
    
    /**
     * Clear entire cache and all usage markers
     */
    clear() {
        const size = this.cache.size;
        const usedSize = this.usedWork.size;
        this.cache.clear();
        this.usedWork.clear();
        console.log('[WorkCache] Cache cleared. Removed', size, 'entries and', usedSize, 'usage markers');
    }
    
    /**
     * Get cache statistics
     * @returns {Object} - Statistics object
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? this.stats.hits / total : 0;
        
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: hitRate,
            size: this.cache.size,
            precomputed: this.stats.precomputed,
            evictions: this.stats.evictions,
            workInUse: this.stats.workInUse,
            usedWorkCount: this.usedWork.size
        };
    }
    
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            precomputed: 0,
            evictions: 0,
            workInUse: 0
        };
        console.log('[WorkCache] Statistics reset');
    }
    
    /**
     * Start background worker to refresh cache
     * @param {number} interval - Refresh interval in ms (default: 5 minutes)
     */
    startBackgroundWorker(interval = 5 * 60 * 1000) {
        if (this.isRunning) {
            console.log('[WorkCache] Background worker already running');
            return;
        }
        
        console.log('[WorkCache] Starting background worker with interval:', interval, 'ms');
        this.isRunning = true;
        
        this.backgroundWorker = setInterval(() => {
            this._refreshCache();
        }, interval);
    }
    
    /**
     * Stop background worker
     */
    stopBackgroundWorker() {
        if (!this.isRunning) {
            return;
        }
        
        console.log('[WorkCache] Stopping background worker');
        clearInterval(this.backgroundWorker);
        this.backgroundWorker = null;
        this.isRunning = false;
    }
    
    /**
     * Check if background worker is running
     * @returns {boolean}
     */
    isBackgroundWorkerRunning() {
        return this.isRunning;
    }
    
    /**
     * Refresh cache by removing expired entries
     * @private
     */
    _refreshCache() {
        console.log('[WorkCache] Refreshing cache...');
        let expiredCount = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (this._isExpired(entry)) {
                this.cache.delete(key);
                expiredCount++;
            }
        }
        
        if (expiredCount > 0) {
            console.log('[WorkCache] Removed', expiredCount, 'expired entries');
        }
        
        console.log('[WorkCache] Cache size after refresh:', this.cache.size);
    }
    
    /**
     * Precompute work for an account's current frontier
     * Useful after fetching account info
     * @param {Object} accountInfo - Account info from RPC
     * @returns {Promise<string|null>} - Precomputed work
     */
    async precomputeForAccount(accountInfo) {
        if (!accountInfo || accountInfo.error || !accountInfo.frontier) {
            console.log('[WorkCache] No valid account info to precompute for');
            return null;
        }
        
        console.log('[WorkCache] Precomputing work for account frontier:', accountInfo.frontier);
        return await this.precomputeWork(accountInfo.frontier, false); // send blocks
    }
    
    /**
     * Precompute work for multiple hashes
     * @param {Array<{hash: string, isOpen: boolean}>} items - Array of hashes to precompute
     * @returns {Promise<Array>} - Results of precomputation
     */
    async precomputeBatch(items) {
        console.log('[WorkCache] Batch precomputing', items.length, 'items');
        
        const promises = items.map(item => 
            this.precomputeWork(item.hash, item.isOpen || false)
        );
        
        return await Promise.all(promises);
    }
}

module.exports = { WorkCache };

