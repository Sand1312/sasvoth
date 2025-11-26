# Project Structure

## Monorepo Organization

This is a Turborepo monorepo with two main directories: `apps/` and `packages/`.

## Apps

### apps/web

Next.js frontend application with App Router architecture.

```
apps/web/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard, polls, newvote
│   ├── api/               # API route handlers (proxy to backend)
│   ├── dashboard/         # User dashboard
│   ├── ideas/[id]/        # Dynamic idea detail pages
│   ├── polls/[id]/        # Dynamic poll pages with context
│   ├── settings/          # User settings
│   ├── signin/            # Authentication pages
│   ├── signup/
│   ├── transactions/      # Transaction history
│   └── votes/[id]/        # Vote detail pages
├── api/                   # API client layer (auth, ideas, ipfs, maci, polls)
├── components/            # Shared React components
├── hooks/                 # Custom React hooks (useAuth, useMACI, usePolls, etc.)
├── lib/                   # Utilities (contracts, wagmi-config, logger)
├── providers/             # React context providers (Web3Provider)
├── mocks/                 # MSW mock handlers and data
└── public/                # Static assets including zkeys
```

### apps/api

NestJS backend API with modular architecture.

```
apps/api/
├── src/
│   ├── common/            # Shared utilities
│   │   ├── filters/       # Exception filters (http-exception)
│   │   ├── guards/        # Auth guards
│   │   ├── interceptors/  # Logging interceptor
│   │   ├── logger/        # Pino logger setup
│   │   └── pipes/         # Validation pipes (Zod)
│   ├── config/            # Configuration (app, database)
│   ├── dto/               # Data transfer objects (ideas, ipfs, rewards, votes, etc.)
│   ├── modules/           # Feature modules
│   │   ├── auth/          # Authentication (JWT, OAuth strategies)
│   │   ├── ideas/         # Ideas CRUD with schemas
│   │   ├── ipfs/          # IPFS integration
│   │   ├── maci/          # MACI protocol integration
│   │   ├── polls/         # Polls management
│   │   ├── results-meta/  # Poll results metadata
│   │   ├── rewards/       # Rewards system
│   │   ├── users/         # User management
│   │   ├── voice-credits/ # Voice credits for voting
│   │   └── votes/         # Vote tracking
│   ├── sol/               # Solidity contracts and Circom circuits
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper utilities (encryption, signatures, MACI keys)
└── test/                  # E2E tests
```

## Packages

### packages/circuits

Zero-knowledge proof circuit implementations.

- Contains Circom circuits for vote proofs
- Proof generation utilities
- Verification keys and zkeys

### packages/contracts

Smart contract ABIs and TypeScript types.

- Contract ABIs organized by category (contracts, policy, poseidon, proxy)
- Exports for MACI, Poll, Tally, Token, Verifier contracts

### packages/ui

Shared React component library.

- Reusable UI components (button, input)
- Tailwind CSS styling
- Utility functions

### packages/maci-assets

MACI protocol assets.

- Zero-knowledge proof keys (zkeys)
- Circom circuit artifacts
- Helper scripts for encryption and auth

### packages/eslint-config

Shared ESLint configurations.

- Base config
- Next.js config
- React internal config

### packages/typescript-config

Shared TypeScript configurations.

- Base config
- Next.js config
- React library config

## Key Conventions

### Module Structure (NestJS)

Each feature module follows this pattern:

```
module-name/
├── schemas/              # Mongoose schemas
├── module-name.controller.ts
├── module-name.service.ts
└── module-name.module.ts
```

### API Routes (Next.js)

- App Router with file-based routing
- Dynamic routes use `[id]` or `[...path]` syntax
- Client components suffixed with `Client.tsx` (e.g., `PollPageClient.tsx`)
- Server components in `page.tsx`

### Workspace References

Internal packages use workspace protocol:

```json
"@sasvoth/contracts": "workspace:*"
"@sasvoth/ui": "workspace:*"
```

### Environment Files

- `.env` files at app level (apps/web/.env, apps/api/.env)
- Not committed to git (in .gitignore)
- Required for OAuth, database, and API URLs
