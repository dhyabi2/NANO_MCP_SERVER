# Simple MCP Test
$headers = @{ "Content-Type" = "application/json" }

# Test initialization
$body = @{
    jsonrpc = "2.0"
    method = "initialize"
    params = @{}
    id = 1
} | ConvertTo-Json

Write-Host "Testing MCP initialization..."
$response = Invoke-WebRequest -Uri "http://localhost:8080/" -Method Post -Headers $headers -Body $body
Write-Host "Response: $($response.Content)"

# Test account info
$body = @{
    jsonrpc = "2.0"
    method = "getAccountInfo"
    params = @{
        address = "nano_3ri1mmjo7p7yonn9ynf836y6tkr4bsp6c7ozgzkrzceo6m1qpq83rppcttkj"
    }
    id = 2
} | ConvertTo-Json

Write-Host "`nTesting account info..."
$response = Invoke-WebRequest -Uri "http://localhost:8080/" -Method Post -Headers $headers -Body $body
Write-Host "Response: $($response.Content)"
