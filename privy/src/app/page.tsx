"use client";

import Link from "next/link";
import { usePrivyWallet } from "./hooks/usePrivyWallet";

export default function HomePage() {
  const { ready, authenticated, address, login, logout } = usePrivyWallet();

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {/* Header */}
      <div className="mb-12 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Privy × Relay</h1>
        {!authenticated ? (
          <button
            onClick={login}
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
              onClick={logout}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="mb-10 text-gray-500">
        Cross-chain bridging and token swapping using Privy wallets and the
        Relay protocol API. Sign in to get started.
      </p>

      {/* Navigation cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <NavCard
          href="/bridge"
          title="Bridge ETH"
          description="Bridge native ETH from Base to Arbitrum"
          disabled={!authenticated}
        />
        <NavCard
          href="/swap"
          title="Swap ETH → USDC"
          description="Swap ETH for USDC on Base"
          disabled={!authenticated}
        />
      </div>
    </div>
  );
}

function NavCard({
  href,
  title,
  description,
  disabled,
}: {
  href: string;
  title: string;
  description: string;
  disabled: boolean;
}) {
  const base = "block rounded-xl border p-6 transition";
  const enabled =
    "border-gray-200 bg-white hover:border-black hover:shadow-sm";
  const disabledStyle =
    "pointer-events-none border-gray-100 bg-gray-50 opacity-50";

  return (
    <Link
      href={href}
      className={`${base} ${disabled ? disabledStyle : enabled}`}
    >
      <h2 className="mb-1 text-lg font-semibold text-black">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
