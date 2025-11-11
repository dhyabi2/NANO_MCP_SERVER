/**
 * Balance Converter Utility
 * Converts between NANO and raw units with validation
 * Provides conversion helpers for autonomous agents
 */

"use strict";

const NANO_TO_RAW_MULTIPLIER = BigInt("1000000000000000000000000000000"); // 10^30

class BalanceConverter {
    /**
     * Convert NANO to raw units
     * @param {string|number} nanoAmount - Amount in NANO
     * @returns {string} Amount in raw units
     */
    static nanoToRaw(nanoAmount) {
        try {
            console.log(`[BalanceConverter] Converting ${nanoAmount} NANO to raw`);
            
            // Handle string with decimal
            const nanoStr = String(nanoAmount);
            const [whole, decimal = '0'] = nanoStr.split('.');
            
            // Pad decimal to 30 digits
            const paddedDecimal = decimal.padEnd(30, '0').slice(0, 30);
            
            // Combine and convert to BigInt
            const wholePart = BigInt(whole || '0') * NANO_TO_RAW_MULTIPLIER;
            const decimalPart = BigInt(paddedDecimal);
            const raw = wholePart + decimalPart;
            
            const result = raw.toString();
            console.log(`[BalanceConverter] Result: ${result} raw`);
            return result;
        } catch (error) {
            console.error('[BalanceConverter] Error converting NANO to raw:', error);
            throw new Error(`Invalid NANO amount: ${nanoAmount}. Must be a valid number.`);
        }
    }

    /**
     * Convert raw units to NANO
     * @param {string|BigInt} rawAmount - Amount in raw units
     * @returns {string} Amount in NANO (decimal string)
     */
    static rawToNano(rawAmount) {
        try {
            console.log(`[BalanceConverter] Converting ${rawAmount} raw to NANO`);
            
            const raw = BigInt(rawAmount);
            const nano = raw * BigInt(1000000) / NANO_TO_RAW_MULTIPLIER;
            const remainder = raw % NANO_TO_RAW_MULTIPLIER;
            
            // Format with up to 6 decimal places
            const wholeNano = Number(nano) / 1000000;
            const decimalPart = Number(remainder) / Number(NANO_TO_RAW_MULTIPLIER);
            const result = (wholeNano + decimalPart).toFixed(6).replace(/\.?0+$/, '');
            
            console.log(`[BalanceConverter] Result: ${result} NANO`);
            return result;
        } catch (error) {
            console.error('[BalanceConverter] Error converting raw to NANO:', error);
            throw new Error(`Invalid raw amount: ${rawAmount}. Must be a valid number string.`);
        }
    }

    /**
     * Get conversion examples for user guidance
     * @returns {Object} Conversion examples
     */
    static getConversionExamples() {
        return {
            "0.000001_NANO": "1000000000000000000000000",
            "0.00001_NANO": "10000000000000000000000000",
            "0.0001_NANO": "100000000000000000000000000",
            "0.001_NANO": "1000000000000000000000000000",
            "0.01_NANO": "10000000000000000000000000000",
            "0.1_NANO": "100000000000000000000000000000",
            "1_NANO": "1000000000000000000000000000000",
            "10_NANO": "10000000000000000000000000000000"
        };
    }

    /**
     * Validate if a value is valid raw amount
     * @param {string} rawAmount - Amount to validate
     * @returns {boolean} True if valid
     */
    static isValidRaw(rawAmount) {
        try {
            const raw = BigInt(rawAmount);
            return raw >= 0;
        } catch {
            return false;
        }
    }

    /**
     * Format balance for display
     * @param {string} rawAmount - Amount in raw
     * @returns {Object} Formatted balance
     */
    static formatBalance(rawAmount) {
        const nano = this.rawToNano(rawAmount);
        return {
            raw: rawAmount,
            nano: nano,
            display: `${nano} NANO`
        };
    }

    /**
     * Get human-readable conversion help
     * @returns {Object} Conversion help information
     */
    static getConversionHelp() {
        return {
            description: "NANO uses raw units for all on-chain operations. 1 NANO = 10^30 raw",
            formula: "raw = NANO × 10^30",
            reverseFormula: "NANO = raw ÷ 10^30",
            examples: this.getConversionExamples(),
            commonMistakes: [
                "Using NANO value instead of raw in amountRaw parameter",
                "Providing decimal numbers as raw units",
                "Not converting before API calls"
            ],
            tools: {
                nanoToRaw: "BalanceConverter.nanoToRaw('0.1') => '100000000000000000000000000'",
                rawToNano: "BalanceConverter.rawToNano('100000000000000000000000000') => '0.1'"
            }
        };
    }
}

module.exports = { BalanceConverter };

