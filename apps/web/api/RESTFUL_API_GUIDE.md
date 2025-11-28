# RESTful API Naming Guide

## Overview

All APIs have been refactored to follow RESTful naming conventions with 100% resource-oriented design.

## RESTful Principles Applied

### 1. Resource-Oriented URLs

- URLs represent resources (nouns), not actions (verbs)
- Use plural nouns for collections: `/users`, `/polls`, `/ideas`
- Use singular for specific resources: `/users/:id`, `/polls/:id`

### 2. HTTP Methods for Actions

- `GET` - Read/retrieve resources
- `POST` - Create new resources
- `PUT` - Replace entire resource
- `PATCH` - Partial update
- `DELETE` - Remove resource

### 3. Hierarchical Resources

- Sub-resources nested under parent: `/polls/:pollId/ideas`
- Related resources linked: `/users/:userId/rewards`

### 4. Query Parameters for Filtering

- Filter collections: `/polls?status=active`
- Search: `/users?search=john`

## API Reference

### Auth API (`authApi`)

| Method | Old Name             | New Name        | Endpoint                |
| ------ | -------------------- | --------------- | ----------------------- |
| Login  | `signinWithProvider` | `createSession` | `POST /auth/sessions`   |
| Logout | `signout`            | `deleteSession` | `DELETE /auth/sessions` |
| Signup | `signupWithEmail`    | `createUser`    | `POST /auth/users`      |

```typescript
// New RESTful way
await authApi.createSession("email", { email, password });
await authApi.deleteSession();
await authApi.createUser({ email, password, name });

// Old way (deprecated but still works)
await authApi.signinWithProvider("email", { email, password });
await authApi.signout();
await authApi.signupWithEmail(email, password, name);
```

---

### Ideas API (`ideasApi`)

| Method     | Old Name        | New Name    | Endpoint               |
| ---------- | --------------- | ----------- | ---------------------- |
| List       | -               | `getAll`    | `GET /ideas`           |
| Create     | `createIdea`    | `create`    | `POST /ideas`          |
| Get        | `getIdeaById`   | `getById`   | `GET /ideas/:id`       |
| Update     | `updateIdea`    | `update`    | `PATCH /ideas/:id`     |
| Delete     | -               | `delete`    | `DELETE /ideas/:id`    |
| Update CID | `updateIdeaCID` | `updateCid` | `PATCH /ideas/:id/cid` |

```typescript
// New RESTful way
await ideasApi.getAll();
await ideasApi.create(payload);
await ideasApi.getById(id);
await ideasApi.update(id, data);
await ideasApi.delete(id);
await ideasApi.updateCid(id, cid);

// Old way (deprecated)
await ideasApi.createIdea(payload);
await ideasApi.getIdeaById(id);
await ideasApi.updateIdea(id, data);
await ideasApi.updateIdeaCID(id, cid);
```

---

### Polls API (`pollsApi`)

| Method        | Old Name            | New Name        | Endpoint                                 |
| ------------- | ------------------- | --------------- | ---------------------------------------- |
| List          | `getPolls`          | `getAll`        | `GET /polls`                             |
| Create        | `createPoll`        | `create`        | `POST /polls`                            |
| Get           | `getPollById`       | `getById`       | `GET /polls/:id`                         |
| Update        | -                   | `update`        | `PATCH /polls/:id`                       |
| Delete        | -                   | `delete`        | `DELETE /polls/:id`                      |
| Update Status | `updatePollStatus`  | `updateStatus`  | `PATCH /polls/:id/status`                |
| Add Idea      | `addIdeaToPoll`     | `addIdea`       | `POST /polls/:id/ideas`                  |
| Approve Idea  | `approveIdeaInPoll` | `approveIdea`   | `PATCH /polls/:id/ideas/:ideaId/approve` |
| Update Chain  | `saveOnChainId`     | `updateChainId` | `PATCH /polls/:id/chain`                 |

```typescript
// New RESTful way
await pollsApi.getAll(status);
await pollsApi.create(payload);
await pollsApi.getById(id);
await pollsApi.update(id, data);
await pollsApi.delete(id);
await pollsApi.updateStatus(id, status);
await pollsApi.addIdea(pollId, ideaId);
await pollsApi.approveIdea(pollId, ideaId, cid);
await pollsApi.updateChainId(id, chainId);

// Old way (deprecated)
await pollsApi.createPoll(title, desc, addr, opts, start, end);
await pollsApi.getPolls(status);
await pollsApi.getPollById(id);
await pollsApi.updatePollStatus(id, status);
await pollsApi.addIdeaToPoll(pollId, ideaId);
await pollsApi.approveIdeaInPoll(pollId, ideaId, cid);
await pollsApi.saveOnChainId(id, chainId);
```

