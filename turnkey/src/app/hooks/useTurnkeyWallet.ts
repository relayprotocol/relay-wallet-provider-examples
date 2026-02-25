"use client";

import { useTurnkey } from "@turnkey/react-wallet-kit";
import { createAccount } from "@turnkey/viem";
import { useEffect, useState } from "react";
import {
  createWalletClient,
  createPublicClient,
  http,
  type Account,
  type WalletClient,
  type Chain,
} from "viem";

export function useTurnkeyWallet() {
  const {
    httpClient,
    session,
    fetchWalletAccounts,
    wallets,
    handleLogin,
    logout,
  } = useTurnkey();

  const [address, setAddress] = useState<string>();
  const [viemAccount, setViemAccount] = useState<Account>();
  const [hadSession, setHadSession] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Track session lifecycle: detect when a session we had goes away
  useEffect(() => {
    if (session) {
      setHadSession(true);
      setSessionExpired(false);
    } else if (hadSession) {
      setSessionExpired(true);
    }
  }, [session, hadSession]);

  useEffect(() => {
    if (!session || wallets.length === 0 || !httpClient) {
      setAddress(undefined);
      setViemAccount(undefined);
      return;
    }

    (async () => {
      try {
        const accounts = await fetchWalletAccounts({ wallet: wallets[0] });
        const ethAccount = accounts[0];
        setAddress(ethAccount.address);

        const turnkeyAccount = await createAccount({
          client: httpClient,
          organizationId: ethAccount.organizationId,
          signWith: ethAccount.address,
          ethereumAddress: ethAccount.address,
        });

        setViemAccount(turnkeyAccount as Account);
      } catch (e) {
        console.error("Failed to load wallet:", e);
        setAddress(undefined);
        setViemAccount(undefined);
      }
    })();
  }, [wallets, session, httpClient]);

  function makeWalletClient(chain: Chain): WalletClient {
    return createWalletClient({
      account: viemAccount!,
      chain,
      transport: http(),
    });
  }

  function makePublicClient(chain: Chain) {
    return createPublicClient({ chain, transport: http() });
  }

  return {
    session,
    address,
    viemAccount,
    sessionExpired,
    handleLogin,
    logout: () => {
      setHadSession(false);
      setSessionExpired(false);
      logout();
    },
    makeWalletClient,
    makePublicClient,
  };
}
