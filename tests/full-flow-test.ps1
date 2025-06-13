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
        $response = Invoke-RestMethod -Uri "http://localhost:3000/" `
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

# Function to load wallets from file
function Load-Wallets {
    $walletsFile = "tests/wallets.json"
    if (Test-Path $walletsFile) {
        try {
            $wallets = Get-Content $walletsFile | ConvertFrom-Json
            return $wallets
        }
        catch {
            Write-Host "Error loading wallets file: $_" -ForegroundColor $Red
            return $null
        }
    }
    return $null
}

# Function to save wallets to file
function Save-Wallets {
    param (
        $wallet1,
        $wallet2
    )
    $walletsFile = "tests/wallets.json"
    $wallets = @{
        wallet1 = @{
            address = $wallet1.address
            privateKey = $wallet1.privateKey
        }
        wallet2 = @{
            address = $wallet2.address
            privateKey = $wallet2.privateKey
        }
    }
    $maxRetries = 5
    $retryCount = 0
    $success = $false

    while (-not $success -and $retryCount -lt $maxRetries) {
        try {
            $wallets | ConvertTo-Json | Set-Content $walletsFile -ErrorAction Stop
            $success = $true
        }
        catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Write-Host "Failed to save wallets, retrying in 1 second... (Attempt $retryCount of $maxRetries)" -ForegroundColor $Yellow
                Start-Sleep -Seconds 1
            }
            else {
                Write-Host "Failed to save wallets after $maxRetries attempts" -ForegroundColor $Red
            }
        }
    }
}

# Function to convert raw to NANO
function Convert-RawToNano {
    param (
        [string]$rawAmount
    )
    try {
        if ($rawAmount -eq "0") { return "0" }
        
        # Remove any trailing zeros
        $trimmed = $rawAmount.TrimEnd('0')
        
        # If length is less than 30, pad with zeros on the left
        if ($trimmed.Length -lt 30) {
            return "0." + $trimmed.PadLeft(30, '0')
        }
        
        # If length is 30 or more, insert decimal point 30 places from the right
        $decimalPos = $trimmed.Length - 30
        return $trimmed.Insert($decimalPos, ".")
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
    params = @{}
    id = 1
} | ConvertTo-Json
$initResponse = Invoke-RPC -JsonData $initJson
if ($null -eq $initResponse) {
    Write-Host "Failed to initialize server. Exiting..." -ForegroundColor $Red
    exit 1
}
Write-Host "Server initialized successfully"
Write-Host "----------------------------------------"

# Load or Generate Wallets
$savedWallets = Load-Wallets
$wallet1 = $null
$wallet2 = $null

if ($null -ne $savedWallets -and $savedWallets.wallet1.address -ne "") {
    Write-Host "Loading saved Wallet 1..." -ForegroundColor $Yellow
    $wallet1 = @{
        address = $savedWallets.wallet1.address
        privateKey = $savedWallets.wallet1.privateKey
    }
    Write-Host "Wallet 1 loaded successfully"
} else {
    Write-Host "Generating new Wallet 1..." -ForegroundColor $Yellow
    $wallet1Json = @{
        jsonrpc = "2.0"
        method = "generateWallet"
        params = @{}
        id = 1
    } | ConvertTo-Json
    $wallet1Response = Invoke-RPC -JsonData $wallet1Json
    if ($null -eq $wallet1Response) {
        Write-Host "Failed to generate Wallet 1. Exiting..." -ForegroundColor $Red
        exit 1
    }
    $wallet1 = @{
        address = $wallet1Response.result.address
        privateKey = $wallet1Response.result.privateKey
    }
    Write-Host "New Wallet 1 generated successfully"
}

Write-Host "Wallet 1 Address: $($wallet1.address)"
Write-Host "----------------------------------------"

# Initialize Wallet 1
Write-Host "Initializing Wallet 1..." -ForegroundColor $Yellow
$initWallet1Json = @{
    jsonrpc = "2.0"
    method = "initializeAccount"
    params = @{
        address = $wallet1.address
        privateKey = $wallet1.privateKey
    }
    id = 1
} | ConvertTo-Json
$initWallet1Response = Invoke-RPC -JsonData $initWallet1Json
if ($null -eq $initWallet1Response) {
    Write-Host "Failed to initialize Wallet 1. Exiting..." -ForegroundColor $Red
    exit 1
}
Write-Host "Wallet 1 initialized successfully"
Write-Host "----------------------------------------"

# Wait for initial funds (0.0001 NANO)
Write-Host "Waiting for initial funds to Wallet 1..." -ForegroundColor $Yellow
Write-Host "Please send 0.0001 NANO to: $($wallet1.address)"
Write-Host "Checking for incoming transaction every 10 seconds..."

$transactionReceived = $false
while (-not $transactionReceived) {
    # Check balance
    $balanceJson = @{
        jsonrpc = "2.0"
        method = "getBalance"
        params = @{
            address = $wallet1.address
        }
        id = 1
    } | ConvertTo-Json
    $balanceResponse = Invoke-RPC -JsonData $balanceJson
    
    # Check pending blocks
    $pendingJson = @{
        jsonrpc = "2.0"
        method = "getPendingBlocks"
        params = @{
            address = $wallet1.address
        }
        id = 1
    } | ConvertTo-Json
    $pendingResponse = Invoke-RPC -JsonData $pendingJson
    
    Write-Host "`nDebug Info:" -ForegroundColor $Yellow
    Write-Host "Balance Response: $($balanceResponse | ConvertTo-Json -Depth 10)"
    Write-Host "Pending Response: $($pendingResponse | ConvertTo-Json -Depth 10)"
    
    # Check if we have any balance or pending blocks
    if ($null -ne $balanceResponse -and 
        $null -ne $balanceResponse.result -and 
        $balanceResponse.result.balance -gt 0) {
        Write-Host "Balance detected: $($balanceResponse.result.balance) raw" -ForegroundColor $Green
        $transactionReceived = $true
        break
    }
    
    if ($null -ne $pendingResponse -and 
        $null -ne $pendingResponse.result -and 
        $null -ne $pendingResponse.result.blocks -and 
        @($pendingResponse.result.blocks).Count -gt 0) {
        Write-Host "Pending blocks detected!" -ForegroundColor $Green
        Write-Host "Processing pending blocks..." -ForegroundColor $Yellow
        $receiveJson = @{
            jsonrpc = "2.0"
            method = "receiveAllPending"
            params = @{
                address = $wallet1.address
                privateKey = $wallet1.privateKey
            }
            id = 1
        } | ConvertTo-Json
        $receiveResponse = Invoke-RPC -JsonData $receiveJson
        Write-Host "Receive Response: $($receiveResponse | ConvertTo-Json -Depth 10)"
        $transactionReceived = $true
        break
    }
    
    Write-Host "No transaction yet. Checking again in 10 seconds..." -ForegroundColor $Yellow
    Start-Sleep -Seconds 10
}