---

### Users API (`userApi`)

| Method         | Old Name            | New Name           | Endpoint                       |
| -------------- | ------------------- | ------------------ | ------------------------------ |
| Get Me         | -                   | `getMe`            | `GET /users/me`                |
| Get            | `getUserByWallet`   | `getById`          | `GET /users/:id`               |
| Update         | -                   | `update`           | `PATCH /users/:id`             |
| Connect Wallet | `connectWallet`     | `connectWallet`    | `POST /users/:id/wallet`       |
| Update State   | `saveStateIndex`    | `updateStateIndex` | `PATCH /users/:id/state-index` |
| Get Deposits   | `getHistoryDeposit` | `getDeposits`      | `GET /users/:id/deposits`      |
| Create Deposit | `deposit`           | `createDeposit`    | `POST /users/:id/deposits`     |

```typescript
// New RESTful way
await userApi.getMe();
await userApi.getById(id);
await userApi.update(id, data);
await userApi.connectWallet(userId, address);
await userApi.updateStateIndex(userId, index);
await userApi.getDeposits(userId);
await userApi.createDeposit(userId, amount, txHash);

// Old way (deprecated)
await userApi.getUserByWallet(address);
await userApi.saveStateIndex(address, index);
await userApi.deposit(userId, amount, txHash);
await userApi.getHistoryDeposit(userId);
```

---

### Votes API (`votesApi`)

| Method | Old Name   | New Name  | Endpoint         |
| ------ | ---------- | --------- | ---------------- |
| List   | `getVotes` | `getAll`  | `GET /votes`     |
| Create | `castVote` | `create`  | `POST /votes`    |
| Get    | -          | `getById` | `GET /votes/:id` |

```typescript
// New RESTful way
await votesApi.getAll({ pollId });
await votesApi.create(payload);
await votesApi.getById(id);

// Old way (deprecated)
await votesApi.getVotes({ pollId });
await votesApi.castVote(payload);
```

---

### IPFS API (`ipfsApi`)

| Method | Old Name         | New Name  | Endpoint         |
| ------ | ---------------- | --------- | ---------------- |
| Get    | `fetchMetadata`  | `getById` | `GET /ipfs/:cid` |
| Create | `uploadMetadata` | `create`  | `POST /ipfs`     |

```typescript
// New RESTful way
await ipfsApi.getById(cid);
await ipfsApi.create(content);

// Old way (deprecated)
await ipfsApi.fetchMetadata(cid);
await ipfsApi.uploadMetadata(content);
```

---

### Poll Participants API (`pollParticipantsApi`)

| Method     | Old Name               | New Name           | Endpoint                                   |
| ---------- | ---------------------- | ------------------ | ------------------------------------------ |
| List       | `getVotes`             | `getAll`           | `GET /polls/:pollId/participants`          |
| Join       | `joinPoll`             | `create`           | `POST /polls/:pollId/participants`         |
| Check      | `checkVote`            | `checkJoined`      | `GET /polls/:pollId/participants/:voterId` |
| Commitment | `createVoteCommitment` | `createCommitment` | `POST /vote-commitments`                   |

```typescript
// New RESTful way
await pollParticipantsApi.getAll(pollId);
await pollParticipantsApi.create(payload);
await pollParticipantsApi.checkJoined(pollId, voterId);
await pollParticipantsApi.createCommitment(payload);

// Old way (deprecated) - via joinPollApi
await joinPollApi.getVotes({ pollId });
await joinPollApi.joinPoll(payload);
await joinPollApi.checkVote(voterId, pollId);
await joinPollApi.createVoteCommitment(vote, credits, pollId, key);
```

---

### MACI API (`maciApi`)

| Method        | Old Name           | New Name         | Endpoint                             |
| ------------- | ------------------ | ---------------- | ------------------------------------ |
| Deploy        | `deployPoll`       | `createPoll`     | `POST /maci/polls`                   |
| Contracts     | `getPollContracts` | `getContracts`   | `GET /maci/polls/:id/contracts`      |
| Merge         | `mergePoll`        | `merge`          | `POST /maci/polls/:id/merge`         |
| Merge Direct  | `mergeStateDirect` | `mergeDirect`    | `POST /maci/polls/:id/merge/direct`  |
| Gen Proofs    | `generateProofs`   | `generateProofs` | `POST /maci/polls/:id/proofs`        |
| Submit Proofs | `submitProofs`     | `submitProofs`   | `POST /maci/polls/:id/proofs/submit` |

