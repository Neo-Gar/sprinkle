# Sprinkle

A platform for splitting and settling bills on the [Sui](https://sui.io) blockchain. Create groups, add bills with custom splits, track who owes what, and pay debts on-chain.

## Features

- **Groups** — Organize friends or roommates, invite via link, manage members
- **Bills** — Create bills with a total amount and per-person splits (by amount or share)
- **Debts** — View your debts across groups and bills
- **On-chain settlement** — Pay debts in SUI; the Move contract transfers coins to the creditor and records payment
- **Auth** — Sign in with Google (zkLogin) or connect a Sui wallet

## Project structure

Monorepo managed with [Turborepo](https://turbo.build) and pnpm:

| Path | Description |
|------|-------------|
| `apps/web` | Next.js app: UI, tRPC API, auth (zkLogin + wallet), MongoDB for groups/bills metadata |
| `packages/move` | Sui Move contract: create bills (mint debt objects to debtors), pay debts (transfer SUI to creditor, burn debt) |

## Tech stack

- **Web:** [Next.js](https://nextjs.org) 15, [tRPC](https://trpc.io), [Tailwind CSS](https://tailwindcss.com), [Mysten dapp-kit](https://sdk.mystenlabs.com/dapp-kit) (Sui), [MongoDB](https://www.mongodb.com)
- **Chain:** [Sui](https://sui.io), [Move](https://move-language.github.io/move/)

## Getting started

### Prerequisites

- Node.js ≥ 22
- pnpm
- Sui CLI (for building/publishing the Move package)
- MongoDB (for the web app)
- Google OAuth client and env vars for zkLogin (see `apps/web/.env.example` and `apps/web/src/env.js`)

### Install and run

```bash
pnpm install
pnpm dev
```

Runs all apps in dev mode (from repo root). To run only the web app:

```bash
pnpm exec turbo dev --filter=web
```

Or from `apps/web`:

```bash
cd apps/web && pnpm dev
```

### Build

```bash
pnpm build
```

To build a single app:

```bash
pnpm exec turbo build --filter=web
```

### Move contract

From repo root:

```bash
cd packages/move
sui move build
sui move test
```

Publish and set the package ID in the web app env if you use on-chain bill creation.

## Environment

Copy `apps/web/.env.example` to `apps/web/.env` and fill in:

- MongoDB connection string
- Sui RPC/GRPC URLs (e.g. testnet)
- Google OAuth client ID and zkLogin callback URL for auth

See `apps/web/src/env.js` for the full schema.

## License

Private / unlicensed unless stated otherwise.
