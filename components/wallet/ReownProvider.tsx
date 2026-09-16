"use client";

import { AppKitProvider } from "@reown/appkit/react";
import { defineChain } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "c0f4c1c65e2f50c49e3e91a3f9b97dfa";
const studioDevRpc = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio-dev.genlayer.com/api";
const studioDevExplorer = "https://explorer-studio-dev.genlayer.com";

export const studioDevAppKitNetwork = defineChain({
  id: 61997,
  caipNetworkId: "eip155:61997",
  chainNamespace: "eip155",
  name: "GenLayer Studio-dev",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: { default: { http: [studioDevRpc] }, public: { http: [studioDevRpc] } },
  blockExplorers: { default: { name: "Studio-dev Explorer", url: studioDevExplorer } },
  testnet: true,
});

const networks: [typeof studioDevAppKitNetwork, ...typeof studioDevAppKitNetwork[]] = [studioDevAppKitNetwork];
const customRpcUrls = { "eip155:61997": [{ url: studioDevRpc }] };
const wagmiAdapter = new WagmiAdapter({ networks, projectId, ssr: true, customRpcUrls });
const queryClient = new QueryClient();
const metadata = {
  name: "CLAUSUM",
  description: "Semantic agreement formation before commitment.",
  url: "https://clausum.vercel.app",
  icons: ["https://clausum.vercel.app/favicon.svg"],
};

export function ReownProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider
          adapters={[wagmiAdapter]}
          networks={networks}
          projectId={projectId}
          defaultNetwork={studioDevAppKitNetwork}
          customRpcUrls={customRpcUrls}
          metadata={metadata}
          features={{ analytics: false }}
        >
          {children}
        </AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
