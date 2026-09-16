"use client";

import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider } from "@reown/appkit/react";
import { useCallback, useEffect } from "react";
import { useFormation } from "../../lib/formation-context";
import type { Eip1193Provider } from "../../lib/genlayer";
import { WalletUiProvider } from "../../lib/wallet-context";
import { ReownProvider, studioDevAppKitNetwork } from "./ReownProvider";

function RuntimeInner({ children }: { children: React.ReactNode }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount({ namespace: "eip155" });
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");
  const { setWalletSession, setWalletNetworkSwitcher } = useFormation();

  const ensureAppKitStudioDev = useCallback(async () => {
    if (Number(chainId) !== studioDevAppKitNetwork.id) {
      await switchNetwork(studioDevAppKitNetwork);
    }
  }, [chainId, switchNetwork]);

  useEffect(() => {
    setWalletSession(isConnected && address ? address : null, isConnected && walletProvider ? walletProvider : null);
  }, [address, chainId, isConnected, setWalletSession, walletProvider]);

  useEffect(() => {
    setWalletNetworkSwitcher(isConnected && walletProvider ? ensureAppKitStudioDev : null);
    return () => setWalletNetworkSwitcher(null);
  }, [ensureAppKitStudioDev, isConnected, setWalletNetworkSwitcher, walletProvider]);

  const openWallet = () => void open({ view: isConnected ? "Account" : "Connect" });
  return <WalletUiProvider value={{ address: address ?? null, isConnected: Boolean(isConnected), openWallet }}>{children}</WalletUiProvider>;
}

export function WalletRuntime({ children }: { children: React.ReactNode }) {
  return <ReownProvider><RuntimeInner>{children}</RuntimeInner></ReownProvider>;
}
