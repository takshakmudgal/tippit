import { WalletNotification } from "@/components/wallet/WalletNotification";
import { Adapter } from "@jup-ag/wallet-adapter";
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import React, { useMemo } from "react";
import { useWrappedReownAdapter } from "@jup-ag/jup-mobile-adapter";

type WalletProvider = React.ComponentProps<"div">;

export function WalletProvider({ children }: WalletProvider) {
  const { reownAdapter, jupiterAdapter } = useWrappedReownAdapter({
    appKitOptions: {
      metadata: {
        name: "tippit",
        description: "Tipping Jar for the Web3 community.",
        url: "http://localhost:3000/",
        icons: ["https://assets.reown.com/reown-profile-pic.png"],
      },
      projectId: "13417c671b602fb8f3273cdbd94e09c6",
      features: {
        analytics: false,
        socials: ["google", "x", "apple"],
        email: false,
      },
      enableWallets: false,
    },
  });
  const wallets: Adapter[] = useMemo(() => {
    return [reownAdapter, jupiterAdapter].filter(
      (item) => item && item.name && item.icon
    ) as Adapter[];
  }, [reownAdapter, jupiterAdapter]);
  return (
    <UnifiedWalletProvider
      wallets={wallets}
      config={{
        autoConnect: false,
        env: "devnet",
        metadata: {
          name: "UnifiedWallet",
          description: "UnifiedWallet",
          url: "https://jup.ag",
          iconUrls: ["https://jup.ag/favicon.ico"],
        },
        notificationCallback: WalletNotification,
        walletlistExplanation: {
          href: "https://station.jup.ag/docs/additional-topics/wallet-list",
        },
        theme: "dark",
      }}
    >
      {children}
    </UnifiedWalletProvider>
  );
}