```typescript
// New RESTful way
await maciApi.createPoll(payload);
await maciApi.getContracts(pollId);
await maciApi.merge(pollId);
await maciApi.mergeDirect(pollId);
await maciApi.generateProofs(pollId);
await maciApi.submitProofs(pollId);

// Old way (deprecated)
await maciApi.deployPoll(payload);
await maciApi.getPollContracts(pollId);
await maciApi.mergePoll(pollId);
await maciApi.mergeStateDirect(pollId);
```

---

### Results API (`resultsApi`)

| Method | Old Name     | New Name      | Endpoint                            |
| ------ | ------------ | ------------- | ----------------------------------- |
| Get    | `getResults` | `getByPollId` | `GET /polls/:pollId/results`        |
| Tally  | `tally`      | `tally`       | `POST /polls/:pollId/results/tally` |

```typescript
// New RESTful way
await resultsApi.getByPollId(pollId);
await resultsApi.tally(pollId);

// Old way (deprecated)
await resultsApi.getResults({ pollId });
```

---

### Rewards API (`rewardsApi`)

| Method | Old Name     | New Name    | Endpoint                      |
| ------ | ------------ | ----------- | ----------------------------- |
| Get    | `getReward`  | `getByUser` | `GET /users/:userId/rewards`  |
| Create | `saveReward` | `create`    | `POST /users/:userId/rewards` |

```typescript
// New RESTful way
await rewardsApi.getByUser(userId, pollId);
await rewardsApi.create({ userId, pollId, creditCount });

// Old way (deprecated)
await rewardsApi.getReward({ userId, pollId });
await rewardsApi.saveReward({ userId, pollId, credit_count });
```

---

## Naming Conventions Summary

### Standard CRUD Operations

| Operation | Method Name | HTTP Method | URL Pattern      |
| --------- | ----------- | ----------- | ---------------- |
| List all  | `getAll`    | GET         | `/resources`     |
| Get one   | `getById`   | GET         | `/resources/:id` |
| Create    | `create`    | POST        | `/resources`     |
| Update    | `update`    | PATCH       | `/resources/:id` |
| Replace   | `replace`   | PUT         | `/resources/:id` |
| Delete    | `delete`    | DELETE      | `/resources/:id` |

### Sub-Resource Operations

| Operation  | Method Name | HTTP Method | URL Pattern                           |
| ---------- | ----------- | ----------- | ------------------------------------- |
| List sub   | `getAll`    | GET         | `/resources/:id/sub-resources`        |
| Add sub    | `create`    | POST        | `/resources/:id/sub-resources`        |
| Update sub | `update`    | PATCH       | `/resources/:id/sub-resources/:subId` |

### Special Operations

| Operation     | Method Name    | HTTP Method | URL Pattern             |
| ------------- | -------------- | ----------- | ----------------------- |
| Current user  | `getMe`        | GET         | `/users/me`             |
| Status update | `updateStatus` | PATCH       | `/resources/:id/status` |
| Action        | `actionName`   | POST        | `/resources/:id/action` |

---

## Migration Guide

### Step 1: Update Imports (No Change Needed)

```typescript
// Imports remain the same
import { ideasApi, pollsApi, userApi } from "@/api";
```

### Step 2: Update Method Calls

```typescript
// Before
const idea = await ideasApi.createIdea(payload);
const poll = await pollsApi.getPollById(id);

// After
const idea = await ideasApi.create(payload);
const poll = await pollsApi.getById(id);
```

### Step 3: Gradual Migration

- Old methods are marked `@deprecated` but still work
- Migrate one component at a time
- Run tests after each migration

---

## Benefits

1. **Consistency** - All APIs follow the same pattern
2. **Predictability** - Easy to guess method names
3. **Discoverability** - IDE autocomplete works better
4. **Documentation** - Self-documenting code
5. **Standards** - Follows industry best practices
6. **Maintainability** - Easier to understand and modify

---

## Backward Compatibility

All old method names are preserved as deprecated aliases:

- They call the new methods internally
- TypeScript shows deprecation warnings
- No breaking changes to existing code
- Gradual migration is possible

```typescript
// This still works (but shows deprecation warning)
await ideasApi.createIdea(payload);

// This is the new recommended way
await ideasApi.create(payload);
```