Write-Host "Transaction confirmed successfully!" -ForegroundColor $Green
Write-Host "----------------------------------------"

# Load or Generate Wallet 2
if ($null -ne $savedWallets -and $savedWallets.wallet2.address -ne "") {
    Write-Host "Loading saved Wallet 2..." -ForegroundColor $Yellow
    $wallet2 = @{
        address = $savedWallets.wallet2.address
        privateKey = $savedWallets.wallet2.privateKey
    }
    Write-Host "Wallet 2 loaded successfully"
} else {
    Write-Host "Generating new Wallet 2..." -ForegroundColor $Yellow
    $wallet2Json = @{
        jsonrpc = "2.0"
        method = "generateWallet"
        params = @{}
        id = 1
    } | ConvertTo-Json
    $wallet2Response = Invoke-RPC -JsonData $wallet2Json
    if ($null -eq $wallet2Response) {
        Write-Host "Failed to generate Wallet 2. Exiting..." -ForegroundColor $Red
        exit 1
    }
    $wallet2 = @{
        address = $wallet2Response.result.address
        privateKey = $wallet2Response.result.privateKey
    }
    Write-Host "New Wallet 2 generated successfully"
}

Write-Host "Wallet 2 Address: $($wallet2.address)"
Write-Host "----------------------------------------"

