# Turnkey + Relay Example

A Next.js app demonstrating cross-chain bridging and token swapping using [Turnkey](https://www.turnkey.com/) wallets and the [Relay](https://relay.link/) protocol API.

## Getting Started

### Prerequisites

- Node.js 18+
- A Turnkey organization with an auth proxy configuration — set up at [app.turnkey.com](https://app.turnkey.com/)
- (Optional) A Relay API key for higher rate limits — get one at [dashboard.relay.link](https://dashboard.relay.link/)

### Install

```bash
cd turnkey
npm install
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your keys:

```
NEXT_PUBLIC_ORGANIZATION_ID="<your Turnkey organization ID>"
NEXT_PUBLIC_AUTH_PROXY_CONFIG_ID="<your Turnkey auth proxy configuration ID>"
NEXT_PUBLIC_API_BASE_URL="https://api.turnkey.com"
NEXT_PUBLIC_AUTH_PROXY_BASE_URL="https://authproxy.turnkey.com"
RELAY_API_KEY="<your Relay API key>"
```

| Variable | Required | Side | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_ORGANIZATION_ID` | Yes | Client | Turnkey organization ID |
| `NEXT_PUBLIC_AUTH_PROXY_CONFIG_ID` | Yes | Client | Turnkey auth proxy configuration ID |
| `NEXT_PUBLIC_API_BASE_URL` | No | Client | Turnkey API base URL (defaults to `https://api.turnkey.com`) |
| `NEXT_PUBLIC_AUTH_PROXY_BASE_URL` | No | Client | Turnkey auth proxy URL (defaults to `https://authproxy.turnkey.com`) |
| `RELAY_API_KEY` | No | Server | Relay API key — optional, raises rate limits |

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

### Authentication & Wallet

The app uses Turnkey's React Wallet Kit (`@turnkey/react-wallet-kit`) for authentication. Users sign in via passkey or email OTP, which creates a Turnkey sub-organization with an HD wallet. The `useTurnkeyWallet` hook (`hooks/useTurnkeyWallet.ts`) wraps the Turnkey session and exposes a viem `Account` for signing transactions, plus factory functions for creating `WalletClient` and `PublicClient` instances per chain.

Sessions expire automatically. The hook detects this and surfaces a `sessionExpired` flag so the UI can prompt re-authentication.

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
4. User confirms — `executeQuote()` processes all steps from the quote, sending transactions via the Turnkey-backed wallet
5. App polls `getStatus()` until the intent resolves to success or failure

Native ETH bridges are the simplest case — a single deposit step with one transaction, no approval needed.

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
  providers.tsx           — TurnkeyProvider + WagmiProvider + QueryClient setup
  page.tsx                — Landing page with nav to /bridge and /swap
  bridge/page.tsx         — Bridge ETH (Base → Arbitrum)
  swap/page.tsx           — Swap ETH → USDC (Base)
  actions/
    relay.ts              — Server actions: getQuote, submitSignature, getStatus
    relay-client.ts       — Client utils: signItem, executeQuote
  hooks/
    useTurnkeyWallet.ts   — Turnkey session + viem Account + wallet/public client factories
  components/
    QuoteDisplay.tsx      — Relay quote summary (fees, output, time estimate)
    StatusTracker.tsx      — Polls + displays intent status with link to Relay explorer
    SessionExpiredBanner.tsx — Prompts re-authentication when session expires
```

## Relay Docs

- [Relay API Reference](https://docs.relay.link/references/api/overview)
- [Get Quote (v2)](https://docs.relay.link/references/api/get-quote-v2)
- [Intent Status (v3)](https://docs.relay.link/references/api/get-intent-status-v3)
- [API Keys](https://docs.relay.link/references/api/api-keys)
