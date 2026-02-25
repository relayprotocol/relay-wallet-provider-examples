# Relay Wallet Provider Examples

Example Next.js apps showing how to integrate the [Relay](https://relay.link/) protocol API with different wallet providers for cross-chain bridging and token swapping.

## Examples

| Example | Wallet Type | Auth Method | Description |
| --- | --- | --- | --- |
| [`/crossmint`](./crossmint) | Smart wallet (EVM) | Email (Crossmint) | Uses Crossmint smart wallets with email-based signers |
| [`/turnkey`](./turnkey) | HD wallet (EOA) | Passkey / Email OTP (Turnkey) | Uses Turnkey sub-organizations with HD wallets via viem |

Each example is a standalone Next.js app with its own dependencies. See the README in each directory for setup instructions.

## What These Examples Cover

- Fetching executable quotes from the Relay `/quote/v2` API
- Executing multi-step flows (approvals, signatures, deposits)
- Handling EIP-191 and EIP-712 signing for signature steps
- Polling intent status via `/intents/status/v3`
- Protecting an optional Relay API key server-side using Next.js server actions

## Relay Docs

- [Relay API Reference](https://docs.relay.link/references/api/overview)
- [Get Quote (v2)](https://docs.relay.link/references/api/get-quote-v2)
- [Intent Status (v3)](https://docs.relay.link/references/api/get-intent-status-v3)
- [API Keys](https://docs.relay.link/references/api/api-keys)
