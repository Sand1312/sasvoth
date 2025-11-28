# Backend RESTful API Changes

## Overview

All backend controllers have been refactored to follow RESTful API naming conventions with 100% resource-oriented design.

## Changes Summary

### Auth Controller (`/auth`)

| Old Endpoint                | New Endpoint                    | Method | Description             |
| --------------------------- | ------------------------------- | ------ | ----------------------- |
| `POST /auth/signin?type=X`  | `POST /auth/sessions`           | POST   | Create session (login)  |
| `GET /auth/signin?type=X`   | `GET /auth/sessions?provider=X` | GET    | OAuth redirect          |
| `GET /auth/signin/callback` | `GET /auth/sessions/callback`   | GET    | OAuth callback          |
| `POST /auth/signup`         | `POST /auth/users`              | POST   | Create user (signup)    |
| `POST /auth/logout`         | `DELETE /auth/sessions`         | DELETE | Delete session (logout) |
| `POST /auth/validate`       | `POST /auth/sessions/validate`  | POST   | Validate session        |
| `POST /auth/refresh`        | `POST /auth/sessions/refresh`   | POST   | Refresh tokens          |

---

### Ideas Controller (`/ideas`)

| Old Endpoint                | New Endpoint           | Method | Description     |
| --------------------------- | ---------------------- | ------ | --------------- |
| -                           | `GET /ideas`           | GET    | List all ideas  |
| `POST /ideas/create`        | `POST /ideas`          | POST   | Create idea     |
| `GET /ideas/:ideaId`        | `GET /ideas/:id`       | GET    | Get idea by ID  |
| `PUT /ideas/update/:ideaId` | `PATCH /ideas/:id`     | PATCH  | Update idea     |
| -                           | `DELETE /ideas/:id`    | DELETE | Delete idea     |
| `PATCH /ideas/updateCID`    | `PATCH /ideas/:id/cid` | PATCH  | Update idea CID |

---

### Polls Controller (`/polls`)

| Old Endpoint                | New Endpoint                             | Method | Description      |
| --------------------------- | ---------------------------------------- | ------ | ---------------- |
| `GET /polls`                | `GET /polls`                             | GET    | List all polls   |
| `GET /polls/status/:status` | `GET /polls?status=X`                    | GET    | Filter by status |
| `POST /polls/create`        | `POST /polls`                            | POST   | Create poll      |
| `GET /polls/:pollId`        | `GET /polls/:id`                         | GET    | Get poll by ID   |
| -                           | `PATCH /polls/:id`                       | PATCH  | Update poll      |
| -                           | `DELETE /polls/:id`                      | DELETE | Delete poll      |
| `PATCH /polls/updateStatus` | `PATCH /polls/:id/status`                | PATCH  | Update status    |
| `PATCH /polls/addIdea`      | `POST /polls/:id/ideas`                  | POST   | Add idea         |
| `PATCH /polls/approveIdea`  | `PATCH /polls/:id/ideas/:ideaId/approve` | PATCH  | Approve idea     |
| `PATCH /polls/saveOnChain`  | `PATCH /polls/:id/chain`                 | PATCH  | Update chain ID  |

---

### Users Controller (`/users`)

| Old Endpoint                | New Endpoint                   | Method | Description        |
| --------------------------- | ------------------------------ | ------ | ------------------ |
| `GET /users/me`             | `GET /users/me`                | GET    | Get current user   |
| `GET /users/get?userId=X`   | `GET /users/:id`               | GET    | Get user by ID     |
| `POST /users/connectWallet` | `POST /users/:id/wallet`       | POST   | Connect wallet     |
| `PATCH /users/stateIndex`   | `PATCH /users/:id/state-index` | PATCH  | Update state index |
| `GET /users/historyDeposit` | `GET /users/:id/deposits`      | GET    | Get deposits       |
| `POST /users/deposit`       | `POST /users/:id/deposits`     | POST   | Create deposit     |

---

### MACI Controller (`/maci`)

