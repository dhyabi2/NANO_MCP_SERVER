# Test Pending Receive Endpoint
$headers = @{ "Content-Type" = "application/json" }

# Test the new pending receive endpoint
$body = @{
    account = "nano_3ri1mmjo7p7yonn9ynf836y6tkr4bsp6c7ozgzkrzceo6m1qpq83rppcttkj"
    privateKey = "xxx"
} | ConvertTo-Json

Write-Host "Testing pending receive endpoint..."
$response = Invoke-WebRequest -Uri "http://localhost:8080/pending/receive" -Method Post -Headers $headers -Body $body
Write-Host "Response: $($response.Content)"

# Verify balance after receiving
$body = @{
    jsonrpc = "2.0"
    method = "getBalance"
    params = @{
        address = "nano_3ri1mmjo7p7yonn9ynf836y6tkr4bsp6c7ozgzkrzceo6m1qpq83rppcttkj"
    }
    id = 1
} | ConvertTo-Json

Write-Host "`nVerifying balance..."
$response = Invoke-WebRequest -Uri "http://localhost:8080/" -Method Post -Headers $headers -Body $body
Write-Host "Response: $($response.Content)"
