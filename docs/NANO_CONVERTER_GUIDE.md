# Nano (XNO) Conversion Utilities Guide

> **For Developers Unfamiliar with Nano**: This guide explains Nano's unique number format and provides utilities to handle conversions correctly.

---

## 📌 The Problem: Why Nano Conversions Are Different

Most cryptocurrencies use relatively simple decimal places:
- **Bitcoin**: 8 decimal places (satoshis)
- **Ethereum**: 18 decimal places (wei)
- **Nano (XNO)**: **30 decimal places (raw units)** ⚠️

This creates unique challenges:
1. **Precision Errors**: JavaScript's `Number` type can't handle 30 decimal places accurately
2. **Client Confusion**: Most developers expect 6-8 decimal places like other cryptocurrencies
3. **Floating-Point Math**: Using normal math operations causes rounding errors
4. **Raw vs XNO**: The blockchain uses "raw" units, but humans use "XNO" amounts

---

## ✅ The Solution: NanoConverter Utilities

The `NanoConverter` class provides safe, precise conversion functions using **string-based BigInt arithmetic** to avoid floating-point errors.

### Available via MCP Tool

The easiest way to access this information is via the `nanoConverterHelp` MCP method:

```bash
POST https://nano-mcp.replit.app
{
    "jsonrpc": "2.0",
    "method": "nanoConverterHelp",
    "params": {},
    "id": 1
}
```

---

## 🎯 Core Conversion Functions

### 1. `xnoToRaw(xno)` - Convert XNO to Raw Units

**Use this before ALL transactions!**

```javascript
// Convert decimal XNO amount to raw units
xnoToRaw(1)        // => "1000000000000000000000000000000"
xnoToRaw(0.000001) // => "1000000000000000000000000"
xnoToRaw("0.1")    // => "100000000000000000000000000000"
```

**Why use strings?**
- Strings preserve exact decimal places
- Numbers may lose precision due to floating-point representation

**When to use:**
- ✅ Before calling `sendTransaction` (amountRaw parameter)
- ✅ When storing amounts in databases
- ✅ When performing arithmetic on amounts

**When NOT to use:**
- ❌ For display purposes (use `formatXNO` instead)
- ❌ Already have raw units

---

### 2. `rawToXNO(raw)` - Convert Raw Units to XNO

**Use this for display purposes only!**

```javascript
// Convert blockchain raw units to human-readable XNO
rawToXNO("1000000000000000000000000000000") // => "1"
rawToXNO("1000000000000000000000000")       // => "0.000001"
rawToXNO("100000000000000000000000000000")  // => "0.1"
```

**When to use:**
- ✅ Displaying balances to users
- ✅ Showing transaction amounts in UI
- ✅ Generating human-readable reports

**When NOT to use:**
- ❌ For calculations (always use raw units for math)
- ❌ Before transactions (use xnoToRaw to get raw first)

---

### 3. `isValidNanoAddress(address)` - Validate Addresses

**Always validate before transactions!**

```javascript
// Validate Nano address format
isValidNanoAddress("nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn") 
// => true

isValidNanoAddress("xrb_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn")
// => true (xrb_ is legacy prefix, still valid)

isValidNanoAddress("invalid_address") 
// => false
```

**Validation Rules:**
- Must start with `nano_` or `xrb_` prefix
- Must be exactly 65 characters total
- Must start with `1` or `3` after prefix
- Uses Nano's custom base-32 character set

---

### 4. `formatXNO(xno, decimals)` - Format for Display

**Use for consistent display formatting!**

```javascript
// Format XNO amounts for UI display
formatXNO("0.123456789", 6) // => "0.123457" (default: 6 decimals)
formatXNO("1.5", 2)         // => "1.50"
formatXNO("0.9999", 2)      // => "1.00" (rounds up)
```

**Best Practices:**
- ✅ Use for UI display only
- ✅ Consistent decimal places across your app
- ❌ Never use for calculations (use raw units)

---

## 🚀 Complete Transaction Workflow

Here's a step-by-step example of sending 0.1 XNO:

```javascript
// Step 1: Get user input
const userInput = "0.1"; // User wants to send 0.1 XNO

// Step 2: Validate addresses
const fromAddress = "nano_3sender...";
const toAddress = "nano_3receiver...";

if (!NanoConverter.isValidNanoAddress(fromAddress)) {
    throw new Error("Invalid sender address");
}
if (!NanoConverter.isValidNanoAddress(toAddress)) {
    throw new Error("Invalid recipient address");
}

// Step 3: Convert XNO to raw
const amountRaw = NanoConverter.xnoToRaw(userInput);
// Result: "100000000000000000000000000000"

// Step 4: Send transaction using MCP
const result = await fetch('https://nano-mcp.replit.app', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        jsonrpc: "2.0",
        method: "sendTransaction",
        params: {
            fromAddress: fromAddress,
            toAddress: toAddress,
            amountRaw: amountRaw, // ← Use raw units here!
            privateKey: privateKey
        },
        id: 1
    })
});

// Step 5: Display confirmation to user
const confirmationMessage = `Sent ${NanoConverter.formatXNO(userInput, 6)} XNO`;
console.log(confirmationMessage); // "Sent 0.100000 XNO"
```

