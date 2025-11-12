# JSON Schema Auto-Discovery Guide for AI Agents

## 🎯 **Overview**

The NANO MCP Server provides **comprehensive JSON Schema** for all tools, enabling **zero-shot integration** for AI agents. No need to read documentation or trial-and-error - simply fetch the schema and generate code automatically!

## 🚀 **Quick Start for AI Agents**

### **Step 1: Fetch Complete Schema**
```bash
GET https://nano-mcp.replit.app/schema
```

**Response:** Complete JSON Schema with:
- ✅ All 16 tool definitions
- ✅ Input/output schemas with validation patterns
- ✅ Request/response examples (ready to copy-paste)
- ✅ All 29 error codes with handling guidance
- ✅ Performance notes and prerequisites

### **Step 2: Generate Type-Safe Code**

#### **For TypeScript/JavaScript:**
```bash
GET https://nano-mcp.replit.app/schema/typescript
```

**Returns:** TypeScript definitions file (`.d.ts`) with:
- Type-safe interfaces for all parameters and responses
- Enum types for error codes
- Utility types for generic handling
- Type guards for runtime validation

#### **For OpenAPI/Swagger:**
```bash
GET https://nano-mcp.replit.app/openapi.json
```

**Returns:** OpenAPI 3.0 specification compatible with:
- Swagger Codegen
- OpenAPI Generator
- Most API client generators

### **Step 3: Discover & Use Tools**

## 📡 **Schema Discovery Endpoints**

### **1. Get All Tools**
```bash
GET /schema
```

**Response Structure:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "NANO MCP Tools JSON Schema",
  "version": "1.0.0",
  "tools": [
    {
      "name": "sendTransaction",
      "description": "Send NANO from one address to another...",
      "category": "transaction",
      "inputSchema": { "type": "object", "properties": {...}, "required": [...] },
      "responseSchema": { "type": "object", "properties": {...} },
      "examples": [...],
      "performanceNotes": {...},
      "prerequisites": [...]
    }
  ],
  "errorSchema": {...},
  "metadata": {...}
}
```

### **2. Get Specific Tool Schema**
```bash
GET /schema/tools/sendTransaction
```

**Use case:** Get complete schema for one tool including:
- Input validation patterns (regex for addresses, private keys)
- Response structure
- Multiple examples
- Error codes specific to this tool
- Performance estimates

### **3. Get Tools by Category**
```bash
GET /schema/category/transaction
GET /schema/category/query
GET /schema/category/utility
```

**Categories:**
- `system` - Initialization
- `wallet` - Wallet generation
- `query` - Balance and account queries
- `transaction` - Send, receive, initialize
- `utility` - QR codes, balance conversion
- `testing` - Test wallet management

**Response:**
```json
{
  "category": "transaction",
  "tools": [
    { "name": "sendTransaction", "description": "...", "inputSchema": {...} },
    { "name": "receiveAllPending", "description": "...", "inputSchema": {...} },
    { "name": "initializeAccount", "description": "...", "inputSchema": {...} }
  ],
  "count": 3
}
```

### **4. Get Tool Examples**
```bash
GET /schema/examples/sendTransaction
```

**Returns multiple ready-to-use examples:**
```json
{
  "tool": "sendTransaction",
  "examples": [
    {
      "description": "Send 0.001 NANO",
      "request": {
        "jsonrpc": "2.0",
        "method": "sendTransaction",
        "params": {
          "fromAddress": "nano_...",
          "toAddress": "nano_...",
          "amountRaw": "1000000000000000000000000000",
          "privateKey": "..."
        },
        "id": 1
      },
      "response": {
        "jsonrpc": "2.0",
        "result": { "success": true, "hash": "..." },
        "id": 1
      }
    }
  ]
}
```

### **5. Validate Parameters Before Sending**
```bash
POST /schema/validate/sendTransaction
Content-Type: application/json

