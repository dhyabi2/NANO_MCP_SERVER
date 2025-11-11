/**
 * Jest configuration for NANO MCP Server
 */

module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Test file patterns
    testMatch: [
        '**/tests/**/*.test.js',
        '**/?(*.)+(spec|test).js'
    ],

    // Coverage collection
    collectCoverageFrom: [
        'utils/**/*.js',
        'src/**/*.js',
        '!src/index.js',
        '!**/node_modules/**'
    ],

    // Coverage thresholds
    coverageThresholds: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // Verbose output
    verbose: true,

    // Timeout for tests (30 seconds to account for crypto operations)
    testTimeout: 30000,

    // Clear mocks between tests
    clearMocks: true,

    // Coverage directory
    coverageDirectory: 'coverage',

    // Setup files
    setupFilesAfterEnv: [],

    // Module paths
    moduleDirectories: ['node_modules', 'src', 'utils'],

    // Transform (none needed for plain JS)
    transform: {}
};

