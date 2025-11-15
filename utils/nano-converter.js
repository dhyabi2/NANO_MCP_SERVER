/**
 * Centralized Nano (XNO) Conversion Utilities
 * 
 * Uses string-based BigInt arithmetic for exact precision.
 * NO floating-point math to avoid rounding errors.
 * 
 * Nano uses 30 decimal places (10^30 raw units = 1 XNO)
 * 
 * This utility helps clients who don't know about Nano conversion,
 * numbers, and formats. It provides clear, precise conversions with
 * comprehensive logging and validation.
 */

"use strict";

const ONE_XNO_RAW = BigInt("1000000000000000000000000000000"); // 10^30

class NanoConverter {
    /**
     * Convert XNO amount to raw units
     * @param {number|string} xno - Amount in XNO (number or string)
     * @returns {string} Raw amount as string
     * 
     * @example
     * xnoToRaw(1)        // "1000000000000000000000000000000"
     * xnoToRaw(0.000001) // "1000000000000000000000000"
     * xnoToRaw("0.1")    // "100000000000000000000000000000"
     */
    static xnoToRaw(xno) {
        try {
            console.log(`[NanoConverter] Converting ${xno} XNO to raw`);
            
            // Convert to string - use toString() to avoid floating-point precision errors
            // DO NOT use toFixed() as it exposes floating-point representation errors
            let xnoStr;
            if (typeof xno === 'number') {
                // Convert to string using toString() which gives clean representation
                xnoStr = xno.toString();
                // Handle scientific notation (e.g., 1e-9 becomes 0.000000001)
                if (xnoStr.includes('e')) {
                    xnoStr = xno.toFixed(30).replace(/0+$/, '');
                }
            } else {
                xnoStr = xno;
            }
            
            // Validate input
            if (!xnoStr || xnoStr.trim() === '') {
                throw new Error('XNO amount cannot be empty');
            }
            
            // Split into whole and decimal parts
            const [whole, decimal = ''] = xnoStr.split('.');
            
            // Pad decimal to exactly 30 digits, truncate if longer
            const paddedDecimal = decimal.padEnd(30, '0').slice(0, 30);
            
            // Concatenate and convert to BigInt
            const rawStr = whole + paddedDecimal;
            
            const result = BigInt(rawStr).toString();
            console.log(`[NanoConverter] Result: ${result} raw`);
            return result;
        } catch (error) {
            console.error('[NanoConverter] Error converting XNO to raw:', error);
            throw new Error(`Invalid XNO amount: ${xno}. ${error.message}`);
        }
    }

    /**
     * Convert raw units to XNO amount
     * @param {string} raw - Raw amount as string
     * @returns {string} XNO amount as string
     * 
     * @example
     * rawToXNO("1000000000000000000000000000000") // "1"
     * rawToXNO("1000000000000000000000000")       // "0.000001"
     * rawToXNO("100000000000000000000000000000")  // "0.1"
     */
    static rawToXNO(raw) {
        try {
            console.log(`[NanoConverter] Converting ${raw} raw to XNO`);
            
            const rawBigInt = BigInt(raw);
            
            // Convert to string and pad to at least 30 digits
            const rawStr = rawBigInt.toString().padStart(30, '0');
            
            // Split into whole and decimal parts (last 30 digits are decimal)
            const whole = rawStr.slice(0, -30) || '0';
            const decimal = rawStr.slice(-30);
            
            // Remove trailing zeros from decimal
            const trimmedDecimal = decimal.replace(/0+$/, '');
            
            // Return formatted number
            let result;
            if (trimmedDecimal === '') {
                result = whole;
            } else {
                result = `${whole}.${trimmedDecimal}`;
            }
            
            console.log(`[NanoConverter] Result: ${result} XNO`);
            return result;
        } catch (error) {
            console.error('[NanoConverter] Error converting raw to XNO:', error);
            throw new Error(`Invalid raw amount: ${raw}. ${error.message}`);
        }
    }

