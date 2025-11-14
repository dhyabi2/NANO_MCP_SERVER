/**
 * Balance Converter Tests - TDD approach
 * Tests for conversion between NANO and raw units
 */

const { BalanceConverter } = require('../utils/balance-converter');

describe('BalanceConverter', () => {
    describe('rawToNano conversion', () => {
        test('should convert 1 NANO (10^30 raw) correctly', () => {
            const raw = '1000000000000000000000000000000'; // 1 NANO
            const result = BalanceConverter.rawToNano(raw);
            expect(result).toBe('1');
        });

        test('should convert 0.1 NANO correctly', () => {
            const raw = '100000000000000000000000000000'; // 0.1 NANO
            const result = BalanceConverter.rawToNano(raw);
            expect(result).toBe('0.1');
        });

        test('should convert 0.001 NANO correctly', () => {
            const raw = '1000000000000000000000000000'; // 0.001 NANO
            const result = BalanceConverter.rawToNano(raw);
            expect(result).toBe('0.001');
        });

        test('should convert 0.0011 NANO correctly (user reported bug)', () => {
            const raw = '1100000000000000000000000000'; // 0.0011 NANO
            const result = BalanceConverter.rawToNano(raw);
            expect(result).toBe('0.0011');
        });

        test('should convert 0.000001 NANO correctly', () => {
            const raw = '1000000000000000000000000'; // 0.000001 NANO
            const result = BalanceConverter.rawToNano(raw);
            expect(result).toBe('0.000001');
        });

        test('should convert 0 raw correctly', () => {
            const raw = '0';
            const result = BalanceConverter.rawToNano(raw);
            expect(result).toBe('0');
        });

        test('should convert large amounts correctly', () => {
            const raw = '133248297920938463463374607431768211455'; // Large amount
            const result = BalanceConverter.rawToNano(raw);
            // This is actually 133248297.920938463463374607431768211455 NANO
            expect(parseFloat(result)).toBeCloseTo(133248297.920938, 6);
        });

        test('should handle maximum precision', () => {
            const raw = '1234567890123456789012345678901'; // 1.234567890123... NANO
            const result = BalanceConverter.rawToNano(raw);
            expect(result).toMatch(/^1\.234567/);
        });
    });

    describe('nanoToRaw conversion', () => {
        test('should convert 1 NANO to raw correctly', () => {
            const nano = '1';
            const result = BalanceConverter.nanoToRaw(nano);
            expect(result).toBe('1000000000000000000000000000000');
        });

        test('should convert 0.1 NANO to raw correctly', () => {
            const nano = '0.1';
            const result = BalanceConverter.nanoToRaw(nano);
            expect(result).toBe('100000000000000000000000000000');
        });

        test('should convert 0.001 NANO to raw correctly', () => {
            const nano = '0.001';
            const result = BalanceConverter.nanoToRaw(nano);
            expect(result).toBe('1000000000000000000000000000');
        });

        test('should convert 0.0011 NANO to raw correctly', () => {
            const nano = '0.0011';
            const result = BalanceConverter.nanoToRaw(nano);
            expect(result).toBe('1100000000000000000000000000');
        });

        test('should handle numeric input', () => {
            const nano = 0.5;
            const result = BalanceConverter.nanoToRaw(nano);
            expect(result).toBe('500000000000000000000000000000');
        });
    });

    describe('Round-trip conversions', () => {
        test('should maintain value through round-trip conversion', () => {
            const originalNano = '0.123456';
            const raw = BalanceConverter.nanoToRaw(originalNano);
            const backToNano = BalanceConverter.rawToNano(raw);
            expect(backToNano).toBe(originalNano);
        });

        test('should maintain value for small amounts', () => {
            const originalNano = '0.000001';
            const raw = BalanceConverter.nanoToRaw(originalNano);
            const backToNano = BalanceConverter.rawToNano(raw);
            expect(backToNano).toBe(originalNano);
        });

        test('should maintain value for large amounts', () => {
            const originalNano = '1000';
            const raw = BalanceConverter.nanoToRaw(originalNano);
            const backToNano = BalanceConverter.rawToNano(raw);
            expect(backToNano).toBe(originalNano);
        });
    });

    describe('Edge cases', () => {
        test('should handle zero correctly', () => {
            expect(BalanceConverter.nanoToRaw('0')).toBe('0');
            expect(BalanceConverter.rawToNano('0')).toBe('0');
        });

        test('should remove trailing zeros', () => {
            const raw = '100000000000000000000000000000'; // 0.1
            const result = BalanceConverter.rawToNano(raw);
            expect(result).toBe('0.1');
            expect(result).not.toBe('0.100000');
        });

        test('should validate raw amounts', () => {
            expect(BalanceConverter.isValidRaw('1000')).toBe(true);
            expect(BalanceConverter.isValidRaw('0')).toBe(true);
            expect(BalanceConverter.isValidRaw('invalid')).toBe(false);
            expect(BalanceConverter.isValidRaw('-100')).toBe(false);
        });
    });

    describe('Logging', () => {
        test('should log conversion for debugging', () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            BalanceConverter.rawToNano('1000000000000000000000000000');
            
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('[BalanceConverter] Converting')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('[BalanceConverter] Result:')
            );
            
            consoleLogSpy.mockRestore();
        });
    });
});

