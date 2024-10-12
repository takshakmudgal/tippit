import type {
  IUnifiedWalletConfig,
  IWalletNotification,
} from "@jup-ag/wallet-adapter/dist/types/contexts/WalletConnectionProvider";
import { ToastNotification } from "../common/ToastNotificationDisplay";

const infoToast = new ToastNotification("wallet-notification-info");
const toast = new ToastNotification("wallet-notification");

export const WalletNotification: IUnifiedWalletConfig["notificationCallback"] =
  {
    onConnect: async (props: IWalletNotification) => {
      infoToast.remove();
      try {
        const response = await fetch("/api/v1/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ wallet: props.publicKey }),
        });
        if (response.ok) {
          const user = await response.json();
          toast.success(`Wallet Connected - ${props.shortAddress}`);
        } else {
          throw new Error("Failed to create/retrieve user");
        }
      } catch (error) {
        console.error("Error creating/retrieving user:", error);
        toast.error("Failed to initialize user. Please try again.");
      }
    },
    onConnecting: (props: IWalletNotification) => {
      infoToast.info(`Connecting to ${props.walletName}`);
    },
    onDisconnect: (props: IWalletNotification) => {
      infoToast.info(`Disconnected from ${props.walletName}`);
    },
    onNotInstalled: (props: IWalletNotification) => {
      infoToast.remove();
      toast.error(`${props.walletName} Wallet is not installed`);
    },
  };
