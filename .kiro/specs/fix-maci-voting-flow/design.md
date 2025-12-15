# Design Document: Fix MACI Voting Flow

## Overview

This design addresses the broken MACI voting flow in the SaSvoth web application. The current implementation fails to properly execute the signup → joinPoll → vote sequence required by MACI, resulting in votes not being counted in tally results.

The fix involves:

1. Updating the server action to properly call MACI SDK `joinPoll` with all required ZK proof parameters
2. Storing `pollStateIndex` (not `stateIndex`) for use during voting
3. Using serialized keypair format (`macisk.xxx`, `macipk.xxx`) for SDK compatibility
4. Updating the vote submission to use `publishBatch` from MACI SDK

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Web App (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│  PollClient.tsx                                                  │
│  ├── SignupModal                                                 │
│  │   ├── Generate Keypair (random or from seed)                 │
│  │   ├── Call signup on-chain via wallet                        │
│  │   └── Call joinPollAction (server action)                    │
│  │                                                               │
│  votes/[id]/page.tsx                                            │
│  ├── Load pollStateIndex, privKey from localStorage             │
│  └── Call submitVote with correct params                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Server Action (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  app/actions/maci.ts                                            │
│  ├── joinPollAction()                                           │
│  │   ├── Load zkey files from public/zkeys/                     │
│  │   ├── Call MACI SDK joinPoll()                               │
│  │   └── Return pollStateIndex, voiceCredits                    │
│  │                                                               │
│  └── signupAction() (optional - can be done client-side)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MACI Smart Contracts                          │
├─────────────────────────────────────────────────────────────────┤
│  MACI.sol                                                        │
│  ├── signUp(pubKey, sgData) → stateIndex                        │
│  │                                                               │
│  Poll.sol                                                        │
│  ├── joinPoll(proof, ...) → pollStateIndex                      │
│  └── publishMessage(message, encPubKey) → vote recorded         │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Server Action: joinPollAction

**File:** `apps/web/app/actions/maci.ts`

```typescript
interface JoinPollParams {
  pollId: string;
  maciAddress: string;
  privateKey: string; // Serialized format: macisk.xxx
  startBlock?: number;
}

interface JoinPollResult {
  success: boolean;
  pollStateIndex?: string;
  voiceCredits?: string;
  hash?: string;
  error?: string;
}

async function joinPollAction(params: JoinPollParams): Promise<JoinPollResult>;
```

### 2. Client Hook: useMaci

**File:** `apps/web/hooks/useMACI.ts`

Updates needed:

- `joinMaciPoll()` - Call server action and store pollStateIndex
- `submitVote()` - Use pollStateIndex and serialized key format

### 3. SignupModal Component

**File:** `apps/web/app/polls/[id]/PollClient.tsx`

Updates needed:

- Generate keypair using `new Keypair()` (random)
- Serialize keys before storing: `keypair.privateKey.serialize()`, `keypair.publicKey.serialize()`
- Store `pollStateIndex` from joinPoll result

### 4. LocalStorage Keys

| Key                   | Value Format    | Description                      |
| --------------------- | --------------- | -------------------------------- |
| `maci_privKey`        | `macisk.xxx...` | Serialized MACI private key      |
| `maci_pubKey`         | `macipk.xxx...` | Serialized MACI public key       |
| `maci_pollStateIndex` | `"1"`           | Poll state index for voting      |
| `maci_stateIndex`     | `"1"`           | Global state index (from signup) |
| `maciAddress`         | `0x...`         | MACI contract address            |
| `maciStartBlock`      | `"12345"`       | Block number for event scanning  |

## Data Models

### Keypair Storage

```typescript
// When generating keypair
const keypair = new Keypair(); // Random keypair
// OR from seed
const keypair = new Keypair(new PrivKey(BigInt(userSeed)));

// Serialize for storage
const serializedPrivKey = keypair.privateKey.serialize(); // "macisk.xxx..."
const serializedPubKey = keypair.publicKey.serialize(); // "macipk.xxx..."

// Deserialize for use
const privKey = PrivKey.deserialize(serializedPrivKey);
const pubKey = PubKey.deserialize(serializedPubKey);
```

### JoinPoll SDK Parameters

```typescript
const joinPollParams = {
  maciAddress: string,
  privateKey: string, // Serialized: macisk.xxx
  pollId: BigInt,
  pollJoiningZkey: string, // Path to .zkey file
  useWasm: true,
  pollJoiningWasm: string, // Path to .wasm file
  sgDataArg: "0x000...000", // 32 bytes zero
  ivcpDataArg: "0x000...000", // 32 bytes zero
  signer: ethers.Signer,
  startBlock: number, // For event scanning optimization
  blocksPerBatch: 10000,
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Serialized private key format

_For any_ MACI private key, when serialized using `privateKey.serialize()`, the result should start with the prefix "macisk."
**Validates: Requirements 1.4, 5.2**

### Property 2: Serialized public key format

_For any_ MACI public key, when serialized using `publicKey.serialize()`, the result should start with the prefix "macipk."
**Validates: Requirements 1.5, 5.3**

### Property 3: JoinPoll parameter completeness

_For any_ joinPoll call, the parameters object should contain all required fields: maciAddress, privateKey, pollId, pollJoiningZkey, pollJoiningWasm, sgDataArg, ivcpDataArg, signer, startBlock
**Validates: Requirements 1.2, 3.2**

### Property 4: JoinPoll result structure

_For any_ successful joinPoll call, the result should contain pollStateIndex as a non-negative integer and voiceCredits as a non-negative integer
**Validates: Requirements 3.3**

### Property 5: Vote uses pollStateIndex

_For any_ vote submission, the stateIndex parameter should equal the stored pollStateIndex value from localStorage
**Validates: Requirements 2.1**

### Property 6: Duplicate join prevention

_For any_ poll, if a user has already joined (pollStateIndex exists in localStorage for that poll), attempting to join again should be prevented
**Validates: Requirements 4.2**

## Error Handling

| Error Scenario                      | Handling                                                 |
| ----------------------------------- | -------------------------------------------------------- |
| Zkey files not found                | Return error with file path, suggest checking deployment |
| RPC connection failed               | Retry with fallback RPC URLs                             |
| Signup transaction rejected         | Show user-friendly message, allow retry                  |
| JoinPoll ZK proof generation failed | Log detailed error, show generic message                 |
| Vote submission failed              | Show error with tx details if available                  |
| Invalid key format                  | Validate format before use, show format requirements     |

## Testing Strategy

### Unit Tests

- Test keypair serialization/deserialization round-trip
- Test localStorage key management
- Test parameter validation for joinPoll

### Property-Based Tests

Using fast-check library:

1. **Property 1 & 2**: Generate random keypairs, verify serialization format
2. **Property 3**: Generate random joinPoll params, verify all required fields present
3. **Property 4**: Mock successful joinPoll, verify result structure
4. **Property 5**: Set up vote scenario, verify correct stateIndex used
5. **Property 6**: Simulate duplicate join attempts, verify prevention

### Integration Tests

- Full signup → joinPoll → vote flow on testnet
- Verify votes appear in tally results after tallying
