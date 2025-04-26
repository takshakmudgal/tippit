"use client";

import { ToastNotificationDisplay } from "@/components/common/ToastNotificationDisplay";
import React from "react";
import { WalletProvider } from "./WalletProvider";
import { HeroUIProvider } from "@heroui/react";

type Providers = React.ComponentProps<"div">;

export function Providers({ children }: Providers) {
  return (
    <HeroUIProvider>
      <WalletProvider>
        {children}
        <ToastNotificationDisplay />
      </WalletProvider>
    </HeroUIProvider>
  );
}