    /**
     * Validate Nano address format
     * @param {string} address - Nano address to validate
     * @returns {boolean} true if valid format
     * 
     * @example
     * isValidNanoAddress("nano_3xxx...") // true
     * isValidNanoAddress("xrb_1xxx...")  // true
     * isValidNanoAddress("invalid")      // false
     */
    static isValidNanoAddress(address) {
        try {
            const isValid = /^(nano|xrb)_[13]{1}[13456789abcdefghijkmnopqrstuwxyz]{59}$/.test(address);
            console.log(`[NanoConverter] Address validation for ${address}: ${isValid}`);
            return isValid;
        } catch (error) {
            console.error('[NanoConverter] Error validating address:', error);
            return false;
        }
    }

    /**
     * Format XNO amount for display
     * @param {string|number} xno - XNO amount as string or number
     * @param {number} decimals - Number of decimal places to show (default: 6)
     * @returns {string} Formatted XNO string
     * 
     * @example
     * formatXNO("0.123456789", 6) // "0.123457"
     * formatXNO("1.5", 2)         // "1.50"
     */
    static formatXNO(xno, decimals = 6) {
        try {
            console.log(`[NanoConverter] Formatting ${xno} XNO to ${decimals} decimals`);
            const xnoNum = typeof xno === 'string' ? parseFloat(xno) : xno;
            const result = xnoNum.toFixed(decimals);
            console.log(`[NanoConverter] Formatted result: ${result}`);
            return result;
        } catch (error) {
            console.error('[NanoConverter] Error formatting XNO:', error);
            throw new Error(`Invalid XNO amount for formatting: ${xno}. ${error.message}`);
        }
    }

    /**
     * Get conversion examples for user guidance
     * @returns {Object} Conversion examples
     */
    static getConversionExamples() {
        return {
            "0.000001_XNO": "1000000000000000000000000",
            "0.00001_XNO": "10000000000000000000000000",
            "0.0001_XNO": "100000000000000000000000000",
            "0.001_XNO": "1000000000000000000000000000",
            "0.01_XNO": "10000000000000000000000000000",
            "0.1_XNO": "100000000000000000000000000000",
            "1_XNO": "1000000000000000000000000000000",
            "10_XNO": "10000000000000000000000000000000"
        };
    }

    /**
     * Get human-readable conversion help
     * @returns {Object} Conversion help information
     */
    static getConversionHelp() {
        return {
            description: "Nano (XNO) uses raw units for all on-chain operations. 1 XNO = 10^30 raw. This ensures exact precision without floating-point errors.",
            formula: "raw = XNO × 10^30",
            reverseFormula: "XNO = raw ÷ 10^30",
            decimalPlaces: 30,
            examples: this.getConversionExamples(),
            commonMistakes: [
                "Using XNO value instead of raw in amountRaw parameter",
                "Providing decimal numbers as raw units",
                "Not converting before API calls",
                "Using floating-point arithmetic which causes rounding errors",
                "Confusing NANO with XNO (they are the same currency)"
            ],
            tools: {
                xnoToRaw: "NanoConverter.xnoToRaw('0.1') => '100000000000000000000000000000'",
                rawToXNO: "NanoConverter.rawToXNO('100000000000000000000000000000') => '0.1'",
                isValidNanoAddress: "NanoConverter.isValidNanoAddress('nano_3xxx...') => true",
                formatXNO: "NanoConverter.formatXNO('0.123456789', 6) => '0.123457'"
            },
            bestPractices: [
                "Always use string-based BigInt arithmetic for conversions",
                "Never use floating-point math for currency calculations",
                "Validate addresses before transactions",
                "Use formatXNO for display purposes only, not for calculations",
                "Store amounts in raw format for precision"
            ]
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
        } catch (error) {
            console.error('[NanoConverter] Error validating raw amount:', error);
            return false;
        }
    }

    /**
     * Format balance for display with both raw and XNO
     * @param {string} rawAmount - Amount in raw
     * @returns {Object} Formatted balance
     */
    static formatBalance(rawAmount) {
        try {
            const xno = this.rawToXNO(rawAmount);
            return {
                raw: rawAmount,
                xno: xno,
                formatted: this.formatXNO(xno, 6),
                display: `${this.formatXNO(xno, 6)} XNO`
            };
        } catch (error) {
            console.error('[NanoConverter] Error formatting balance:', error);
            throw new Error(`Invalid raw amount for formatting: ${rawAmount}. ${error.message}`);
        }
    }
}

module.exports = { NanoConverter };

