# Hardcoded configuration values
$CONFIG = @{
    # RPC Node configuration
    rpcUrl = "http://localhost:8080"
    rpcKey = "RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23"
    defaultRepresentative = "nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf"
    
    # Test transaction amounts (in RAW)
    initialFundsAmount = "100000000000000000000000000"  # 0.1 NANO
    transferAmount = "50000000000000000000000"         # 0.00005 NANO
    
    # Test wallet data (for reproducible tests)
    testWallet1 = @{
        address = "nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3"
        privateKey = "1111111111111111111111111111111111111111111111111111111111111111"
    }
    testWallet2 = @{
        address = "nano_1ipx847tk8o46pwxt5qjdbncjqcbwcc1rrmqnkztrfjy5k7z4imsrata9est"
        privateKey = "2222222222222222222222222222222222222222222222222222222222222222"
    }
}

# Colors for better visibility
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Red = [System.ConsoleColor]::Red

Write-Host "Starting NANO MCP Full Flow Test" -ForegroundColor $Green
Write-Host "----------------------------------------"

# Function to make JSON-RPC calls
function Invoke-RPC {
    param (
        [string]$JsonData
    )
    try {
        $response = Invoke-RestMethod -Uri $CONFIG.rpcUrl `
            -Method Post `
            -Headers @{"Content-Type"="application/json"} `
            -Body $JsonData
        return $response
    }
    catch {
        Write-Host "Error making RPC call:" -ForegroundColor $Red
        Write-Host "Request: $JsonData" -ForegroundColor $Red
        Write-Host "Error: $_" -ForegroundColor $Red
        return $null
    }
}

# Function to convert raw to NANO
function Convert-RawToNano {
    param (
        [string]$rawAmount
    )
    try {
        if ($rawAmount -eq "0") { return "0" }
        $rawBigInt = [System.Numerics.BigInteger]::Parse($rawAmount)
        $nanoDivisor = [System.Numerics.BigInteger]::Parse("1000000000000000000000000")
        $nanoAmount = $rawBigInt / $nanoDivisor
        return $nanoAmount.ToString()
    }
    catch {
        return "Error converting amount"
    }
}

# Initialize server
Write-Host "Initializing server..." -ForegroundColor $Yellow
$initJson = @{
    jsonrpc = "2.0"
    method = "initialize"
    params = @{
        rpcKey = $CONFIG.rpcKey
        defaultRepresentative = $CONFIG.defaultRepresentative
    }
    id = 1
} | ConvertTo-Json

$initResponse = Invoke-RPC -JsonData $initJson
if ($null -eq $initResponse) {
    Write-Host "Failed to initialize server. Exiting..." -ForegroundColor $Red
    exit 1
}
Write-Host "Server initialized successfully"
Write-Host "----------------------------------------"

# Initialize Wallet 1
Write-Host "Initializing Wallet 1..." -ForegroundColor $Yellow
$initWallet1Json = @{
    jsonrpc = "2.0"
    method = "initializeAccount"
    params = @{
        address = $CONFIG.testWallet1.address
        privateKey = $CONFIG.testWallet1.privateKey
    }
    id = 1
} | ConvertTo-Json

$initWallet1Response = Invoke-RPC -JsonData $initWallet1Json
Write-Host "Wallet 1 initialized successfully"
Write-Host "Wallet 1 Address: $($CONFIG.testWallet1.address)"
Write-Host "----------------------------------------"

# Wait for initial funds
Write-Host "Waiting for initial funds to Wallet 1..." -ForegroundColor $Yellow
Write-Host "Please send $($CONFIG.initialFundsAmount) RAW to: $($CONFIG.testWallet1.address)"
Write-Host "Checking for incoming transaction every 10 seconds..."

$transactionReceived = $false
$maxAttempts = 10
$attempts = 0

while (-not $transactionReceived -and $attempts -lt $maxAttempts) {
    $attempts++
    
    # Check balance
    $balanceJson = @{
        jsonrpc = "2.0"
        method = "getBalance"
        params = @{
            address = $CONFIG.testWallet1.address
        }
        id = 1
    } | ConvertTo-Json
    
    $balanceResponse = Invoke-RPC -JsonData $balanceJson
    Write-Host "`nDebug Info:" -ForegroundColor $Yellow
    Write-Host "Balance Response: $($balanceResponse | ConvertTo-Json)"
    
    if ($balanceResponse.result.balance -gt 0) {
        $transactionReceived = $true
        Write-Host "Initial funds received!" -ForegroundColor $Green
        break
    }
    
    if ($attempts -lt $maxAttempts) {
        Write-Host "No transaction yet. Checking again in 10 seconds..." -ForegroundColor $Yellow
        Start-Sleep -Seconds 10
    }
}

if (-not $transactionReceived) {
    Write-Host "Failed to receive initial funds after $maxAttempts attempts. Exiting..." -ForegroundColor $Red
    exit 1
}

Write-Host "----------------------------------------"

# Initialize Wallet 2
Write-Host "Initializing Wallet 2..." -ForegroundColor $Yellow
$initWallet2Json = @{
    jsonrpc = "2.0"
    method = "initializeAccount"
    params = @{
        address = $CONFIG.testWallet2.address
        privateKey = $CONFIG.testWallet2.privateKey
    }
    id = 1
} | ConvertTo-Json

$initWallet2Response = Invoke-RPC -JsonData $initWallet2Json
Write-Host "Wallet 2 initialized successfully"
Write-Host "Wallet 2 Address: $($CONFIG.testWallet2.address)"
Write-Host "----------------------------------------"

# Send test transaction
Write-Host "Sending test transaction..." -ForegroundColor $Yellow
$sendJson = @{
    jsonrpc = "2.0"
    method = "sendTransaction"
    params = @{
        fromAddress = $CONFIG.testWallet1.address
        toAddress = $CONFIG.testWallet2.address
        amountRaw = $CONFIG.transferAmount
        privateKey = $CONFIG.testWallet1.privateKey
    }
    id = 1
} | ConvertTo-Json

$sendResponse = Invoke-RPC -JsonData $sendJson
if ($null -eq $sendResponse) {
    Write-Host "Failed to send transaction. Exiting..." -ForegroundColor $Red
    exit 1
}
Write-Host "Transaction sent successfully"
Write-Host "----------------------------------------"

# Wait for Wallet 2 to receive
Write-Host "Waiting for Wallet 2 to receive funds..." -ForegroundColor $Yellow
Start-Sleep -Seconds 5

# Check final balances
Write-Host "Checking final balances..." -ForegroundColor $Yellow

# Get Wallet 1 final balance
$wallet1FinalBalanceJson = @{
    jsonrpc = "2.0"
    method = "getBalance"
    params = @{
        address = $CONFIG.testWallet1.address
    }
    id = 1
} | ConvertTo-Json

$wallet1FinalBalance = Invoke-RPC -JsonData $wallet1FinalBalanceJson
Write-Host "`nWallet 1 final balance: $($wallet1FinalBalance.result.balance) RAW ($(Convert-RawToNano $wallet1FinalBalance.result.balance) NANO)"

# Get Wallet 2 final balance
$wallet2FinalBalanceJson = @{
    jsonrpc = "2.0"
    method = "getBalance"
    params = @{
        address = $CONFIG.testWallet2.address
    }
    id = 1
} | ConvertTo-Json

$wallet2FinalBalance = Invoke-RPC -JsonData $wallet2FinalBalanceJson
Write-Host "Wallet 2 final balance: $($wallet2FinalBalance.result.balance) RAW ($(Convert-RawToNano $wallet2FinalBalance.result.balance) NANO)"

Write-Host "`nTest Complete!" -ForegroundColor $Green 
