# Full Flow Test for MCP Server
# This test verifies that the original MCP functionality is not affected by the new pending receive endpoint

Write-Host "`nStarting Full Flow Test for MCP Server...`n" -ForegroundColor Cyan

# Test wallet credentials
$testWallet = @{
    account = "nano_3ri1mmjo7p7yonn9ynf836y6tkr4bsp6c7ozgzkrzceo6m1qpq83rppcttkj"
    privateKey = "3ff30bb04a99a405408a8b6a9d9f5e48f2c10bb223e53545e14dab9783a996c5"
    publicKey = "e2009ce352d8bead287f51a6093c4d4b024e6c4516bf77e58fa99524c17b5cc1"
}

# Helper function for making HTTP requests
function Invoke-MCPRequest {
    param (
        [string]$Method,
        [string]$Endpoint,
        [object]$Body
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }

    $uri = "http://localhost:8080$Endpoint"
    
    try {
        $bodyJson = $Body | ConvertTo-Json -Depth 10
        $response = Invoke-WebRequest -Uri $uri -Method $Method -Headers $headers -Body $bodyJson -UseBasicParsing
        $content = $response.Content | ConvertFrom-Json
        return @{
            StatusCode = $response.StatusCode
            Content = $content
        }
    }
    catch {
        return @{
            StatusCode = $_.Exception.Response.StatusCode.value__
            Error = $_.Exception.Message
        }
    }
}

# Helper function to format test result
function Get-TestResult {
    param (
        [int]$StatusCode
    )
    if ($StatusCode -eq 200) {
        return "Passed"
    }
    return "Failed"
}

# 1. Test MCP initialization
Write-Host "1. Testing MCP initialization..." -ForegroundColor Green
$initResult = Invoke-MCPRequest -Method "POST" -Endpoint "/" -Body @{
    jsonrpc = "2.0"
    method = "initialize"
    params = @{}
    id = 1
}

if ($initResult.StatusCode -eq 200) {
    Write-Host "✓ MCP initialization successful" -ForegroundColor Green
    Write-Host "Version: $($initResult.Content.result.version)"
}
else {
    Write-Host "✗ MCP initialization failed: $($initResult.Error)" -ForegroundColor Red
    exit 1
}

# 2. Test account info
Write-Host "`n2. Testing account info..." -ForegroundColor Green
$accountResult = Invoke-MCPRequest -Method "POST" -Endpoint "/" -Body @{
    jsonrpc = "2.0"
    method = "getAccountInfo"
    params = @{
        address = $testWallet.account
    }
    id = 2
}

Write-Host "Account Info Response: $($accountResult.Content | ConvertTo-Json)"

# 3. Test balance
Write-Host "`n3. Testing balance check..." -ForegroundColor Green
$balanceResult = Invoke-MCPRequest -Method "POST" -Endpoint "/" -Body @{
    jsonrpc = "2.0"
    method = "getBalance"
    params = @{
        address = $testWallet.account
    }
    id = 3
}

Write-Host "Balance Response: $($balanceResult.Content | ConvertTo-Json)"

# 4. Test pending blocks
Write-Host "`n4. Testing pending blocks check..." -ForegroundColor Green
$pendingResult = Invoke-MCPRequest -Method "POST" -Endpoint "/" -Body @{
    jsonrpc = "2.0"
    method = "getPendingBlocks"
    params = @{
        address = $testWallet.account
    }
    id = 4
}

Write-Host "Pending Blocks Response: $($pendingResult.Content | ConvertTo-Json)"

# 5. Test new pending receive endpoint
Write-Host "`n5. Testing new pending receive endpoint..." -ForegroundColor Green
$newPendingResult = Invoke-MCPRequest -Method "POST" -Endpoint "/pending/receive" -Body @{
    account = $testWallet.account
    privateKey = $testWallet.privateKey
}

Write-Host "New Pending Receive Response: $($newPendingResult.Content | ConvertTo-Json)"

# Final Status Check
Write-Host "`nFinal Status Check:" -ForegroundColor Cyan
$finalBalance = Invoke-MCPRequest -Method "POST" -Endpoint "/" -Body @{
    jsonrpc = "2.0"
    method = "getBalance"
    params = @{
        address = $testWallet.account
    }
    id = 5
}

Write-Host "Final Balance: $($finalBalance.Content | ConvertTo-Json)"

# Summary
Write-Host "`nTest Summary:" -ForegroundColor Yellow
Write-Host "- MCP Initialization: $(Get-TestResult $initResult.StatusCode)"
Write-Host "- Account Info: $(Get-TestResult $accountResult.StatusCode)"
Write-Host "- Balance Check: $(Get-TestResult $balanceResult.StatusCode)"
Write-Host "- Pending Blocks: $(Get-TestResult $pendingResult.StatusCode)"
Write-Host "- New Pending Receive: $(Get-TestResult $newPendingResult.StatusCode)"

$allPassed = ($initResult.StatusCode -eq 200) -and ($accountResult.StatusCode -eq 200) -and ($balanceResult.StatusCode -eq 200) -and ($pendingResult.StatusCode -eq 200) -and ($newPendingResult.StatusCode -eq 200)

if ($allPassed) {
    Write-Host "`nAll tests passed successfully!" -ForegroundColor Green
}
else {
    Write-Host "`nSome tests failed!" -ForegroundColor Red
    exit 1
}