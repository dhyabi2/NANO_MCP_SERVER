# TypeScript Client Test Guide

## 🧪 Running the Tests

The test suite comprehensively validates all client functionality against the production server.

### Quick Start

```bash
# Option 1: Direct execution (if you have ts-node)
npx ts-node test-client.ts

# Option 2: Install dependencies first
npm install
npm test

# Option 3: Compile to JavaScript first
npm run compile:test
node test-client.js
```

---

## 📋 What Gets Tested

### ✅ **12 Comprehensive Tests**

| # | Test Name | What It Tests |
|---|-----------|---------------|
| 1 | **Client Initialization** | Client instantiation |
| 2 | **Generate Wallet** | Wallet generation with validation |
| 3 | **Get Balance** | Balance retrieval with format validation |
| 4 | **Get Account Status** | Comprehensive status with actions |
| 5 | **Client Validation** | Client-side parameter validation |
| 6 | **Convert Balance** | Server-side unit conversion (nano ↔ raw) |
| 7 | **Helper Functions** | Client-side conversion helpers |
| 8 | **Schema Discovery** | JSON Schema retrieval and parsing |
| 9 | **Parameter Validation** | Server-side validation endpoint |
| 10 | **Generate QR Code** | QR code generation |
| 11 | **Error Handling** | Error detection and formatting |
| 12 | **Type Safety** | TypeScript compile-time checks |

---

## 📊 Expected Output

### Success Output:
```
================================================================================

🧪 NANO MCP CLIENT - COMPREHENSIVE TEST SUITE
================================================================================

Testing against: https://nano-mcp.replit.app
Started at: 2025-11-12T12:00:00.000Z
================================================================================

================================================================================

🧪 Test 1: Client Initialization
================================================================================
✅ PASS: Client instantiated successfully
   Server URL: https://nano-mcp.replit.app

================================================================================

🧪 Test 2: Generate Wallet
================================================================================
✅ PASS: Wallet generated successfully
   Address: nano_3h3m6kfckrxpc...
   Private Key: 9f0e444c69...
   Public Key: c008b814ca...
   Seed: a1b2c3d4e5...

... (10 more tests) ...

================================================================================

📊 TEST SUMMARY
================================================================================

Total Tests: 12
✅ Passed: 12
❌ Failed: 0
Success Rate: 100.0%

================================================================================
🎉 ALL TESTS PASSED! Client is working perfectly!
================================================================================

Completed at: 2025-11-12T12:00:15.000Z
================================================================================
```

---

## 🔍 Test Details

### Test 1: Client Initialization
**Purpose:** Verify client can be instantiated  
**Success Criteria:**
- Client object created
- Server URL configured correctly

### Test 2: Generate Wallet
**Purpose:** Test wallet generation  
**Success Criteria:**
- Address is valid NANO address (60+ chars, starts with nano_)
- Private key is 64 hex characters
- Public key is 64 hex characters
- Seed is 64 hex characters

### Test 3: Get Balance
**Purpose:** Test balance retrieval  
**Success Criteria:**
- Returns balance in raw and NANO
- Returns pending in raw and NANO
- All values are strings (numeric strings)

### Test 4: Get Account Status
**Purpose:** Test comprehensive status check  
**Success Criteria:**
- Returns initialized boolean
- Returns canSend boolean
- Returns needsAction array
- Returns balance information
- Returns pending count

### Test 5: Client Validation
**Purpose:** Test client-side validation catches errors  
**Success Criteria:**
- Invalid address is rejected before network call
- Error message is descriptive

### Test 6: Convert Balance
**Purpose:** Test server-side conversion  
**Success Criteria:**
- 0.1 NANO converts to correct raw amount
- Reverse conversion works
- Response includes original, converted, from, to

### Test 7: Helper Functions
**Purpose:** Test client-side helpers  
**Success Criteria:**
- nanoToRaw('0.1') returns correct value
- rawToNano(raw) returns correct value
- XNO constants are defined correctly

### Test 8: Schema Discovery
**Purpose:** Test JSON Schema integration  
**Success Criteria:**
- Complete schema retrieved with tools array
- Tool-specific schema retrieved
- Examples retrieved for tools

### Test 9: Parameter Validation
**Purpose:** Test server-side validation endpoint  
**Success Criteria:**
- Valid parameters accepted (valid: true, errors: [])
- Invalid parameters rejected (valid: false, errors: [...])
- Error messages are descriptive

