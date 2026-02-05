"use client";

import dynamic from "next/dynamic";
import { useConnectModalStore } from "@/lib/store/connectModalStore";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";

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

const AuthContext = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const account = useCurrentAccount();
  const authStore = useAuthStore();
  const userAddress = authStore.zkLoginAddress
    ? authStore.zkLoginAddress
    : account?.address
      ? account.address
      : "";

  useEffect(() => {
    if (pathname === "/api" || pathname === "/login") return;

    if (!userAddress || userAddress.length == 0) router.push("/login");
  }, [account, authStore, userAddress, pathname]);

  return <>{children}</>;
};

export function AppKitLayout({ children }: { children: React.ReactNode }) {
  const { isConnectModalOpen } = useConnectModalStore();
  return (
    <DAppKitClientProvider>
      <AuthContext>{children}</AuthContext>
      <ConnectModal open={isConnectModalOpen} />
    </DAppKitClientProvider>
  );
}
