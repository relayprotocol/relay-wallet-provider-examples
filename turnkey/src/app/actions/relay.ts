"use server";

const RELAY_API_URL = "https://api.relay.link";

function authHeaders(): Record<string, string> {
  const key = process.env.RELAY_API_KEY;
  return key ? { Authorization: `Bearer ${key}` } : {};
}

// ── Types ──

export interface QuoteRequest {
  user: string;
  originChainId: number;
  destinationChainId: number;
  originCurrency: string;
  destinationCurrency: string;
  amount: string;
  tradeType: "EXACT_INPUT" | "EXACT_OUTPUT";
}

export interface SignData {
  signatureKind: "eip191" | "eip712";
  message?: string;
  domain?: Record<string, unknown>;
  types?: Record<string, Array<{ name: string; type: string }>>;
  primaryType?: string;
  value?: Record<string, unknown>;
}

export interface PostData {
  endpoint: string;
  method: string;
  body: Record<string, unknown>;
}

export interface StepItemData {
  from?: string;
  to?: string;
  data?: string;
  value?: string;
  chainId?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gas?: string;
  sign?: SignData;
  post?: PostData;
}

export interface StepItem {
  status: string;
  data: StepItemData;
}

export interface Step {
  id: string;
  action: string;
  description: string;
  kind: "transaction" | "signature";
  requestId?: string;
  items: StepItem[];
}

export interface FeeCurrency {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface FeeDetail {
  currency: FeeCurrency;
  amount: string;
  amountFormatted: string;
  amountUsd: string;
}

export interface Fees {
  gas?: FeeDetail;
  relayer?: FeeDetail;
  relayerGas?: FeeDetail;
  relayerService?: FeeDetail;
}

export interface CurrencyDetail {
  currency: FeeCurrency;
  amount: string;
  amountFormatted: string;
  amountUsd: string;
}

export interface QuoteDetails {
  operation: string;
  currencyIn: CurrencyDetail;
  currencyOut: CurrencyDetail;
  rate: string;
  timeEstimate: number;
}

export interface QuoteResponse {
  steps: Step[];
  fees: Fees;
  details: QuoteDetails;
}

export type FillStatus =
  | "waiting"
  | "pending"
  | "submitted"
  | "success"
  | "delayed"
  | "refunded"
  | "failure";

export interface StatusResponse {
  status: FillStatus;
  details?: string;
  inTxHashes?: string[];
  txHashes?: string[];
  outTxHashes?: string[];
  originChainId?: number;
  destinationChainId?: number;
  requestId?: string;
}

// ── API calls ──

export async function getQuote(
  params: QuoteRequest
): Promise<QuoteResponse> {
  const res = await fetch(`${RELAY_API_URL}/quote/v2`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || err.error || JSON.stringify(err) || res.statusText
    );
  }

  return res.json();
}

export async function submitSignature(
  endpoint: string,
  signature: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${RELAY_API_URL}${endpoint}`;
  const sep = url.includes("?") ? "&" : "?";

  const res = await fetch(`${url}${sep}signature=${signature}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || err.error || JSON.stringify(err) || res.statusText
    );
  }

  return res.json();
}

export async function getStatus(
  requestId: string
): Promise<StatusResponse> {
  const res = await fetch(
    `${RELAY_API_URL}/intents/status/v3?requestId=${encodeURIComponent(requestId)}`,
    { headers: { "Content-Type": "application/json", ...authHeaders() } }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }

  return res.json();
}
