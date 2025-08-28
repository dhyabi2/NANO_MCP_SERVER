/**
 * Configuration for Pending Receive functionality
 * This is isolated from the main MCP configuration to maintain separation of concerns
 */
const PENDING_RECEIVE_CONFIG = {
    // RPC node configuration
    rpcNodes: process.env.PENDING_RPC_NODES ? JSON.parse(process.env.PENDING_RPC_NODES) : ['https://rpc.nano.to'],
    rpcKey: process.env.PENDING_RPC_KEY || 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
    
    // Endpoint configuration
    endpointPrefix: '/pending-receive',
    
    // Validation rules
    maxPendingBlocks: 100, // Maximum number of pending blocks to process in one request
    minConfirmations: 1,   // Minimum confirmations required for pending blocks
    
    // Work generation
    workDifficulty: {
        receive: 'fffffe0000000000',  // Difficulty for receive blocks
        open: 'fffffe0000000000'      // Difficulty for open blocks (first receive)
    },
    
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    },
    
    // Logging configuration
    logging: {
        level: process.env.PENDING_LOG_LEVEL || 'info',
        file: process.env.PENDING_LOG_FILE || 'logs/pending-receive.log'
    }
};

module.exports = PENDING_RECEIVE_CONFIG;
