#!/bin/bash

set -e

echo "🔧 Building Circom circuit..."

# Create build directory
mkdir -p build

# 1. Compile circuit
echo "📝 Compiling VoteProof.circom..."
circom VoteProof.circom --r1cs --wasm -o build/

# 2. Setup zkey
echo "🔐 Setting up zkey with Powers of Tau..."
snarkjs groth16 setup build/VoteProof.r1cs pot_final.ptau build/VoteProof_0000.zkey

# 3. Verify setup
echo "✅ Verifying zkey setup..."
snarkjs zkey verify build/VoteProof.r1cs pot_final.ptau build/VoteProof_0000.zkey

# 4. Export verification key
echo "📤 Exporting verification key..."
snarkjs zkey export verificationkey build/VoteProof_0000.zkey build/verification_key.json

echo "✨ Circuit build complete!"
echo "Generated files:"
echo "  - build/VoteProof.r1cs"
echo "  - build/VoteProof_js/VoteProof.wasm"
echo "  - build/VoteProof_0000.zkey"
echo "  - build/verification_key.json"