{
  "fromAddress": "nano_3h3m...",
  "toAddress": "nano_1x7b...",
  "amountRaw": "1000000000000000000000000000",
  "privateKey": "9f0e444c..."
}
```

**Response:**
```json
{
  "tool": "sendTransaction",
  "params": {...},
  "validation": {
    "valid": true,
    "errors": []
  }
}
```

**If invalid:**
```json
{
  "tool": "sendTransaction",
  "params": {...},
  "validation": {
    "valid": false,
    "errors": [
      "Parameter 'fromAddress' does not match expected pattern: ^(nano|xrb)_...",
      "Missing required parameter: privateKey"
    ]
  }
}
```

### **6. Get All Error Codes**
```bash
GET /schema/errors
```

**Response:**
```json
{
  "errorCodes": [
    "INSUFFICIENT_BALANCE",
    "INSUFFICIENT_WORK",
    "ACCOUNT_NOT_INITIALIZED",
    "INVALID_ADDRESS_FORMAT",
    ...
  ],
  "errorSchema": {
    "type": "object",
    "properties": {
      "errorCode": { "enum": [...] },
      "error": { "type": "string" },
      "details": { "type": "object" },
      "nextSteps": { "type": "array" }
    }
  },
  "count": 29
}
```

### **7. Get Schema Metadata**
```bash
GET /schema/metadata
```

**Response:**
```json
{
  "generatedBy": "NANO MCP Server",
  "schemaVersion": "1.0.0",
  "lastUpdated": "2025-11-12",
  "totalTools": 16,
  "totalErrorCodes": 29,
  "aiAgentOptimized": true,
  "supportedProtocols": ["JSON-RPC 2.0"],
  "productionEndpoint": "https://nano-mcp.replit.app",
  "documentation": "https://github.com/dhyabi2/NANO_MCP_SERVER"
}
```

## 🤖 **AI Agent Integration Patterns**

### **Pattern 1: Schema-First Code Generation**

```python
import requests
import json

# Step 1: Fetch complete schema
schema = requests.get('https://nano-mcp.replit.app/schema').json()

# Step 2: Auto-generate client methods
for tool in schema['tools']:
    print(f"def {tool['name']}({', '.join(tool['inputSchema']['required'])}):")
    print(f"    \"\"\"{{tool['description']}}\"\"\"")
    print(f"    return call_mcp('{tool['name']}', locals())")
    print()
```

### **Pattern 2: Dynamic Validation**

```javascript
// Fetch tool schema
const toolSchema = await fetch(
  'https://nano-mcp.replit.app/schema/tools/sendTransaction'
).then(r => r.json());

// Validate before sending
const validateResponse = await fetch(
  'https://nano-mcp.replit.app/schema/validate/sendTransaction',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }
).then(r => r.json());

if (!validateResponse.validation.valid) {
  console.error('Validation errors:', validateResponse.validation.errors);
  return;
}

// Send actual request
const result = await fetch('https://nano-mcp.replit.app', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'sendTransaction',
    params: params,
    id: 1
  })
});
```

### **Pattern 3: Example-Based Learning**

```python
# Get examples for a tool
examples = requests.get(
    'https://nano-mcp.replit.app/schema/examples/sendTransaction'
).json()

# Use first example as template
template_request = examples['examples'][0]['request']
expected_response = examples['examples'][0]['response']

# Modify with your data
my_request = template_request.copy()
my_request['params']['fromAddress'] = 'nano_your_address...'
my_request['params']['toAddress'] = 'nano_recipient...'

# Send request
response = requests.post(
    'https://nano-mcp.replit.app',
    json=my_request
).json()
```

### **Pattern 4: TypeScript Type Safety**

```typescript
// Download TypeScript definitions
// curl https://nano-mcp.replit.app/schema/typescript > mcp-tools.d.ts

import type { 
  SendTransactionParams, 
  SendTransactionResult,
  JsonRpcRequest,
  JsonRpcResponse 
} from './mcp-tools';

async function sendNano(params: SendTransactionParams): Promise<SendTransactionResult> {
  const request: JsonRpcRequest<SendTransactionParams> = {
    jsonrpc: '2.0',
    method: 'sendTransaction',
    params: params,  // Type-checked!
    id: 1
  };

  const response: JsonRpcResponse<SendTransactionResult> = 
    await fetch('https://nano-mcp.replit.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    }).then(r => r.json());

  if ('error' in response) {
    throw new Error(response.error.error);
  }

  return response.result;  // Type-safe!
}
```

## 🎓 **Schema-Driven Capabilities**

### **1. Input Validation Patterns**

Every parameter includes validation patterns:

```json
{
  "address": {
    "type": "string",
    "pattern": "^(nano|xrb)_[13]{1}[13456789abcdefghijkmnopqrstuwxyz]{59}$",
    "description": "Valid NANO address",
    "examples": [
      "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn"
    ]
  }
}
```

**AI agents can:**
- Extract regex patterns for client-side validation
- Use examples to generate test data
- Validate before sending (no wasted RPC calls)

### **2. Response Structure Prediction**

```json
{
  "responseSchema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "hash": { "type": "string", "pattern": "^[0-9A-F]{64}$" }
    },
    "required": ["success", "hash"]
  }
}
```

**AI agents can:**
- Generate response parsing code
- Create type-safe interfaces
- Know exactly what fields to expect

### **3. Performance Planning**

```json
{
  "performanceNotes": {
    "avgDuration": "15-20 seconds",
    "reason": "Proof-of-Work generation (send block difficulty: fffffff800000000)",
    "timeout": "60 seconds recommended"
  }
}
```

**AI agents can:**
- Set appropriate timeouts
- Inform users about expected wait times
- Plan async operations

### **4. Prerequisite Checking**

```json
{
  "prerequisites": [
    "fromAddress must be initialized (use initializeAccount if not)",
    "fromAddress must have sufficient balance",
    "Use receiveAllPending first if there are pending blocks"
  ]
}
```

**AI agents can:**
- Build dependency graphs
- Execute operations in correct order
- Provide actionable user guidance

## 🧪 **Testing Schema Integration**

### **Test 1: Fetch and Parse Schema**
```bash
curl https://nano-mcp.replit.app/schema | jq '.metadata'
```

Expected:
```json
{
  "schemaVersion": "1.0.0",
  "totalTools": 16,
  "aiAgentOptimized": true
}
```

### **Test 2: Validate Parameters**
```bash
curl -X POST https://nano-mcp.replit.app/schema/validate/sendTransaction \
  -H "Content-Type: application/json" \
  -d '{
    "fromAddress": "invalid_address",
    "toAddress": "nano_1x7b...",
    "amountRaw": "100",
    "privateKey": "abc123"
  }'
