# Circuits Package

Zero-knowledge proof circuits for MACI voting system using Circom & Snarkjs.

## Setup

### 1. Install dependencies

```bash
cd packages/circuits
npm install
```

### 2. Download Powers of Tau (PTau) file

You need a powers of tau file for setup. Download one or generate:

```bash
# Download existing PTau (recommended for testing)
# Using ptau file from snarkjs examples (usually pot_final.ptau ~400MB)
# Or generate your own:
# snarkjs powersoftau new bn128 12 pot_0000.ptau
# snarkjs powersoftau contribute pot_0000.ptau pot_final.ptau --name="contributor"
```

For **development/testing**, you can use:
```bash
# Download small PTau for testing
curl -o pot_final.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
```

### 3. Build circuit

```bash
npm run build
# Or individual steps:
npm run compile        # Compile .circom to R1CS
npm run setup          # Generate zkey
npm run verify-setup   # Verify setup
npm run export-vkey    # Export verification key for contract
```

This generates:
- `build/VoteProof.r1cs` - Constraint system
- `build/VoteProof_js/VoteProof.wasm` - WASM for witness generation
- `build/VoteProof_0000.zkey` - Zero-knowledge key
- `build/verification_key.json` - On-chain verification key

## Circuit: VoteProof

**Purpose**: Generate zero-knowledge proofs that a vote is valid without revealing private details.

**Private Inputs** (secret):
- `privateKey` - User's MACI private key
- `vote` - Which option user voted for
- `voiceCredits` - Credits used for this vote
- `nonce` - Vote sequence number
- `pollId` - Which poll voting on
- `pubkeyX`, `pubkeyY` - User's public key
- `voiceCreditBalance` - Current credit balance

**Public Inputs** (disclosed):
- `voterIndex` - Voter's position in state tree
- `voteCommitment` - Hash of vote details
- `outcome` - Winning option (proven to match vote)
- `stateLeaf` - User's state in merkle tree

**Constraints**:
1. State leaf is valid (hashes correctly)
2. Vote commitment is valid
3. User's vote matches winning option

## Usage in Backend

```typescript
import { loadCircuit } from '@sasvoth/circuits'
import * as snarkjs from 'snarkjs'

const circuit = loadCircuit()
const { proof, publicSignals } = await snarkjs.groth16.prove(
  circuit.zkey,
  witness
)
```

## Testing

```bash
npm test
```

## Files

- `VoteProof.circom` - Main circuit definition
- `scripts/build.sh` - Build automation
- `index.js` - Circuit loader utility
- `build/` - Generated artifacts (git-ignored)
