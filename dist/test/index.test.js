const { describe, test, expect } = require('@jest/globals');
describe('Basic Test', () => {
    test('should pass', () => {
        expect(true).toBe(true);
    });
});
export {};
