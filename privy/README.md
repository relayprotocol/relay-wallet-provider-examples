# Privy + Relay Example

A Next.js app demonstrating cross-chain bridging and token swapping using [Privy](https://www.privy.io/) for authentication and the [Relay](https://relay.link/) protocol API.

## Getting Started

### Prerequisites

- Node.js 18+
- A Privy app ID — create one at [dashboard.privy.io](https://dashboard.privy.io/)
- (Optional) A Relay API key for higher rate limits — get one at [dashboard.relay.link](https://dashboard.relay.link/)

### Install

```bash
cd privy
npm install
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your keys:

```
NEXT_PUBLIC_PRIVY_APP_ID="<your Privy app ID>"
RELAY_API_KEY="<your Relay API key>"
```

| Variable | Required | Side | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Yes | Client | Privy app ID from your dashboard |
| `RELAY_API_KEY` | No | Server | Relay API key — optional, raises rate limits |

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

### Authentication & Wallet

The app uses Privy (`@privy-io/react-auth`) for authentication and `@privy-io/wagmi` for wagmi integration. Users can sign in with an external wallet (e.g. MetaMask) or email (which creates an embedded Privy wallet).

The `usePrivyWallet` hook (`hooks/usePrivyWallet.ts`) wraps the Privy wallet state and exposes:

- The connected wallet address and a viem `Account` object
- `makeWalletClient(chain)` — async factory that switches the wallet to the target chain (via `wallet.switchChain()`) then returns a viem `WalletClient`
- `makePublicClient(chain)` — factory for read-only `PublicClient` instances

Chain switching is handled automatically — when a Relay quote step targets a different chain, `makeWalletClient` prompts the wallet to switch before sending the transaction.

### Relay API Integration

Relay API calls happen in Next.js server actions (`actions/relay.ts`) so the optional `RELAY_API_KEY` stays server-side. Three endpoints are used:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| [`/quote/v2`](https://docs.relay.link/references/api/get-quote-v2) | POST | Get an executable quote with transaction calldata |
| [`/intents/status/v3`](https://docs.relay.link/references/api/get-intent-status-v3) | GET | Poll intent status by `requestId` |
| Relay signature endpoints | POST | Submit EIP-191/EIP-712 signatures back to Relay |

Client-side Relay utilities live in `actions/relay-client.ts`. This includes `signItem` (handles EIP-191 and EIP-712 signing) and `executeQuote` (iterates through all quote steps, signing and sending transactions in order).

### Bridge Page (`/bridge`)

Bridges native ETH from Base to Arbitrum.

**Flow:**

1. User enters an ETH amount
2. App calls `getQuote()` with the amount converted via `parseEther()`
3. Quote summary is displayed (input/output amounts, fees, time estimate)
4. User confirms — `executeQuote()` processes all steps from the quote, sending transactions via the Privy-connected wallet
5. App polls `getStatus()` until the intent resolves to success or failure

### Swap Page (`/swap`)

Swaps ETH for USDC on Base.

**Flow:**

1. User enters an ETH amount
2. App calls `getQuote()` with ETH as origin currency and Base USDC as destination
3. Quote summary is displayed
4. User confirms — `executeQuote()` iterates through all steps and items sequentially
5. App polls `getStatus()` until the intent resolves

Swaps may involve multiple steps. Relay can return a signature step (EIP-712 permit or authorization) before the deposit transaction. The `executeQuote` function handles both `signature` and `transaction` step kinds automatically.

## Project Structure

```
src/app/
  layout.tsx              — Root layout
  providers.tsx           — PrivyProvider + WagmiProvider + QueryClient setup
  page.tsx                — Landing page with nav to /bridge and /swap
  bridge/page.tsx         — Bridge ETH (Base → Arbitrum)
  swap/page.tsx           — Swap ETH → USDC (Base)
  actions/
    relay.ts              — Server actions: getQuote, submitSignature, getStatus
    relay-client.ts       — Client utils: signItem, executeQuote
  hooks/
    usePrivyWallet.ts     — Privy wallet state + viem Account + wallet/public client factories
  components/
    QuoteDisplay.tsx      — Relay quote summary (fees, output, time estimate)
    StatusTracker.tsx     — Polls + displays intent status with link to Relay explorer
```

## Relay Docs

- [Relay API Reference](https://docs.relay.link/references/api/overview)
- [Get Quote (v2)](https://docs.relay.link/references/api/get-quote-v2)
- [Intent Status (v3)](https://docs.relay.link/references/api/get-intent-status-v3)
- [API Keys](https://docs.relay.link/references/api/api-keys)
