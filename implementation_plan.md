# Implementation Plan - Localize MACI SDK

The goal is to replace the `@maci-protocol/sdk` NPM dependency with a local source copy from the `privacy-ethereum/maci` repository to enable direct debugging and modification.

## User Review Required

> [!WARNING]
> **Version Mismatch Risk**: The `main` branch of `privacy-ethereum/maci` may differ from the `0.0.0-ci.ffb9e52` version currently installed.
> To ensure compatibility, we should likely check out the specific commit `ffb9e52` (if available) or update **all** MACI packages (`crypto`, `domainobjs`, `sdk`) to the local version to avoid type mismatches.
>
> **Recommendation**: I will clone `sdk`, `domainobjs`, and `crypto` to `packages/` and verify they link correctly.

## Proposed Changes

### 1. Setup Local Packages

- **Action**: Clone `privacy-ethereum/maci` to a temporary directory.
- **Action**: Copy the following packages to `sasvoth/packages/`:
  - `sdk` -> `packages/maci-sdk`
  - `domainobjs` -> `packages/maci-domainobjs` (Recommended for type compatibility)
  - `crypto` -> `packages/maci-crypto` (Recommended)

### 2. Workspace Configuration

#### [MODIFY] [package.json](file:///Users/thesand/sasvoth/package.json)

- Add `packages/maci-*` to the workspace `workspaces` list if not covered by `packages/*`.

#### [MODIFY] [apps/web/package.json](file:///Users/thesand/sasvoth/apps/web/package.json)

- Update dependencies to point to the local workspace versions:
  ```json
  "@maci-protocol/sdk": "workspace:*",
  "@maci-protocol/domainobjs": "workspace:*",
  "@maci-protocol/crypto": "workspace:*"
  ```

### 3. Build & Link

- Run `turbo install` (or `npm install`) to link workspaces.
- Build the local MACI packages (`turbo run build --filter=@maci-protocol/*`).

### User Feedback System (Completed)

- [x] Create `FeedbackDialog` component (Shadcn-like)
- [x] Create `FeedbackContext` and `useFeedback` hook
- [x] Wrap application in `FeedbackProvider`
- [x] Replace `alert()` usage in:
  - `IdeaUploadForm.tsx`
  - `PollClient.tsx` (MACI Join/Signup, Tally)
  - `VotePage.tsx` (Vote validation, Buy Credits)
  - `LoginForm.tsx` & `SocialLoginButtons.tsx`
  - `dashboard/page.tsx` & `transactions/page.tsx`

## Verification Plan

### Automated Tests

- Build verification: `turbo build --filter=web`

### Manual Verification

- **Idea Submission**: Verify success dialog appears and form closes.
- **Poll Joining**: Verify MACI signup/join success/error dialogs.
- **Voting**: Verify vote submission success dialog.
- **Login**: Verify mock login success/error.
- Add a unique log in `packages/maci-sdk/ts/index.ts` to confirm the local code is executing.
  - ✅ **VERIFIED**: Log statement added and confirmed in build output at line 20.
