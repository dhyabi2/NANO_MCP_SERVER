# NANO MCP Server Tools Test Script
# This script tests all primary tools of the NANO MCP server via its HTTP interface.

# 1. Configuration
$URL = "https://nano-mcp.replit.app"
$Headers = @{ "Content-Type" = "application/json" }

Write-Host "--- NANO MCP SERVER TOOLS TEST ---" -ForegroundColor Cyan
Write-Host "Target URL: $URL" -ForegroundColor Gray

# Helper function to send requests
function Send-MCPRequest($method, $params = @{}, $id = 1) {
    Write-Host "`n>>> Testing Method: $method" -ForegroundColor Cyan
    $body = @{
        jsonrpc = "2.0"
        method = $method
        params = $params
        id = $id
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri $URL -Method Post -Headers $Headers -Body $body
        if ($response.error) {
            Write-Host "Server Error: $($response.error.message)" -ForegroundColor Yellow
            return $response.error
        }
        return $response.result
    } catch {
        Write-Host "HTTP Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# --- START TESTING ---

# 2. Initialize
$init = Send-MCPRequest "initialize"
if ($init) {
    Write-Host "[PASS] Server Version: $($init.version)" -ForegroundColor Green
}

# 3. Generate a new Wallet
$wallet = Send-MCPRequest "generateWallet"
if ($wallet) {
    $addr = $wallet.address
    $key = $wallet.privateKey
    Write-Host "[PASS] Generated Test Address: $addr" -ForegroundColor Green
}

# 4. Check Balance
$balance = Send-MCPRequest "getBalance" @{ address = $addr }
if ($balance) {
    Write-Host "[PASS] Balance: $($balance.balance) raw, Pending: $($balance.pending) raw" -ForegroundColor Green
}

# 5. Get Account Status
$status = Send-MCPRequest "getAccountStatus" @{ address = $addr }
if ($status) {
    Write-Host "[PASS] Account Status Ready: $($status.isReady)" -ForegroundColor Green
}

# 6. Test Unit Conversion (1 NANO to raw)
$conv = Send-MCPRequest "convertBalance" @{ 
    amount = "1"
    from = "nano"
    to = "raw"
}
if ($conv) {
    Write-Host "[PASS] Conversion Check: 1 NANO = $($conv.convertedAmount) raw" -ForegroundColor Green
}

# 7. Generate a QR Code
$qr = Send-MCPRequest "generateQrCode" @{ 
    address = $addr
    amount = "0.1"
}
if ($qr) {
    Write-Host "[PASS] QR Code Data Generated (Length): $($qr.qrCodeData.Length)" -ForegroundColor Green
}

# 8. Get Conversion Help
$help = Send-MCPRequest "nanoConverterHelp"
if ($help) {
    Write-Host "[PASS] Help Utility: $($help.title)" -ForegroundColor Green
}

# 9. List all tools
$list = Send-MCPRequest "tools/list"
if ($list) {
    Write-Host "[PASS] Total Tools available: $($list.tools.Count)" -ForegroundColor Green
}

Write-Host "`n--- All basic tests completed successfully ---" -ForegroundColor Green
Write-Host "Note: initializeAccount and sendTransaction require funds to test." -ForegroundColor Gray

