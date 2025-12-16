# Tech Stack

## Build System

- **Monorepo**: Turborepo with pnpm workspaces
- **Package Manager**: pnpm 10.22.0
- **Node Version**: >= 18
- **TypeScript**: 5.8.3

## Frontend (apps/web)

- **Framework**: Next.js 15.3.0 (App Router)
- **React**: 19.1.0
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi 2.19.1, Viem 2.38.6, Ethers 5.8.0
- **State Management**: TanStack Query (React Query) 5.90.5
- **Authentication**: NextAuth 4.24.11
- **HTTP Client**: Axios 1.12.2
- **ZK Proofs**: SnarkJS 0.7.5
- **MACI**: @maci-protocol/crypto, @maci-protocol/domainobjs
- **Mocking**: MSW (Mock Service Worker) 2.12.2

## Backend (apps/api)

- **Framework**: NestJS 11.1.6
- **Database**: MongoDB with Mongoose 8.18.3
- **Cache**: Redis (ioredis 5.8.1)
- **Authentication**: Passport (JWT, Google OAuth, GitHub OAuth)
- **Validation**: Zod 4.1.12
- **API Docs**: Swagger/OpenAPI
- **Logging**: Pino 9.14.0
- **Testing**: Jest 30.0.5
- **MACI**: @maci-protocol/sdk
- **IPFS**: ipfs-http-client 55.0.0
- **ZK Circuits**: Circom, SnarkJS 0.7.5

## Packages

- **circuits**: Zero-knowledge proof generation (Circom, SnarkJS)
- **contracts**: Smart contract ABIs and types
- **ui**: Shared React component library
- **maci-assets**: MACI zkeys and cryptographic assets
- **eslint-config**: Shared ESLint configurations
- **typescript-config**: Shared TypeScript configurations

## Common Commands

### Development

```bash
# Run all apps in dev mode
pnpm dev

# Run specific app
turbo dev --filter=web
turbo dev --filter=api

# Run with mocking enabled (web only)
pnpm --filter=web mock
```

### Building

```bash
# Build all apps and packages
pnpm build

# Build specific app
turbo build --filter=web
turbo build --filter=api
```

### Linting & Type Checking

```bash
# Lint all packages
pnpm lint

# Type check all packages
pnpm check-types

# Format code
pnpm format
```

### Testing

```bash
# Run tests (API)
pnpm --filter=api test

# Run e2e tests (API)
pnpm --filter=api test:e2e

# Watch mode
pnpm --filter=api test:watch
```

## Environment Variables

### Web App

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_API_MOCKING`: Enable MSW mocking ("enabled")

### API

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: GitHub OAuth

## Key Dependencies

- **MACI Protocol**: Privacy-preserving voting infrastructure
- **Circom/SnarkJS**: Zero-knowledge proof circuits and generation
- **Wagmi/Viem**: Type-safe Ethereum interactions
- **Mongoose**: MongoDB ODM with schemas
- **NestJS Modules**: Modular backend architecture with guards, interceptors, pipes