---

## ⚠️ Common Mistakes (And How to Avoid Them)

### Mistake 1: Using XNO Instead of Raw in Transactions

**❌ WRONG:**
```json
{
    "method": "sendTransaction",
    "params": {
        "amountRaw": "0.1"  // ← This is XNO, not raw!
    }
}
```

**✅ CORRECT:**
```javascript
const amountRaw = NanoConverter.xnoToRaw("0.1");
// => "100000000000000000000000000000"

{
    "method": "sendTransaction",
    "params": {
        "amountRaw": amountRaw  // ← Correct raw units
    }
}
```

---

### Mistake 2: Using Floating-Point Math

**❌ WRONG:**
```javascript
const xno = 0.1;
const raw = xno * 1000000000000000000000000000000; // Floating-point error!
// Result: 100000000000000004194304 (WRONG!)
```

**✅ CORRECT:**
```javascript
const raw = NanoConverter.xnoToRaw("0.1");
// Result: "100000000000000000000000000000" (CORRECT!)
```

---

### Mistake 3: Not Validating Addresses

**❌ WRONG:**
```javascript
// Send without validation
sendTransaction(userProvidedAddress, amount);
```

**✅ CORRECT:**
```javascript
if (!NanoConverter.isValidNanoAddress(userProvidedAddress)) {
    throw new Error("Invalid Nano address format");
}
sendTransaction(userProvidedAddress, amount);
```

---

### Mistake 4: Confusing NANO with XNO

**They are the SAME currency!**
- **NANO**: Original name (still commonly used)
- **XNO**: Official ticker symbol (like BTC for Bitcoin)
- Both refer to the same cryptocurrency

---

## 📊 Conversion Examples Reference

| XNO Amount | Raw Units | Use Case |
|------------|-----------|----------|
| 0.000001 | 1000000000000000000000000 | Micro-payment |
| 0.001 | 1000000000000000000000000000 | Small payment |
| 0.01 | 10000000000000000000000000000 | Typical fee (Nano has no fees, but for comparison) |
| 0.1 | 100000000000000000000000000000 | Test amount |
| 1 | 1000000000000000000000000000000 | Standard unit |
| 10 | 10000000000000000000000000000000 | Large payment |

---

## 🔍 Testing Your Integration

### Test 1: Round-Trip Conversion
```javascript
const original = "0.123456";
const raw = NanoConverter.xnoToRaw(original);
const backToXNO = NanoConverter.rawToXNO(raw);
console.assert(backToXNO === original, "Round-trip failed!");
```

### Test 2: Address Validation
```javascript
const validAddress = "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn";
const invalidAddress = "invalid_address";
console.assert(NanoConverter.isValidNanoAddress(validAddress) === true);
console.assert(NanoConverter.isValidNanoAddress(invalidAddress) === false);
```

### Test 3: Precision Check
```javascript
const smallAmount = "0.000000000000000000000000000001"; // Smallest unit
const raw = NanoConverter.xnoToRaw(smallAmount);
console.assert(raw === "1", "Precision lost!");
```

---

## 🛠️ Integration with MCP Server

The NanoConverter utilities are built into the MCP server. You have two options:

### Option 1: Use MCP Methods (Recommended)

```javascript
// Convert using MCP server
POST https://nano-mcp.replit.app
{
    "jsonrpc": "2.0",
    "method": "convertBalance",
    "params": {
        "amount": "0.1",
        "from": "nano",
        "to": "raw"
    },
    "id": 1
}
```

### Option 2: Implement Locally

Copy the `utils/nano-converter.js` file to your project and use it directly:

```javascript
const { NanoConverter } = require('./nano-converter');

const raw = NanoConverter.xnoToRaw("0.1");
```

---

## 📚 Additional Resources

- **API Documentation**: See `README.md` for full MCP API reference
- **Test Examples**: Check `tests/nano-converter.test.js` for 42 test cases
- **Live Help**: Call `nanoConverterHelp` MCP method for interactive guidance
- **Nano Documentation**: https://docs.nano.org/

---

## ✅ Checklist for Integration

Before going to production, ensure:

- [ ] All transaction amounts use `xnoToRaw()` before sending
- [ ] All display amounts use `rawToXNO()` and `formatXNO()`
- [ ] All addresses validated with `isValidNanoAddress()`
- [ ] No floating-point math used for currency calculations
- [ ] Round-trip conversion tests pass
- [ ] Users understand Nano uses 30 decimal places
- [ ] Error handling for invalid amounts/addresses

---

## 🆘 Getting Help

If you encounter issues:

1. **Call `nanoConverterHelp`** - Get instant reference documentation
2. **Check Common Mistakes** - See the section above
3. **Run Tests** - Execute `npm test tests/nano-converter.test.js`
4. **Read Error Messages** - The MCP server provides detailed error guidance

---

**Remember: Nano's 30 decimal places make it unique. Always use the provided utilities to ensure precision! 🎯**