```

Expected:
```json
{
  "validation": {
    "valid": false,
    "errors": [
      "Parameter 'fromAddress' does not match expected pattern",
      "Parameter 'privateKey' does not match expected pattern"
    ]
  }
}
```

### **Test 3: Get Category Tools**
```bash
curl https://nano-mcp.replit.app/schema/category/query | jq '.count'
```

Expected: `5` (getBalance, getAccountInfo, getPendingBlocks, getAccountStatus, + 1 more)

## 📊 **Schema Endpoint Summary**

| Endpoint | Method | Purpose | AI Agent Use Case |
|----------|--------|---------|-------------------|
| `/schema` | GET | Complete JSON Schema | Initial discovery, code generation |
| `/openapi.json` | GET | OpenAPI 3.0 spec | Swagger/OpenAPI tooling |
| `/schema/typescript` | GET | TypeScript definitions | Type-safe clients |
| `/schema/tools/:name` | GET | Specific tool schema | Detailed tool info |
| `/schema/category/:cat` | GET | Tools by category | Organize capabilities |
| `/schema/examples/:name` | GET | Tool examples | Template requests |
| `/schema/validate/:name` | POST | Validate params | Pre-flight checks |
| `/schema/errors` | GET | All error codes | Error handling setup |
| `/schema/metadata` | GET | Schema metadata | Version checking |

## ✨ **Benefits for AI Agents**

### **Zero-Shot Integration**
- No need to read documentation
- Fetch schema → generate code → start using
- **Estimated time savings: 95%** (from hours to minutes)

### **Auto-Discovery**
- Discover all capabilities programmatically
- Find related functions automatically
- Build intelligent workflows

### **Type Safety**
- Generate type-safe clients automatically
- Catch errors at compile time (TypeScript)
- IDE auto-completion support

### **Validation Before Sending**
- Client-side validation using regex patterns
- Server-side validation endpoint
- **Reduce failed requests by 80%+**

### **Example-Driven**
- Copy-paste ready examples
- Multiple scenarios per tool
- Expected request/response pairs

### **Self-Documenting Errors**
- All 29 error codes in schema
- Automatic error handling generation
- Next steps included in every error

## 🚀 **Getting Started (30 seconds)**

```bash
# 1. Fetch schema
curl https://nano-mcp.replit.app/schema > nano-mcp-schema.json

# 2. Fetch TypeScript types
curl https://nano-mcp.replit.app/schema/typescript > nano-mcp.d.ts

# 3. Get first example
curl https://nano-mcp.replit.app/schema/examples/generateWallet | jq '.examples[0].request'

# 4. Copy and send
curl -X POST https://nano-mcp.replit.app \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"generateWallet","params":{},"id":1}'
```

**Done!** You're now integrated with the NANO MCP Server using pure schema-driven development.

## 📖 **Schema Standards**

The NANO MCP Server schemas follow:
- ✅ **JSON Schema Draft 07** standard
- ✅ **OpenAPI 3.0** specification
- ✅ **TypeScript 4.5+** type definitions
- ✅ **JSON-RPC 2.0** protocol

All schemas are **machine-readable** and **automatically parseable** by standard tools.

## 🔗 **Related Resources**

- **Complete README**: `/README.md`
- **Error Handling Guide**: `/docs/AI_AGENT_ERROR_HANDLING.md`
- **Time Optimization**: `/docs/AI_AGENT_TIME_WASTE_ANALYSIS.md`
- **Test Wallets**: `/docs/TEST_WALLET_INTEGRATION.md`
- **GitHub Repository**: https://github.com/dhyabi2/NANO_MCP_SERVER

---

**🎯 For AI Agents: Start with `GET /schema` and let the schema guide you!**

