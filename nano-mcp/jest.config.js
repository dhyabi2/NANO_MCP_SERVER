/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.json',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(nanocurrency-web|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill|web-streams-polyfill)/)'
  ],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  moduleDirectories: ['node_modules'],
  testTimeout: 300000
}; 