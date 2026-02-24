"use client";

import { useWallet } from "@crossmint/client-sdk-react-ui";

export function WalletInfo() {
  const { wallet, status } = useWallet();

  if (status === "error") {
    return (
      <p className="text-sm text-red-400">Failed to load wallet.</p>
    );
  }

  if (status !== "loaded" || !wallet) {
    return (
      <p className="text-sm text-gray-400">Loading wallet...</p>
    );
  }

  const address = wallet.address;
  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm">
      <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
      <span className="font-mono text-gray-300">{truncated}</span>
      <span className="text-gray-500">· Base</span>
    </div>
  );
}
