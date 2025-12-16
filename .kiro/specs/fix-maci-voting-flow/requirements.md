# Requirements Document

## Introduction

This document specifies the requirements for fixing the MACI (Minimal Anti-Collusion Infrastructure) voting flow in the SaSvoth web application. Currently, votes submitted through the web app are not being counted in tally results because the signup and joinPoll process is incomplete. The web app needs to properly integrate with the MACI SDK to perform the full signup → joinPoll → vote flow with ZK proofs.

## Glossary

- **MACI**: Minimal Anti-Collusion Infrastructure - a privacy-preserving voting protocol
- **stateIndex**: The index assigned to a user when they signup to MACI (global state tree)
- **pollStateIndex**: The index assigned to a user when they join a specific poll (poll state tree) - THIS is what's needed for voting
- **ZK Proof**: Zero-Knowledge Proof - cryptographic proof that validates user actions without revealing private data
- **Keypair**: A MACI keypair consisting of a private key and public key used for vote encryption
- **Coordinator**: The backend service that manages MACI operations
- **zkey**: Zero-knowledge proving key file required for generating ZK proofs

## Requirements

### Requirement 1

**User Story:** As a voter, I want to properly signup and join a poll so that my votes are counted in the final tally.

#### Acceptance Criteria

1. WHEN a user clicks "Join Poll" THEN the System SHALL call the MACI `signup` function on-chain with the user's generated public key
2. WHEN signup is successful THEN the System SHALL call the MACI SDK `joinPoll` function with required ZK proof parameters (zkey, wasm, sgData, ivcpData)
3. WHEN joinPoll is successful THEN the System SHALL store the returned `pollStateIndex` in localStorage with key `maci_pollStateIndex`
4. WHEN joinPoll is successful THEN the System SHALL store the serialized private key (format `macisk.xxx`) in localStorage with key `maci_privKey`
5. WHEN joinPoll is successful THEN the System SHALL store the serialized public key in localStorage with key `maci_pubKey`

### Requirement 2

**User Story:** As a voter, I want to submit my vote using the correct poll state index so that my vote is properly encrypted and counted.

#### Acceptance Criteria

1. WHEN a user submits a vote THEN the System SHALL use `pollStateIndex` (not `stateIndex`) from localStorage
2. WHEN a user submits a vote THEN the System SHALL deserialize the private key from localStorage using the `macisk.xxx` format
3. WHEN a user submits a vote THEN the System SHALL use the MACI SDK `publishBatch` function for vote submission
4. WHEN vote submission is successful THEN the System SHALL display the transaction hash to the user

### Requirement 3

**User Story:** As a system administrator, I want the backend to support MACI joinPoll operations so that users can join polls with proper ZK proofs.

#### Acceptance Criteria

1. WHEN the backend receives a joinPoll request THEN the System SHALL have access to the required zkey files (PollJoining zkey and wasm)
2. WHEN the backend processes joinPoll THEN the System SHALL pass all required parameters to the MACI SDK (maciAddress, privateKey, pollId, pollJoiningZkey, pollJoiningWasm, sgDataArg, ivcpDataArg, startBlock)
3. WHEN joinPoll succeeds THEN the System SHALL return the `pollStateIndex` and `voiceCredits` to the client
4. IF joinPoll fails THEN the System SHALL return a descriptive error message

### Requirement 4

**User Story:** As a voter, I want to see my join status and vote status so that I know if my actions were successful.

#### Acceptance Criteria

1. WHEN a user has successfully joined a poll THEN the System SHALL display "Joined" status with the pollStateIndex
2. WHEN a user attempts to join a poll they already joined THEN the System SHALL prevent duplicate joins and show existing status
3. WHEN displaying vote debug info THEN the System SHALL show: MACI address, Poll ID, pollStateIndex, and key match status

### Requirement 5

**User Story:** As a developer, I want the keypair generation to use serialized format so that it's compatible with the MACI SDK.

#### Acceptance Criteria

1. WHEN generating a new keypair THEN the System SHALL use `Keypair()` constructor (random) or derive from user input
2. WHEN storing the private key THEN the System SHALL use `privateKey.serialize()` to get the `macisk.xxx` format
3. WHEN storing the public key THEN the System SHALL use `publicKey.serialize()` to get the `macipk.xxx` format
4. WHEN loading keys for voting THEN the System SHALL use `PrivKey.deserialize()` and `PubKey.deserialize()` methods
