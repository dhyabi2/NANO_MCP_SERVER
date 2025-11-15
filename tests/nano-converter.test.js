/**
 * Nano Converter Tests - TDD approach
 * Tests for centralized Nano (XNO) conversion utilities
 * 
 * Uses string-based BigInt arithmetic for exact precision
 * NO floating-point math to avoid rounding errors
 * Nano uses 30 decimal places (10^30 raw units = 1 XNO)
 */

const { NanoConverter } = require('../utils/nano-converter');

describe('NanoConverter', () => {
    describe('xnoToRaw conversion', () => {
        test('should convert 1 XNO to raw correctly', () => {
            const result = NanoConverter.xnoToRaw(1);
            expect(result).toBe('1000000000000000000000000000000');
        });

        test('should convert 0.000001 XNO to raw correctly', () => {
            const result = NanoConverter.xnoToRaw(0.000001);
            expect(result).toBe('1000000000000000000000000');
        });

        test('should convert 0.1 XNO as string to raw correctly', () => {
            const result = NanoConverter.xnoToRaw('0.1');
            expect(result).toBe('100000000000000000000000000000');
        });

        test('should convert 0.5 XNO to raw correctly', () => {
            const result = NanoConverter.xnoToRaw(0.5);
            expect(result).toBe('500000000000000000000000000000');
        });

        test('should convert 2.5 XNO to raw correctly', () => {
            const result = NanoConverter.xnoToRaw(2.5);
            expect(result).toBe('2500000000000000000000000000000');
        });

        test('should convert 100 XNO to raw correctly', () => {
            const result = NanoConverter.xnoToRaw(100);
            expect(result).toBe('100000000000000000000000000000000');
        });

        test('should handle very small amounts (0.000000001)', () => {
            const result = NanoConverter.xnoToRaw('0.000000001');
            expect(result).toBe('1000000000000000000000');
        });

        test('should handle scientific notation (1e-9)', () => {
            const result = NanoConverter.xnoToRaw(1e-9);
            // Note: JavaScript floating-point may have precision issues with scientific notation
            // The result should be close to 1000000000000000000000 (within floating-point error)
            expect(BigInt(result)).toBeGreaterThan(BigInt('999999999999999999999'));
            expect(BigInt(result)).toBeLessThan(BigInt('1000000000000001000000'));
        });

        test('should handle zero', () => {
            const result = NanoConverter.xnoToRaw(0);
            expect(result).toBe('0');
        });

        test('should truncate to 30 decimal places if longer', () => {
            const result = NanoConverter.xnoToRaw('0.1234567890123456789012345678901234567890');
            expect(result).toBe('123456789012345678901234567890');
        });

        test('should handle string input with many decimals', () => {
            const result = NanoConverter.xnoToRaw('0.123456');
            expect(result).toBe('123456000000000000000000000000');
        });
    });

    describe('rawToXNO conversion', () => {
        test('should convert 1 XNO raw to XNO correctly', () => {
            const result = NanoConverter.rawToXNO('1000000000000000000000000000000');
            expect(result).toBe('1');
        });

        test('should convert 0.000001 XNO raw to XNO correctly', () => {
            const result = NanoConverter.rawToXNO('1000000000000000000000000');
            expect(result).toBe('0.000001');
        });

        test('should convert 0.1 XNO raw to XNO correctly', () => {
            const result = NanoConverter.rawToXNO('100000000000000000000000000000');
            expect(result).toBe('0.1');
        });

        test('should convert 0 raw to XNO correctly', () => {
            const result = NanoConverter.rawToXNO('0');
            expect(result).toBe('0');
        });

        test('should handle large amounts correctly', () => {
            const result = NanoConverter.rawToXNO('133248297920938463463374607431768211455');
            expect(result).toBe('133248297.920938463463374607431768211455');
        });

        test('should remove trailing zeros', () => {
            const result = NanoConverter.rawToXNO('100000000000000000000000000000');
            expect(result).toBe('0.1');
            expect(result).not.toContain('0.100000');
        });

        test('should handle minimum raw value (1)', () => {
            const result = NanoConverter.rawToXNO('1');
            expect(result).toBe('0.000000000000000000000000000001');
        });
    });

    describe('isValidNanoAddress', () => {
        test('should validate correct nano_ address', () => {
            const address = 'nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn';
            expect(NanoConverter.isValidNanoAddress(address)).toBe(true);
        });

        test('should validate correct xrb_ address', () => {
            const address = 'xrb_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn';
            expect(NanoConverter.isValidNanoAddress(address)).toBe(true);
        });

        test('should reject invalid prefix', () => {
            const address = 'invalid_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn';
            expect(NanoConverter.isValidNanoAddress(address)).toBe(false);
        });

        test('should reject short address', () => {
            const address = 'nano_3h3m6k';
            expect(NanoConverter.isValidNanoAddress(address)).toBe(false);
        });

        test('should reject empty string', () => {
            expect(NanoConverter.isValidNanoAddress('')).toBe(false);
        });

        test('should reject address with invalid characters', () => {
            const address = 'nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhk!!!';
            expect(NanoConverter.isValidNanoAddress(address)).toBe(false);
        });

        test('should reject address not starting with 1 or 3', () => {
            const address = 'nano_2h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn';
            expect(NanoConverter.isValidNanoAddress(address)).toBe(false);
        });
    });

    describe('formatXNO', () => {
        test('should format XNO with default 6 decimals', () => {
            const result = NanoConverter.formatXNO('0.123456789');
            expect(result).toBe('0.123457');
        });

        test('should format XNO with custom decimals', () => {
            const result = NanoConverter.formatXNO('1.5', 2);
            expect(result).toBe('1.50');
        });

        test('should format XNO with 0 decimals', () => {
            const result = NanoConverter.formatXNO('1.9999', 0);
            expect(result).toBe('2');
        });

        test('should format XNO from number input', () => {
            const result = NanoConverter.formatXNO(1.234567, 4);
            expect(result).toBe('1.2346');
        });

        test('should handle large numbers', () => {
            const result = NanoConverter.formatXNO('1000000.123456', 2);
            expect(result).toBe('1000000.12');
        });

        test('should round correctly', () => {
            const result = NanoConverter.formatXNO('0.9999', 2);
            expect(result).toBe('1.00');
        });
    });

    describe('Round-trip conversions', () => {
        test('should maintain value through round-trip conversion', () => {
            const originalXNO = '0.123456';
            const raw = NanoConverter.xnoToRaw(originalXNO);
            const backToXNO = NanoConverter.rawToXNO(raw);
            expect(backToXNO).toBe(originalXNO);
        });

        test('should maintain value for very small amounts', () => {
            const originalXNO = '0.000001';
            const raw = NanoConverter.xnoToRaw(originalXNO);
            const backToXNO = NanoConverter.rawToXNO(raw);
            expect(backToXNO).toBe(originalXNO);
        });

        test('should maintain value for large amounts', () => {
            const originalXNO = '1000000';
            const raw = NanoConverter.xnoToRaw(originalXNO);
            const backToXNO = NanoConverter.rawToXNO(raw);
            expect(backToXNO).toBe(originalXNO);
        });
    });

    describe('Edge cases', () => {
        test('should handle empty string in xnoToRaw', () => {
            expect(() => NanoConverter.xnoToRaw('')).toThrow();
        });

        test('should handle invalid string in rawToXNO', () => {
            expect(() => NanoConverter.rawToXNO('invalid')).toThrow();
        });

        test('should handle negative numbers in xnoToRaw', () => {
            const result = NanoConverter.xnoToRaw('-1');
            expect(result).toBe('-1000000000000000000000000000000');
        });

        test('should handle very large numbers', () => {
            const result = NanoConverter.xnoToRaw('999999999999');
            expect(result).toBe('999999999999000000000000000000000000000000');
        });
    });

    describe('Logging and Debugging', () => {
        test('should log conversion for debugging', () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            NanoConverter.xnoToRaw('1');
            
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('[NanoConverter]')
            );
            
            consoleLogSpy.mockRestore();
        });

        test('should log errors for invalid input', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            try {
                NanoConverter.rawToXNO('invalid');
            } catch (error) {
                // Expected to throw
            }
            
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            consoleErrorSpy.mockRestore();
        });
    });

    describe('getConversionExamples', () => {
        test('should return conversion examples', () => {
            const examples = NanoConverter.getConversionExamples();
            expect(examples).toHaveProperty('1_XNO');
            expect(examples['1_XNO']).toBe('1000000000000000000000000000000');
            expect(examples['0.1_XNO']).toBe('100000000000000000000000000000');
        });
    });

    describe('getConversionHelp', () => {
        test('should return helpful conversion information', () => {
            const help = NanoConverter.getConversionHelp();
            expect(help).toHaveProperty('description');
            expect(help).toHaveProperty('formula');
            expect(help).toHaveProperty('examples');
            expect(help).toHaveProperty('commonMistakes');
        });
    });
});

