# Maci Wrapper

## API Call

Base Endpoint: `/api`

### Documentation

- **Core Changes**: [Refactor Changelog](./docs/MACI_REFACTOR_CHANGELOG.md)
- **Sign Up**: [MACI Signup V2](./docs/MACI_SIGNUP_V2.md)
- **Join Poll**: [Join Poll V2](./docs/MACI_JOINPOLL_V2.md)

## Core

- **Sign Up MACI**: Handled via `useMaciSignup` hook using EIP-712 for domain-separated authentication. See [docs](./docs/MACI_SIGNUP_V2.md).
- **Sign Up Poll**: Handled via `useMaciJoinPoll` hook. See [docs](./docs/MACI_JOINPOLL_V2.md).
- **Tally**: Handles the tabulation of votes. _Updates in progress_.
- **Submit Proof**: Logic for submitting ZK proofs to the contract. _Updates in progress_.

## Frontend

- **Framework**: **Next.js 16** (App Router).
- **Key Technologies**:
  - **SSR/PPR**: Utilizing Next.js 16's Partial Prerendering (PPR) and Server-Side Rendering (SSR) for optimal performance and SEO.
  - **UX**:
    - **Optimistic Updates**: Immediate UI feedback while transactions process in the background.
    - **Locking Mechanism**: `useWithMaciLock` prevents race conditions (e.g., double clicking signup).
    - **Real-time Feedback**: Polling mechanisms for transaction status.

## Backend

- **Framework**: **NestJS**.
- **Philosophy**:
  - **Robustness**: Error handling and graceful degradation (RPC fallbacks).
  - **Scalability**: Stateless architecture compatible with serverless or containerized deployment.
  - **Security**: Distributed locking (Redlock) to prevent replay attacks or race conditions.

## Storage

### Decentralization

We utilize **IPFS** to decentralized storage of voting logic, specifically ensuring that poll metadata and tally results are immutable and verifiable.

### Database (MongoDB)

We use MongoDB for flexible, high-performance data storage.
**Full Schema Overview:**

```typescript
// Users (Authentication & Identity)
interface Users {
  email?: string;
  name: string;
  role: "admin" | "user";
  authType: "google" | "github" | "email" | "wallet" | "all";
  walletAddress?: string; // Unique, Sparse
  publicKey?: string; // MACI Public Key (deprecating)
  maciSignups: [
    {
      // Track multi-MACI signups
      maciAddress: string;
      stateIndex: number;
      publicKey: string;
      signedUpAt: Date;
    },
  ];
  balance: number; // Token balance
}

// MaciDeployment (Connects App to Blockchain)
interface MaciDeployment {
  maciAddress: string; // Contract Address (Unique)
  name: string; // e.g., "CSES"
  subgraphUrl?: string; // The Graph URL for this deployment
  startBlock?: number;
  chain: string; // e.g., "optimism-sepolia"
  members: number; // Synced participant count
  pollCount: number; // Synced poll count
  isValid: boolean;
}

// Ideas (Polls/Proposals)
interface Ideas {
  title: string;
  description: string;
  userAddress: string; // Creator
  idea_cid?: string; // IPFS CID for verifying content
  createdAt: Date;
  ageLimit: number;
}

// JoinPoll (Participation Tracking)
interface JoinPoll {
  voterAdrress: string;
  pollId: string;
  pollIdOnchain: string;
  voteCommitment: string;
  timestamp: Date;
}

// Votes (Off-chain Vote Backup)
interface Votes {
  pollId: string;
  selectedOption: number;
  voiceCredits: number;
}
```

### IPFS Storage

- **Poll Metadata**: Stores title, description, and images.
- **Tally Results**: Final vote counts and proofs are stored here after processing.
- **Data Lifecycle**:
  - **Creation**: Data pushed to IPFS on Poll Creation / Tally Completion.
  - **Verification**: Frontend fetches IPFS CID to verify data integrity against on-chain hash.

## Processing & Optimization

### Async Sync (UX Improvement)

To provide a snappy user experience while ensuring data consistency, we use a **Smart Nonce** algorithm found in `SmartNonceService`:

- **Problem**: Blockchain is slow (Cold Storage), but users need to vote fast.
- **Solution**: We maintain two states:
  - **Hot State (Redis/Memory)**: Tracks immediate pending nonces.
  - **Cold State (The Graph)**: confirmed on-chain nonce.
- **Algorithm**: `NextNonce = max(ConfirmedNonce, PendingNonce) + 1`
  - This allows users to vote multiple times in rapid succession without waiting for block confirmations, as the system optimistically issues the next nonce.

### Spam Prevention (Redlock)

We use **Redlock** (Distributed Redis Locking) to handle concurrency:

- **Use Case**: Preventing double-signup or double-voting race conditions.
- **Mechanism**:
  - `lock:signup:{maciAddress}:{pubKeyHash}`: Ensures a user only signs up once per MACI instance.
  - `lock:vote:{pollId}:{stateIndex}`: Ensures vote transactions are serialized correctly.

### Scanned Processes

- **Deployment Stats Sync**: Periodically syncs `numSignUps` and `nextPollId` from the contract to the `MaciDeployment` DB collection.
- **Smart Nonce Sync**: Background jobs reconcile the "Hot" Redis state with the "Cold" Graph state to clean up stale locks.