### Test 10: Generate QR Code
**Purpose:** Test QR code generation  
**Success Criteria:**
- QR code returned as base64 string
- NANO URI returned (starts with "nano:")

### Test 11: Error Handling
**Purpose:** Test error detection and formatting  
**Success Criteria:**
- Invalid method throws error
- Error includes errorCode or "not found"
- Error is formatted properly

### Test 12: Type Safety
**Purpose:** Verify TypeScript types work  
**Success Criteria:**
- Code compiles without type errors
- All response types match interfaces

---

## 🚨 Troubleshooting

### Test Fails: "Unable to connect"
**Problem:** Can't reach production server  
**Solution:**
```bash
# Check if server is online
curl https://nano-mcp.replit.app/tools/list

# If server is down, test against local:
# 1. Start local server: npm start
# 2. Update TEST_SERVER in test-client.ts to 'http://localhost:8080'
```

### Test Fails: "Invalid response"
**Problem:** Server not updated with latest code  
**Solution:**
```bash
# On Replit server:
git pull origin main
# Restart server
```

### Test Fails: "Module not found"
**Problem:** Dependencies not installed  
**Solution:**
```bash
npm install
# Or install specific dependencies:
npm install @types/node typescript ts-node node-fetch
```

### Compilation Errors
**Problem:** TypeScript compilation fails  
**Solution:**
```bash
# Install TypeScript globally
npm install -g typescript

# Or use npx
npx tsc --version

# Compile with specific target
npm run compile
```

---

## 🎯 Running Specific Tests

To run only specific tests, modify the `runAllTests()` function:

```typescript
// In test-client.ts, comment out tests you don't want:

async function runAllTests() {
  // ...
  
  // Uncomment only the tests you want to run:
  client = await test1_ClientInitialization();
  wallet = await test2_GenerateWallet(client);
  // await test3_GetBalance(client, wallet.address);
  // await test4_GetAccountStatus(client, wallet.address);
  // ... etc
}
```

---

## 📝 Adding Custom Tests

Example: Add a new test

```typescript
async function test13_MyCustomTest(client: NanoMcpClient) {
  testHeader('Test 13: My Custom Test');
  
  try {
    // Your test code here
    const result = await client.someMethod();
    
    if (/* validation */) {
      testPass('Custom test passed');
      testInfo('Additional info');
    } else {
      throw new Error('Custom validation failed');
    }
    
  } catch (error: any) {
    testFail('Custom test failed', error);
  }
}

// Add to runAllTests():
await test13_MyCustomTest(client);
```

---

## 🔄 Continuous Integration

### Run tests in CI/CD:

```yaml
# .github/workflows/test.yml
name: Test Client
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd client-examples/typescript && npm install
      - run: cd client-examples/typescript && npm test
```

---

## 📊 Performance Benchmarks

Expected test duration:
- **Full test suite:** ~10-15 seconds
- **Without network calls:** ~1 second
- **With transaction tests:** ~60+ seconds (if included)

Individual test times:
- Generate Wallet: < 1s
- Get Balance: < 1s
- Get Status: < 1s
- Convert Balance: < 1s
- Schema Discovery: < 2s
- Parameter Validation: < 1s
- QR Code: < 1s

---

## ✅ Success Criteria

**All tests PASS means:**
- ✅ Client is properly configured
- ✅ All methods work correctly
- ✅ Type safety is verified
- ✅ Validation works (client & server)
- ✅ Error handling is robust
- ✅ Helper functions are accurate
- ✅ Schema integration is functional
- ✅ **Production ready!**

---

## 🚀 Next Steps After Tests Pass

1. ✅ **Copy client to your project**
   ```bash
   cp nano-mcp-client.ts your-project/src/
   ```

2. ✅ **Start using in production**
   ```typescript
   import { NanoMcpClient } from './nano-mcp-client';
   const client = new NanoMcpClient('https://nano-mcp.replit.app');
   ```

3. ✅ **Run your own tests**
   - Use this test suite as a template
   - Add domain-specific tests

---

## 📖 Additional Resources

- **Client Documentation**: `README.md`
- **Usage Examples**: `example-usage.ts`
- **API Reference**: `README.md#complete-api-reference`
- **Error Handling**: `../../docs/AI_AGENT_ERROR_HANDLING.md`

---

**🎉 Happy testing! Your TypeScript client is production-ready!**

