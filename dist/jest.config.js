/** @type {import('jest').Config} */
export default {
    testEnvironment: 'node',
    verbose: true,
    transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest', {
                useESM: true,
            }],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    testMatch: [
        '**/test/**/*.test.js',
        '**/test/**/*.test.ts'
    ]
};
