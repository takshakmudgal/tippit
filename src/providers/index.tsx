"use client";

import { ToastNotificationDisplay } from "@/components/common/ToastNotificationDisplay";
import React from "react";
import { WalletProvider } from "./WalletProvider";

type Providers = React.ComponentProps<"div">;

export function Providers({ children }: Providers) {
  return (
    <WalletProvider>
      {children}
      <ToastNotificationDisplay />
    </WalletProvider>
  );
}
