"use client";

import { usePrivy, useWallets, type ConnectedWallet } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  type Account,
  type Chain,
  type WalletClient,
} from "viem";

type PrivyProvider = Awaited<ReturnType<ConnectedWallet["getEthereumProvider"]>>;

export function usePrivyWallet() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // Cache the EIP-1193 provider from the active Privy wallet so we can
  // create viem WalletClients for arbitrary chains.
  const [provider, setProvider] = useState<PrivyProvider | null>(null);

  // Use the first connected wallet — works for both injected (MetaMask) and
  // embedded Privy wallets without depending on wagmi connector state.
  const activeWallet = wallets[0] ?? null;
  const address = activeWallet?.address as `0x${string}` | undefined;

  useEffect(() => {
    if (activeWallet) {
      activeWallet.getEthereumProvider().then(setProvider);
    } else {
      setProvider(null);
    }
  }, [activeWallet]);

  const viemAccount: Account | undefined = address
    ? { address, type: "json-rpc" }
    : undefined;

  const walletReady = !!viemAccount && !!provider;

  async function makeWalletClient(chain: Chain): Promise<WalletClient> {
    // Switch the external wallet (e.g. MetaMask) to the target chain before
    // constructing the viem client — otherwise sendTransaction will fail
    // with a chain mismatch error.
    if (activeWallet) {
      await activeWallet.switchChain(chain.id);
    }
    return createWalletClient({
      account: viemAccount!,
      chain,
      transport: custom(provider! as Parameters<typeof custom>[0]),
    });
  }

  function makePublicClient(chain: Chain) {
    return createPublicClient({ chain, transport: http() });
  }

  return {
    ready,
    authenticated,
    address,
    viemAccount,
    walletReady,
    login,
    logout,
    makeWalletClient,
    makePublicClient,
  };
}
