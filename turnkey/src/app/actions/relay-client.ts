import type {
  Hex,
  WalletClient,
  PublicClient,
  Chain,
  Account,
} from "viem";
import type { QuoteResponse, StepItem } from "./relay";
import { submitSignature } from "./relay";

// ── Sign a Relay step item (EIP-191 or EIP-712) ──

export async function signItem(
  walletClient: WalletClient,
  item: StepItem
): Promise<Hex> {
  const sign = item.data.sign!;

  if (sign.signatureKind === "eip191") {
    const message = sign.message!;
    if (/^0x[0-9a-fA-F]{64}$/.test(message)) {
      return walletClient.signMessage({
        account: walletClient.account!,
        message: { raw: message as Hex },
      });
    }
    return walletClient.signMessage({
      account: walletClient.account!,
      message,
    });
  }

  // EIP-712: strip EIP712Domain — viem constructs it from the domain param
  const { EIP712Domain: _, ...types } = sign.types ?? {};

  return walletClient.signTypedData({
    account: walletClient.account!,
    domain: sign.domain as any,
    types,
    primaryType: sign.primaryType!,
    message: sign.value as any,
  });
}

// ── Execute all steps from a Relay quote ──

export interface ExecuteQuoteOptions {
  quote: QuoteResponse;
  account: Account;
  chains: Chain[];
  makeWalletClient: (chain: Chain) => WalletClient;
  makePublicClient: (chain: Chain) => PublicClient;
  onProgress?: (message: string) => void;
}

export async function executeQuote({
  quote,
  account,
  chains,
  makeWalletClient,
  makePublicClient,
  onProgress,
}: ExecuteQuoteOptions): Promise<string | undefined> {
  let lastRequestId: string | undefined;

  for (const step of quote.steps) {
    onProgress?.(`${step.action}...`);

    for (const item of step.items) {
      if (item.status === "complete") continue;

      const chain = resolveChain(item.data.chainId, chains);

      if (step.kind === "signature") {
        const client = makeWalletClient(chain);
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
        const client = makeWalletClient(chain);
        const publicClient = makePublicClient(chain);

        const hash = await client.sendTransaction({
          account,
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

  return lastRequestId;
}

function resolveChain(chainId: number | undefined, chains: Chain[]): Chain {
  if (chainId != null) {
    const found = chains.find((c) => c.id === chainId);
    if (found) return found;
  }
  return chains[0];
}
