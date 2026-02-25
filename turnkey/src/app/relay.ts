import type { Hex, WalletClient } from "viem";
import type { StepItem } from "./actions/relay";

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
