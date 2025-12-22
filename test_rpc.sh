#!/bin/bash

echo "🧪 Testing RPC Endpoints..."
echo ""

# Test 1: Arbitrum Sepolia Official
echo "1️⃣ Testing Official RPC: https://sepolia-rollup.arbitrum.io/rpc"
curl -s -X POST https://sepolia-rollup.arbitrum.io/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq '.result' || echo "❌ Failed"

echo ""

# Test 2: Alchemy 
echo "2️⃣ Testing Alchemy RPC"
curl -s -X POST https://arb-sepolia.g.alchemy.com/v2/demo \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq '.result' || echo "❌ Failed"

echo ""

# Test 3: Contract read
echo "3️⃣ Testing Contract Read (rate)"
curl -s -X POST https://sepolia-rollup.arbitrum.io/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_call",
    "params":[{
      "to":"0x1FDc22E49e39054f38479fccC17D17813EF73B11",
      "data":"0x2c4e722e"
    },"latest"],
    "id":1
  }' | jq '.'

echo ""
echo "✅ Done!"
