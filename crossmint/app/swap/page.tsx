"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { parseUnits } from "viem";
import { useAuth, useWallet, EVMWallet } from "@crossmint/client-sdk-react-ui";
import { getRelayQuote, type RelayQuoteResponse } from "../actions/relay";
import { AuthButton } from "../components/AuthButton";
import { WalletInfo } from "../components/WalletInfo";
import { QuoteDisplay } from "../components/QuoteDisplay";
import { StatusTracker } from "../components/StatusTracker";

// ----- Constants -----
const ORIGIN_CHAIN_ID = 8453; // Base
const DESTINATION_CHAIN_ID = 42161; // Arbitrum
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ARB_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const USDC_DECIMALS = 6;

export default function SwapPage() {
  const { status: authStatus } = useAuth();
  const { wallet, status: walletStatus } = useWallet();

  const [amount, setAmount] = useState("1");
  const [quote, setQuote] = useState<RelayQuoteResponse | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [txProgress, setTxProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loggedIn = authStatus === "logged-in";
  const walletReady = walletStatus === "loaded" && wallet;

  // ---- Fetch a swap quote from Relay ----
  const fetchQuote = useCallback(async () => {
    if (!walletReady) return;

    setLoading(true);
    setError(null);
    setQuote(null);
    setRequestId(null);
    setTxProgress("");

    try {
      const result = await getRelayQuote({
        user: wallet.address,
        originChainId: ORIGIN_CHAIN_ID,
        destinationChainId: DESTINATION_CHAIN_ID,
        originCurrency: BASE_USDC,
        destinationCurrency: ARB_USDC,
        amount: parseUnits(amount, USDC_DECIMALS).toString(),
      });

      if ("error" in result) {
        setError(result.error);
      } else {
        console.log("Relay quote:", result);
        setQuote(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch quote");
    } finally {
      setLoading(false);
    }
  }, [walletReady, wallet, amount]);

  // ---- Execute all steps from the Relay quote ----
  const executeSwap = useCallback(async () => {
    if (!quote || !walletReady) return;

    setExecuting(true);
    setError(null);

    try {
      const evmWallet = EVMWallet.from(wallet);

      // Iterate through ALL steps (approval, deposit, etc.)
      // For ERC-20 swaps, Relay may return an "approval" step
      // before the "deposit" step to grant the Relay contract permission
      // to spend the user's tokens.
      for (const step of quote.steps) {
        setTxProgress(`Executing step: ${step.action || step.id}...`);

        for (const item of step.items) {
          if (item.status === "incomplete") {
            await evmWallet.sendTransaction({
              to: item.data.to as `0x${string}`,
              data: item.data.data as `0x${string}`,
              value: item.data.value ? BigInt(item.data.value) : 0n,
            });
          }
        }
      }

      // Each step carries the same requestId for the whole quote
      setRequestId(quote.steps[0].requestId!);
      setTxProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxProgress("");
    } finally {
      setExecuting(false);
    }
  }, [quote, walletReady, wallet]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-400 transition hover:text-gray-200"
          >
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold">Swap USDC</h1>
        </div>
        <div className="flex items-center gap-3">
          {loggedIn && <WalletInfo />}
          <AuthButton />
        </div>
      </div>

      <p className="mb-8 text-gray-400">
        Send USDC on Base and receive USDC on Arbitrum using the Relay protocol.
      </p>

      {!loggedIn ? (
        <p className="text-gray-500">Sign in to get started.</p>
      ) : !walletReady ? (
        <p className="text-gray-500">Loading wallet...</p>
      ) : (
        <div className="space-y-6">
          {/* Amount input + get quote */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">
                Amount (USDC on Base)
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={fetchQuote}
              disabled={loading || !amount}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Getting quote..." : "Get Quote"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Quote display */}
          {quote && !requestId && (
            <>
              <QuoteDisplay quote={quote} />
              <button
                onClick={executeSwap}
                disabled={executing}
                className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
              >
                {executing ? txProgress || "Sending transactions..." : "Swap"}
              </button>
            </>
          )}

          {/* Status tracking */}
          {requestId && <StatusTracker requestId={requestId} />}
        </div>
      )}
    </div>
  );
}