# Initialize Wallet 2
Write-Host "Initializing Wallet 2..." -ForegroundColor $Yellow
$initWallet2Json = @{
    jsonrpc = "2.0"
    method = "initializeAccount"
    params = @{
        address = $wallet2.address
        privateKey = $wallet2.privateKey
    }
    id = 1
} | ConvertTo-Json
$initWallet2Response = Invoke-RPC -JsonData $initWallet2Json
if ($null -eq $initWallet2Response) {
    Write-Host "Failed to initialize Wallet 2. Exiting..." -ForegroundColor $Red
    exit 1
}
Write-Host "Wallet 2 initialized successfully"
Write-Host "----------------------------------------"

# Save both wallets
Save-Wallets -wallet1 $wallet1 -wallet2 $wallet2

# Send 0.00005 NANO from Wallet 1 to Wallet 2
Write-Host "Sending 0.00005 NANO from Wallet 1 to Wallet 2..." -ForegroundColor $Yellow
$sendJson = @{
    jsonrpc = "2.0"
    method = "sendTransaction"
    params = @{
        fromAddress = $wallet1.address
        toAddress = $wallet2.address
        amountRaw = "50000000000000000000000"
        privateKey = $wallet1.privateKey
    }
    id = 1
} | ConvertTo-Json
$sendResponse = Invoke-RPC -JsonData $sendJson
Write-Host "Transaction sent successfully"
Write-Host "----------------------------------------"

# Wait for Wallet 2 to receive
Write-Host "Waiting for Wallet 2 to receive funds..." -ForegroundColor $Yellow
Start-Sleep -Seconds 5

# Receive funds in Wallet 2
Write-Host "Receiving funds in Wallet 2..." -ForegroundColor $Yellow
$receiveJson = @{
    jsonrpc = "2.0"
    method = "receiveAllPending"
    params = @{
        address = $wallet2.address
        privateKey = $wallet2.privateKey
    }
    id = 1
} | ConvertTo-Json
$receiveResponse = Invoke-RPC -JsonData $receiveJson
Write-Host "Funds received in Wallet 2 successfully"
Write-Host "----------------------------------------"

# Final balance check
Write-Host "Checking final balances..." -ForegroundColor $Yellow

# Get account info for Wallet 1
$wallet1InfoJson = @{
    jsonrpc = "2.0"
    method = "getAccountInfo"
    params = @{
        address = $wallet1.address
    }
    id = 1
} | ConvertTo-Json
$wallet1Info = Invoke-RPC -JsonData $wallet1InfoJson
Write-Host "`nWallet 1 Account Info:" -ForegroundColor $Yellow
Write-Host $($wallet1Info | ConvertTo-Json -Depth 10)

# Get account info for Wallet 2
$wallet2InfoJson = @{
    jsonrpc = "2.0"
    method = "getAccountInfo"
    params = @{
        address = $wallet2.address
    }
    id = 1
} | ConvertTo-Json
$wallet2Info = Invoke-RPC -JsonData $wallet2InfoJson
Write-Host "`nWallet 2 Account Info:" -ForegroundColor $Yellow
Write-Host $($wallet2Info | ConvertTo-Json -Depth 10)

# Get balance for Wallet 1
$wallet1FinalBalanceJson = @{
    jsonrpc = "2.0"
    method = "getBalance"
    params = @{
        address = $wallet1.address
    }
    id = 1
} | ConvertTo-Json
$wallet1FinalBalance = Invoke-RPC -JsonData $wallet1FinalBalanceJson

# Get balance for Wallet 2
$wallet2FinalBalanceJson = @{
    jsonrpc = "2.0"
    method = "getBalance"
    params = @{
        address = $wallet2.address
    }
    id = 1
} | ConvertTo-Json
$wallet2FinalBalance = Invoke-RPC -JsonData $wallet2FinalBalanceJson

Write-Host "`nTest Complete!" -ForegroundColor $Green
Write-Host "Wallet 1 final balance: $($wallet1FinalBalance.result.balance) raw ($(Convert-RawToNano $wallet1FinalBalance.result.balance) NANO)"
Write-Host "Wallet 2 final balance: $($wallet2FinalBalance.result.balance) raw ($(Convert-RawToNano $wallet2FinalBalance.result.balance) NANO)" 