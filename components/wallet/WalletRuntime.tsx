"use client";

import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useEffect } from "react";
import { useFormation } from "../../lib/formation-context";
import type { Eip1193Provider } from "../../lib/genlayer";
import { WalletUiProvider } from "../../lib/wallet-context";
import { ReownProvider } from "./ReownProvider";

function RuntimeInner({ children }: { children: React.ReactNode }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount({ namespace: "eip155" });
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");
  const { setWalletSession } = useFormation();

  useEffect(() => {
    setWalletSession(isConnected && address ? address : null, isConnected && walletProvider ? walletProvider : null);
  }, [address, isConnected, setWalletSession, walletProvider]);

  const openWallet = () => void open({ view: isConnected ? "Account" : "Connect" });
  return <WalletUiProvider value={{ address: address ?? null, isConnected: Boolean(isConnected), openWallet }}>{children}</WalletUiProvider>;
}

export function WalletRuntime({ children }: { children: React.ReactNode }) {
  return <ReownProvider><RuntimeInner>{children}</RuntimeInner></ReownProvider>;
}
