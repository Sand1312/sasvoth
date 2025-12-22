"use client";

import { FullPageLoader } from "./FullPageLoader";
import { useAuth } from "@/hooks/useAuth";

/**
 * Global wallet connection overlay.
 * Add this to your root layout to show full-page loading during wallet connect.
 */
export function WalletConnectOverlay() {
  const { isConnectingWallet } = useAuth();

  return (
    <FullPageLoader
      isVisible={isConnectingWallet}
      title="Connecting Wallet"
      subtitle="Please check your wallet for a signature request..."
    />
  );
}
