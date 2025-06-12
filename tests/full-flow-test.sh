#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting NANO MCP Full Flow Test${NC}"
echo "----------------------------------------"

# Function to make JSON-RPC calls
call_rpc() {
    curl -s -X POST http://localhost:8080/ \
        -H "Content-Type: application/json" \
        -d "$1"
}

# Initialize server
echo -e "${YELLOW}Initializing server...${NC}"
INIT_RESPONSE=$(call_rpc '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
}')
echo "Server initialized: $INIT_RESPONSE"
echo "----------------------------------------"

# Generate Wallet 1
echo -e "${YELLOW}Generating Wallet 1...${NC}"
WALLET1_RESPONSE=$(call_rpc '{
    "jsonrpc": "2.0",
    "method": "generateWallet",
    "params": {},
    "id": 1
}')
WALLET1_ADDRESS=$(echo $WALLET1_RESPONSE | jq -r '.result.address')
WALLET1_PRIVATE_KEY=$(echo $WALLET1_RESPONSE | jq -r '.result.privateKey')
echo "Wallet 1 Address: $WALLET1_ADDRESS"
echo "----------------------------------------"

# Initialize Wallet 1
echo -e "${YELLOW}Initializing Wallet 1...${NC}"
INIT_WALLET1_RESPONSE=$(call_rpc "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"initializeAccount\",
    \"params\": {
        \"address\": \"$WALLET1_ADDRESS\",
        \"privateKey\": \"$WALLET1_PRIVATE_KEY\"
    },
    \"id\": 1
}")
echo "Wallet 1 initialized: $INIT_WALLET1_RESPONSE"
echo "----------------------------------------"

# Wait for initial funds (0.0001 NANO)
echo -e "${YELLOW}Waiting for initial funds to Wallet 1...${NC}"
echo "Please send 0.0001 NANO to: $WALLET1_ADDRESS"
echo "Checking balance every 10 seconds for 4 minutes..."

for i in {1..24}; do
    BALANCE_RESPONSE=$(call_rpc "{
        \"jsonrpc\": \"2.0\",
        \"method\": \"getBalance\",
        \"params\": {
            \"address\": \"$WALLET1_ADDRESS\"
        },
        \"id\": 1
    }")
    PENDING_RESPONSE=$(call_rpc "{
        \"jsonrpc\": \"2.0\",
        \"method\": \"getPendingBlocks\",
        \"params\": {
            \"address\": \"$WALLET1_ADDRESS\"
        },
        \"id\": 1
    }")
    
    echo "Check $i/24 - Balance: $BALANCE_RESPONSE"
    echo "Pending blocks: $PENDING_RESPONSE"
    
    # If pending blocks exist, receive them
    if [ "$(echo $PENDING_RESPONSE | jq '.result')" != "[]" ]; then
        echo -e "${GREEN}Pending blocks found! Receiving...${NC}"
        RECEIVE_RESPONSE=$(call_rpc "{
            \"jsonrpc\": \"2.0\",
            \"method\": \"receiveAllPending\",
            \"params\": {
                \"address\": \"$WALLET1_ADDRESS\",
                \"privateKey\": \"$WALLET1_PRIVATE_KEY\"
            },
            \"id\": 1
        }")
        echo "Receive response: $RECEIVE_RESPONSE"
        break
    fi
    
    sleep 10
done

# Generate Wallet 2
echo -e "${YELLOW}Generating Wallet 2...${NC}"
WALLET2_RESPONSE=$(call_rpc '{
    "jsonrpc": "2.0",
    "method": "generateWallet",
    "params": {},
    "id": 1
}')
WALLET2_ADDRESS=$(echo $WALLET2_RESPONSE | jq -r '.result.address')
WALLET2_PRIVATE_KEY=$(echo $WALLET2_RESPONSE | jq -r '.result.privateKey')
echo "Wallet 2 Address: $WALLET2_ADDRESS"
echo "----------------------------------------"

# Initialize Wallet 2
echo -e "${YELLOW}Initializing Wallet 2...${NC}"
INIT_WALLET2_RESPONSE=$(call_rpc "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"initializeAccount\",
    \"params\": {
        \"address\": \"$WALLET2_ADDRESS\",
        \"privateKey\": \"$WALLET2_PRIVATE_KEY\"
    },
    \"id\": 1
}")
echo "Wallet 2 initialized: $INIT_WALLET2_RESPONSE"
echo "----------------------------------------"

# Send 0.00005 NANO from Wallet 1 to Wallet 2
echo -e "${YELLOW}Sending 0.00005 NANO from Wallet 1 to Wallet 2...${NC}"
SEND_RESPONSE=$(call_rpc "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"sendTransaction\",
    \"params\": {
        \"fromAddress\": \"$WALLET1_ADDRESS\",
        \"toAddress\": \"$WALLET2_ADDRESS\",
        \"amountRaw\": \"50000000000000000000000\",
        \"privateKey\": \"$WALLET1_PRIVATE_KEY\"
    },
    \"id\": 1
}")
echo "Send response: $SEND_RESPONSE"
echo "----------------------------------------"

# Wait for Wallet 2 to receive
echo -e "${YELLOW}Waiting for Wallet 2 to receive funds...${NC}"
sleep 5

# Receive funds in Wallet 2
echo -e "${YELLOW}Receiving funds in Wallet 2...${NC}"
RECEIVE_WALLET2_RESPONSE=$(call_rpc "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"receiveAllPending\",
    \"params\": {
        \"address\": \"$WALLET2_ADDRESS\",
        \"privateKey\": \"$WALLET2_PRIVATE_KEY\"
    },
    \"id\": 1
}")
echo "Wallet 2 receive response: $RECEIVE_WALLET2_RESPONSE"
echo "----------------------------------------"

# Final balance check for both wallets
echo -e "${YELLOW}Final balance check...${NC}"
WALLET1_FINAL_BALANCE=$(call_rpc "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"getBalance\",
    \"params\": {
        \"address\": \"$WALLET1_ADDRESS\"
    },
    \"id\": 1
}")
WALLET2_FINAL_BALANCE=$(call_rpc "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"getBalance\",
    \"params\": {
        \"address\": \"$WALLET2_ADDRESS\"
    },
    \"id\": 1
}")

echo -e "${GREEN}Test Complete!${NC}"
echo "Wallet 1 final balance: $WALLET1_FINAL_BALANCE"
echo "Wallet 2 final balance: $WALLET2_FINAL_BALANCE" 