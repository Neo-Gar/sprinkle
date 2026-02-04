"use client";

import {
  DAppKitProvider,
  ConnectButton,
  ConnectModal,
} from "@mysten/dapp-kit-react";
import { dAppKit } from "@/lib/dapp-kit";

export function DAppKitClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DAppKitProvider dAppKit={dAppKit}>{children}</DAppKitProvider>;
}

export { ConnectButton, ConnectModal };
