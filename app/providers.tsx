"use client";

import { type ReactNode } from "react";
import { base } from "wagmi/chains";
import { ReactNode } from "react";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { WagmiConfig, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";

export function Providers({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "development") {
    // Use wagmi with public Base RPC for dev (CORS-friendly)
    const config = createConfig({
      chains: [base],
      transports: {
        [base.id]: http("https://mainnet.base.org"),
      },
    });
    return <WagmiConfig config={config}>{children}</WagmiConfig>;
  }

  // Production: use MiniKitProvider with OnchainKit API key
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: "auto",
          theme: "mini-app-theme",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
    >
      {children}
    </MiniKitProvider>
  );
}

}
