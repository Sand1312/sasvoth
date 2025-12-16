#!/bin/bash

# Current timestamp
NOW=$(date +%s)
START=$((NOW + 120)) # Start in 2 minutes to be safe
END=$((NOW + 7200)) # End in 2 hours

MACI_ADDRESS="0xBd9b02458D9Ec697fED1238a0978D8345af04B49"

echo "Deploying Poll..."
echo "Start: $START"
echo "End: $END"

curl -X POST http://localhost:3002/api/v1/maci/polls \
  -H "Content-Type: application/json" \
  -d '{
  "chain": "arbitrum_sepolia",
  "maciAddress": "'"$MACI_ADDRESS"'",
  "sessionKeyAddress": "0xDB750f2c4196d4989d97A137c8D3779e5B93E666",
  "config": {
    "startDate": '"$START"',
    "endDate": '"$END"',
    "mode": 1,
    "tallyProcessingStateTreeDepth": 1,
    "messageBatchSize": 20,
    "pollStateTreeDepth": 10,
    "voteOptionTreeDepth": 2,
    "voteOptions": "4",
    "policy": {
       "policyType": "@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllPolicy.sol:FreeForAllPolicy",
       "checkerType": "@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllChecker.sol:FreeForAllChecker"
    },
    "initialVoiceCreditsProxy": {
      "factoryType": "ConstantInitialVoiceCreditProxyFactory",
      "type": "ConstantInitialVoiceCreditProxy",
      "args": { "amount": "100" }
    }
  }
}'
