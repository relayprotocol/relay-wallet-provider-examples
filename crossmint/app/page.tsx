"use client";

import Link from "next/link";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import { AuthButton } from "./components/AuthButton";
import { WalletInfo } from "./components/WalletInfo";

export default function HomePage() {
  const { status } = useAuth();
  const loggedIn = status === "logged-in";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {/* Header */}
      <div className="mb-12 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Crossmint &times; Relay</h1>
        <div className="flex items-center gap-3">
          {loggedIn && <WalletInfo />}
          <AuthButton />
        </div>
      </div>

      {/* Description */}
      <p className="mb-10 text-gray-400">
        Cross-chain bridging and token swapping using Crossmint smart wallets
        and the Relay protocol API. Sign in to get started.
      </p>

      {/* Navigation cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <NavCard
          href="/bridge"
          title="Bridge ETH"
          description="Bridge native ETH from Base to Arbitrum"
          disabled={!loggedIn}
        />
        <NavCard
          href="/swap"
          title="Swap USDC"
          description="Swap USDC from Base to USDC on Arbitrum"
          disabled={!loggedIn}
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
  const base =
    "block rounded-xl border p-6 transition";
  const enabled =
    "border-gray-700 bg-gray-800/60 hover:border-blue-500 hover:bg-gray-800";
  const disabledStyle =
    "pointer-events-none border-gray-800 bg-gray-900/40 opacity-50";

  return (
    <Link href={href} className={`${base} ${disabled ? disabledStyle : enabled}`}>
      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  );
}
