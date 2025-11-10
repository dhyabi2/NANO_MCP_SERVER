# QR Code Generation Feature

## Overview

The NANO MCP Server now includes a **QR Code Generation** feature that creates scannable QR codes for NANO payments. This feature generates a base64-encoded PNG image that can be directly embedded in web applications or displayed to users.

## Usage

### JSON-RPC Request

```json
{
    "jsonrpc": "2.0",
    "method": "generateQrCode",
    "params": {
        "address": "nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf",
        "amount": "0.1"
    },
    "id": 1
}
```

### Parameters

| Parameter | Type   | Required | Description                                           |
|-----------|--------|----------|-------------------------------------------------------|
| address   | string | Yes      | NANO address to receive payment (must start with "nano_") |
| amount    | string | Yes      | Amount in decimal NANO (e.g., "0.1" for 0.1 NANO)    |

### Response

**Success Response:**

```json
{
    "jsonrpc": "2.0",
    "result": {
        "success": true,
        "qrCode": "data:image/png;base64,iVBORw0KGgo...",
        "paymentString": "nano:nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf?amount=0.1",
        "address": "nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf",
        "amount": "0.1",
        "format": "base64 Data URL (PNG)"
    },
    "id": 1
}
```

**Error Response (Missing Address):**

```json
{
    "jsonrpc": "2.0",
    "error": {
        "code": -32602,
        "message": "Invalid parameters: Missing required field(s): address",
        "data": {
            "correctFormat": {
                "jsonrpc": "2.0",
                "method": "generateQrCode",
                "params": {
                    "address": "nano_3xxxxx...",
                    "amount": "0.1"
                },
                "id": 1
            },
            "hint": "Please use the correct format shown in 'correctFormat'. Ensure all required parameters are included.",
            "yourRequest": {
                "method": "generateQrCode",
                "params": {
                    "amount": "0.1"
                }
            }
        }
    },
    "id": 1
}
```

**Error Response (Invalid Address):**

```json
{
    "jsonrpc": "2.0",
    "error": {
        "code": -32603,
        "message": "Failed to generate QR code: Invalid Nano address format. Address must start with \"nano_\""
    },
    "id": 1
}
```

## QR Code Format

The generated QR code follows the NANO URI scheme:

```
nano:<address>?amount=<decimal_amount>
```

**Example:**
```
nano:nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf?amount=0.1
```

This format is compatible with most NANO wallets, including:
- Natrium
- Nault
- Nano Wallet Company wallet
- And other wallets supporting the NANO URI scheme

## QR Code Specifications

- **Format:** PNG image
- **Encoding:** Base64 Data URL
- **Size:** 400x400 pixels
- **Error Correction:** Level L (Low - 7% of codewords can be restored)
- **Margin:** 4 modules
- **Colors:** Black on White

## Using the QR Code in HTML

You can directly embed the generated QR code in an HTML image tag:

```html
<img src="data:image/png;base64,iVBORw0KGgo..." alt="NANO Payment QR Code" />
```

## Example Use Cases

### 1. Payment Invoice System

Generate a unique QR code for each payment invoice:

```javascript
const response = await fetch('http://localhost:8080', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        jsonrpc: "2.0",
        method: "generateQrCode",
        params: {
            address: "nano_...",
            amount: "5.0"
        },
        id: 1
    })
});

const data = await response.json();
console.log('QR Code:', data.result.qrCode);
```

### 2. Donation Widget

Create a donation QR code with a suggested amount:

```javascript
function generateDonationQR(donationAddress, suggestedAmount) {
    return makeRequest('generateQrCode', {
        address: donationAddress,
        amount: suggestedAmount
    });
}
```

### 3. Point of Sale System

Generate QR codes for in-person payments:

```javascript
async function createPOSPayment(merchantAddress, priceInNano) {
    const qrData = await generateQrCode(merchantAddress, priceInNano);
    displayQRCodeToCustomer(qrData.result.qrCode);
    
    // Monitor for payment confirmation
    await waitForPayment(merchantAddress, priceInNano);
}
```

## Validation

The `generateQrCode` method performs the following validations:

1. **Address Validation:**
   - Checks if address is provided
   - Validates that address starts with "nano_"
   - Returns error if invalid

2. **Amount Validation:**
   - Checks if amount is a valid number
   - Ensures amount is positive (greater than 0)
   - Returns error if invalid

## Error Handling

All errors follow the JSON-RPC 2.0 error specification:

- **-32602:** Invalid params (missing or wrong type)
- **-32603:** Internal error (validation failed, QR generation failed)

Each error includes:
- `code`: Standard JSON-RPC error code
- `message`: Human-readable error description
- `data`: (Optional) Additional information including correct format templates

## Testing

The feature has been tested with:
- ✅ Valid address and amount
- ✅ Missing required parameters
- ✅ Invalid address format
- ✅ Negative amount validation
- ✅ Various amount values

All tests passed successfully.

## Technical Implementation

The QR code generation uses the `qrcode` npm package:
- **Library:** [qrcode](https://www.npmjs.com/package/qrcode)
- **Method:** `QRCode.toDataURL()`
- **Output:** Data URL with base64-encoded PNG

## Dependencies

Added dependency:
```json
{
  "qrcode": "^1.5.3"
}
```

## Version History

- **v1.4.0** - Added `generateQrCode` method
  - Generate QR codes for NANO payments
  - Base64 PNG image output
  - Full validation and error handling
  - Comprehensive error templates

## Security Considerations

1. **No Private Key Required:** QR code generation only needs the public address
2. **Client-Side Verification:** Users should always verify the address and amount before sending
3. **Amount Display:** Always display the amount clearly to the payer

## Best Practices

1. **Always display the payment details** (address and amount) alongside the QR code
2. **Include a timeout** for payment requests (e.g., 15-30 minutes)
3. **Verify payments** using the `receiveAllPending` method after displaying the QR code
4. **Provide alternative payment methods** (copy address button, manual entry)
5. **Show payment status** in real-time after scanning

## Support

For issues or questions about the QR code generation feature:
- GitHub: https://github.com/dhyabi2/NANO_MCP_SERVER/issues
- Documentation: https://github.com/dhyabi2/NANO_MCP_SERVER#readme

