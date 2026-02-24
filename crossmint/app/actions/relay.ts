"use server";

// -----------------------------------------------------------------
// Server actions for calling the Relay API.
// These run on the server so the optional RELAY_API_KEY stays secret.
// -----------------------------------------------------------------

const RELAY_API = "https://api.relay.link";

// ---- Types ------------------------------------------------------

// https://docs.relay.link/references/api/get-quote-v2 for full list of params
export interface RelayQuoteParams {
  user: string; // wallet address
  originChainId: number; // e.g. 8453 (Base)
  destinationChainId: number; // e.g. 42161 (Arbitrum)
  originCurrency: string; // token address or 0x0000…0000 for native ETH
  destinationCurrency: string;
  amount: string; // in wei / smallest unit
  tradeType?: "EXACT_INPUT" | "EXACT_OUTPUT";
  recipient?: string; // defaults to user if omitted
}

interface TxData {
  from: string;
  to: string;
  data: string;
  value: string;
  chainId: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface StepItem {
  status: "incomplete" | "complete";
  data: TxData;
  check?: { endpoint: string; method: string };
}

export interface RelayStep {
  id: string; // "approval" | "deposit" | etc
  action: string;
  description: string;
  kind: "transaction" | "signature";
  requestId: string; // same requestId on every step — identifies the whole quote
  items: StepItem[];
}

export interface RelayQuoteResponse {
  steps: RelayStep[];
  fees: {
    gas: { amountFormatted: string; amountUsd: string };
    relayer: { amountFormatted: string; amountUsd: string };
  };
  details: {
    operation: string;
    sender: string;
    recipient: string;
    currencyIn: {
      currency: { symbol: string; decimals: number; chainId: number };
      amount: string;
      amountFormatted: string;
      amountUsd: string;
    };
    currencyOut: {
      currency: { symbol: string; decimals: number; chainId: number };
      amount: string;
      amountFormatted: string;
      amountUsd: string;
    };
    timeEstimate: number; // seconds
  };
}

export interface RelayStatusResponse {
  status: "pending" | "success" | "failure";
  inTxHashes?: string[];
  txHashes?: string[]; // destination tx hashes
  originChainId?: number;
  destinationChainId?: number;
  updatedAt?: number;
}

// ---- Helpers ----------------------------------------------------

function relayHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Include Relay API key if configured (raises rate limits)
  if (process.env.RELAY_API_KEY) {
    headers["x-api-key"] = process.env.RELAY_API_KEY;
  }

  return headers;
}

// ---- Server actions ---------------------------------------------

/**
 * Fetch an executable quote from Relay.
 * Returns the full quote response including steps with transaction calldata.
 */
export async function getRelayQuote(
  params: RelayQuoteParams,
): Promise<RelayQuoteResponse | { error: string }> {
  const res = await fetch(`${RELAY_API}/quote/v2`, {
    method: "POST",
    headers: relayHeaders(),
    body: JSON.stringify({
      ...params,
      tradeType: params.tradeType ?? "EXACT_INPUT",
      // IMPORTANT: May be required for smart contract wallets (like Crossmint).
      // Routes payment through a receiver contract that emits events,
      // allowing the solver to detect deposits from smart wallets.
      // Uncomment if deposits are not being detected by Relay:
      // useReceiver: true,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return { error: errorText };
  }

  return res.json();
}

/**
 * Poll the status of a Relay intent.
 * Call this with the requestId from quote.steps (the "deposit" step).
 */
export async function getRelayStatus(
  requestId: string,
): Promise<RelayStatusResponse> {
  const headers = relayHeaders();
  // Status endpoint is a GET — remove Content-Type
  delete headers["Content-Type"];

  const res = await fetch(
    `${RELAY_API}/intents/status/v3?requestId=${encodeURIComponent(requestId)}`,
    { headers },
  );

  return res.json();
}