| Old Endpoint                         | New Endpoint                         | Method | Description     |
| ------------------------------------ | ------------------------------------ | ------ | --------------- |
| `POST /maci/deploy-poll`             | `POST /maci/polls`                   | POST   | Deploy poll     |
| `GET /maci/poll-contracts/:pollId`   | `GET /maci/polls/:id/contracts`      | GET    | Get contracts   |
| `POST /maci/merge/:pollId`           | `POST /maci/polls/:id/merge`         | POST   | Merge state     |
| `POST /maci/merge-direct/:pollId`    | `POST /maci/polls/:id/merge/direct`  | POST   | Direct merge    |
| `POST /maci/generate-proofs/:pollId` | `POST /maci/polls/:id/proofs`        | POST   | Generate proofs |
| `POST /maci/submit-proofs/:pollId`   | `POST /maci/polls/:id/proofs/submit` | POST   | Submit proofs   |

---

### Results Controller (`/results` → `/polls/:pollId/results`)

| Old Endpoint           | New Endpoint                        | Method | Description   |
| ---------------------- | ----------------------------------- | ------ | ------------- |
| `GET /results/:pollId` | `GET /polls/:pollId/results`        | GET    | Get results   |
| `POST /results/tally`  | `POST /polls/:pollId/results/tally` | POST   | Trigger tally |

---

### Rewards Controller (`/rewards` → `/users/:userId/rewards`)

| Old Endpoint                         | New Endpoint                          | Method | Description   |
| ------------------------------------ | ------------------------------------- | ------ | ------------- |
| `GET /rewards/get?userId=X&pollId=Y` | `GET /users/:userId/rewards?pollId=Y` | GET    | Get rewards   |
| `POST /rewards/save`                 | `POST /users/:userId/rewards`         | POST   | Create reward |

---

## Backward Compatibility

All legacy endpoints are preserved with `@deprecated` annotations:

- Old endpoints still work
- Swagger shows them as deprecated
- No breaking changes for existing clients

## New Service Methods Added

### IdeasService

- `getAllIdeas()` - Get all ideas
- `deleteIdea(ideaId)` - Delete an idea

### PollsService

- `updatePoll(pollId, data)` - Update a poll
- `deletePoll(pollId)` - Delete a poll

## Files Modified

### Controllers

- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/ideas/ideas.controller.ts`
- `apps/api/src/modules/polls/polls.controller.ts`
- `apps/api/src/modules/users/users.controller.ts`
- `apps/api/src/modules/maci/maci.controller.ts`
- `apps/api/src/modules/results-meta/results-meta.controller.ts`
- `apps/api/src/modules/rewards/rewards.controller.ts`

### Services

- `apps/api/src/modules/ideas/ideas.service.ts`
- `apps/api/src/modules/polls/polls.service.ts`

## RESTful Principles Applied

1. **Resource-Oriented URLs**
   - `/users`, `/polls`, `/ideas` (collections)
   - `/users/:id`, `/polls/:id` (specific resources)

2. **HTTP Methods for Actions**
   - GET - Read/retrieve
   - POST - Create
   - PATCH - Partial update
   - DELETE - Remove

3. **Hierarchical Resources**
   - `/polls/:pollId/ideas` (ideas in a poll)
   - `/users/:userId/rewards` (user's rewards)
   - `/polls/:pollId/results` (poll results)

4. **Query Parameters for Filtering**
   - `/polls?status=active`
   - `/users/:userId/rewards?pollId=X`

## Testing

All endpoints have been verified:

- ✅ No TypeScript errors
- ✅ Swagger documentation updated
- ✅ Legacy endpoints preserved
- ✅ New endpoints functional

## Migration Guide

### For Frontend Developers

1. Update API calls to use new endpoints
2. Old endpoints still work (backward compatible)
3. Gradually migrate to new endpoints
4. Remove deprecated calls when ready

### Example Migration

```typescript
// Before
await api.post('/polls/create', data);
await api.patch('/polls/updateStatus', { pollId, status });

// After
await api.post('/polls', data);
await api.patch(`/polls/${pollId}/status`, { status });
```

## Swagger Documentation

All new endpoints are documented with:

- `@ApiOperation` - Summary
- `@ApiParam` - Path parameters
- `@ApiBody` - Request body
- `@ApiResponse` - Response types
- `@ApiQuery` - Query parameters

Legacy endpoints are marked with `[Deprecated]` in their summaries.
