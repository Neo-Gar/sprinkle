"use client";

import dynamic from "next/dynamic";
import { useConnectModalStore } from "@/lib/store/connectModalStore";

const DAppKitClientProvider = dynamic(
  () =>
    import("@/context/DAppKitClientProvider").then(
      (mod) => mod.DAppKitClientProvider,
    ),
  { ssr: false },
);
const ConnectModal = dynamic(
  () =>
    import("@/context/DAppKitClientProvider").then((mod) => mod.ConnectModal),
  { ssr: false, loading: () => <button disabled>Loading...</button> },
);

export function AppKitLayout({ children }: { children: React.ReactNode }) {
  const { isConnectModalOpen } = useConnectModalStore();
  return (
    <DAppKitClientProvider>
      {children}
      <ConnectModal open={isConnectModalOpen} />
    </DAppKitClientProvider>
  );
}
