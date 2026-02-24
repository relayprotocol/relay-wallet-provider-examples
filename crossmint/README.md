# Crossmint + Relay Example

A Next.js app demonstrating cross-chain bridging and token swapping using [Crossmint](https://www.crossmint.com/) smart wallets and the [Relay](https://relay.link/) protocol API.

## Getting Started

### Prerequisites

- Node.js 18+
- A Crossmint client API key with wallet permissions enabled — create one in the [Crossmint Developer Dashboard](https://www.crossmint.com/console).
- (Optional) A Relay API key for higher rate limits — get one at [docs.relay.link](https://docs.relay.link/references/api/api-keys)

### Install

```bash
cd crossmint
npm install
```

### Environment Variables

Copy `.env.local` and fill in your keys:

```
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=ck_your_key_here
RELAY_API_KEY=
```

| Variable                               | Required | Side   | Description                                      |
| -------------------------------------- | -------- | ------ | ------------------------------------------------ |
| `NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY` | Yes      | Client | Crossmint client API key (must start with `ck_`) |
| `RELAY_API_KEY`                        | No       | Server | Relay API key — optional, raises rate limits     |

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

### Authentication & Wallet

The app wraps everything in Crossmint's provider stack (`providers.tsx`). When a user signs in, Crossmint provisions an **EVM smart wallet on Base** with an email-based signer — no browser extension required.

### Relay API Integration

All Relay API calls happen in Next.js server actions (`app/actions/relay.ts`) so the optional `RELAY_API_KEY` stays server-side. Two endpoints are used:

| Endpoint                                                                            | Method | Purpose                                           |
| ----------------------------------------------------------------------------------- | ------ | ------------------------------------------------- |
| [`/quote/v2`](https://docs.relay.link/references/api/get-quote-v2)                  | POST   | Get an executable quote with transaction calldata |
| [`/intents/status/v3`](https://docs.relay.link/references/api/get-intent-status-v3) | GET    | Poll intent status by `requestId`                 |

The quote response contains `steps[]`, each with `items[]` holding transaction data (`to`, `data`, `value`, `chainId`). Every step carries the same `requestId` which identifies the whole quote and is used for status polling.

### Bridge Page (`/bridge`)

Bridges native ETH from Base to Arbitrum.

**Flow:**

1. User enters an ETH amount
2. App calls `getRelayQuote()` with the amount converted via `parseEther()`
3. Quote summary is displayed (input/output amounts, fees, time estimate)
4. User confirms — the app sends a single transaction using the calldata from the quote via `EVMWallet.sendTransaction()`
5. App polls `getRelayStatus()` until the intent resolves to success or failure

Native ETH bridges are the simplest case — a single deposit step with one transaction, no approval needed.

### Swap Page (`/swap`)

Sends USDC on Base and receives USDC on Arbitrum.

**Flow:**

1. User enters a USDC amount
2. App calls `getRelayQuote()` with the amount converted via `parseUnits(amount, 6)`
3. Quote summary is displayed
4. User confirms — the app iterates through **all steps and all items** sequentially, sending each transaction
5. App polls `getRelayStatus()` until the intent resolves

ERC-20 swaps may involve multiple steps. Relay can return an `approval` step before the `deposit` step to grant the Relay contract permission to spend the user's tokens. The code handles this by looping through every step/item rather than assuming a single transaction.

## Project Structure

```
app/
  layout.tsx           — Root layout, wraps children in Crossmint providers
  providers.tsx        — CrossmintProvider + Auth + Wallet provider setup
  page.tsx             — Landing page with nav to /bridge and /swap
  bridge/page.tsx      — Bridge ETH (Base → Arbitrum)
  swap/page.tsx        — Swap USDC (Base → Arbitrum)
  actions/relay.ts     — Server actions: getRelayQuote, getRelayStatus
  components/
    AuthButton.tsx     — Login/logout toggle
    WalletInfo.tsx     — Connected wallet address display
    QuoteDisplay.tsx   — Relay quote summary (fees, output, time estimate)
    StatusTracker.tsx  — Polls + displays intent status with link to Relay explorer
```

## Relay Docs

- [Relay API Reference](https://docs.relay.link/references/api/overview)
- [Get Quote (v2)](https://docs.relay.link/references/api/get-quote-v2)
- [Intent Status (v3)](https://docs.relay.link/references/api/get-intent-status-v3)
- [API Keys](https://docs.relay.link/references/api/api-keys)
- [Relay Explorer](https://relay.link/)
