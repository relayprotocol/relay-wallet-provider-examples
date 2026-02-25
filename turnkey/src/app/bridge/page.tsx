"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { parseEther, type Hex } from "viem";
import { base, arbitrum } from "viem/chains";
import { useBalance } from "wagmi";
import { useTurnkeyWallet } from "../hooks/useTurnkeyWallet";
import {
  getQuote,
  submitSignature,
  type QuoteResponse,
} from "../actions/relay";
import { signItem } from "../relay";
import { QuoteDisplay } from "../components/QuoteDisplay";
import { StatusTracker } from "../components/StatusTracker";
import { SessionExpiredBanner } from "../components/SessionExpiredBanner";

// ── Constants ──

const ORIGIN_CHAIN = base;
const DEST_CHAIN = arbitrum;
const NATIVE = "0x0000000000000000000000000000000000000000";

export default function BridgePage() {
  const {
    session,
    address,
    viemAccount,
    sessionExpired,
    handleLogin,
    logout,
    makeWalletClient,
    makePublicClient,
  } = useTurnkeyWallet();

  const [amount, setAmount] = useState("0.001");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletReady = !!viemAccount && !!address;

  const balance = useBalance({
    address: address as `0x${string}`,
    chainId: ORIGIN_CHAIN.id,
    query: { enabled: walletReady },
  });

  // ── Fetch quote ──

  const fetchQuote = useCallback(async () => {
    if (!walletReady) return;

    setLoading(true);
    setError(null);
    setQuote(null);
    setRequestId(null);

    try {
      const result = await getQuote({
        user: address,
        originChainId: ORIGIN_CHAIN.id,
        destinationChainId: DEST_CHAIN.id,
        originCurrency: NATIVE,
        destinationCurrency: NATIVE,
        amount: parseEther(amount).toString(),
        tradeType: "EXACT_INPUT",
      });
      setQuote(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch quote");
    } finally {
      setLoading(false);
    }
  }, [walletReady, address, amount]);

  // ── Execute bridge ──

  const executeBridge = useCallback(async () => {
    if (!quote || !viemAccount) return;

    setExecuting(true);
    setError(null);
    let lastRequestId: string | undefined;

    try {
      for (const step of quote.steps) {
        for (const item of step.items) {
          if (item.status === "complete") continue;

          if (step.kind === "signature") {
            const client = makeWalletClient(ORIGIN_CHAIN);
            const signature = await signItem(client, item);

            if (item.data.post) {
              await submitSignature(
                item.data.post.endpoint,
                signature,
                item.data.post.body
              );
            }

            lastRequestId =
              (item.data.post?.body?.requestId as string) ??
              step.requestId ??
              lastRequestId;
          } else if (step.kind === "transaction") {
            const chain =
              item.data.chainId === DEST_CHAIN.id ? DEST_CHAIN : ORIGIN_CHAIN;
            const client = makeWalletClient(chain);
            const publicClient = makePublicClient(chain);

            const hash = await client.sendTransaction({
              account: viemAccount,
              chain,
              to: item.data.to as Hex,
              data: (item.data.data as Hex) ?? "0x",
              value: item.data.value ? BigInt(item.data.value) : 0n,
            });

            await publicClient.waitForTransactionReceipt({ hash });
            lastRequestId = step.requestId ?? lastRequestId;
          }
        }
      }

      if (lastRequestId) {
        setRequestId(lastRequestId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setExecuting(false);
    }
  }, [quote, viemAccount, makeWalletClient, makePublicClient]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 transition hover:text-black">
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold text-black">Bridge ETH</h1>
        </div>
        {!session ? (
          <button
            onClick={() => handleLogin()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Sign In
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {address && (
              <span className="text-xs text-gray-400 font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            )}
            <button
              onClick={() => logout()}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {sessionExpired && <SessionExpiredBanner onLogin={() => handleLogin()} />}

      <p className="mb-8 text-gray-500">
        Send ETH on Base and receive ETH on Arbitrum using the Relay protocol.
      </p>

      {!session ? (
        <p className="text-gray-400">Sign in to get started.</p>
      ) : !walletReady ? (
        <p className="text-gray-400">Loading wallet...</p>
      ) : (
        <div className="space-y-6">
          {/* Amount input + get quote */}
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs text-gray-500">
                  Amount (ETH on Base)
                </label>
                {balance.data && (
                  <span className="text-xs text-gray-400">
                    Balance: {parseFloat(balance.data.formatted).toFixed(6)} {balance.data.symbol}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.001"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-black"
              />
            </div>
            <button
              onClick={fetchQuote}
              disabled={loading || !amount}
              className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Getting quote..." : "Get Quote"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Quote display */}
          {quote && !requestId && (
            <>
              <QuoteDisplay quote={quote} />
              <button
                onClick={executeBridge}
                disabled={executing}
                className="w-full rounded-lg bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {executing ? "Sending transaction..." : "Bridge"}
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
