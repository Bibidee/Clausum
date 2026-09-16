"use client";

import { createContext, useContext } from "react";

export interface WalletUiState {
  address: string | null;
  isConnected: boolean;
  openWallet: () => void;
}

const WalletUiContext = createContext<WalletUiState | null>(null);

export function WalletUiProvider({ value, children }: { value: WalletUiState; children: React.ReactNode }) {
  return <WalletUiContext.Provider value={value}>{children}</WalletUiContext.Provider>;
}

export function useWalletUi() {
  return useContext(WalletUiContext) ?? { address: null, isConnected: false, openWallet: () => undefined };
}
