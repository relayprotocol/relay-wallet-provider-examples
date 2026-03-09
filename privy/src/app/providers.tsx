"use client";

import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { http } from "viem";
import { mainnet, optimism, polygon, base, arbitrum } from "wagmi/chains";

const privyConfig: PrivyClientConfig = {
  loginMethods: ["wallet", "email"],
  appearance: {
    showWalletLoginFirst: true,
    walletChainType: "ethereum-only",
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
};

const wagmiConfig = createConfig({
  chains: [mainnet, optimism, polygon, base, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
});

const queryClient = new QueryClient();

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function Providers({ children }: { children: React.ReactNode }) {
  // PrivyProvider validates the app ID on mount and throws during SSR/prerender
  // if it's missing. Gate on client-side mount to avoid build errors.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (!privyAppId) {
    return (
      <div style={{ padding: 32, fontFamily: "monospace" }}>
        <p>
          <strong>NEXT_PUBLIC_PRIVY_APP_ID</strong> is not set.
        </p>
        <p>
          Copy <code>.env.local.example</code> to <code>.env.local</code> and
          add your Privy app ID, then restart the dev server.
        </p>
      </div>
    );
  }

  return (
    <PrivyProvider appId={privyAppId} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
