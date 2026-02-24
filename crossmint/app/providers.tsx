"use client";

import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CrossmintProvider
      apiKey={process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY!}
    >
      <CrossmintAuthProvider>
        {/* Creates an EVM smart wallet on Base when the user logs in.
            Email signer means the user authenticates via email (no browser extension needed). */}
        <CrossmintWalletProvider
          createOnLogin={{
            chain: "base",
            signer: { type: "email" },
          }}
        >
          {children}
        </CrossmintWalletProvider>
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}
