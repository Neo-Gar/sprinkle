"use client";

import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AuthContext({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const account = useCurrentAccount();
  const authStore = useAuthStore();
  const userAddress = authStore.zkLoginAddress
    ? authStore.zkLoginAddress
    : account?.address
      ? account.address
      : "";

  useEffect(() => {
    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/zklogin")
    )
      return;

    if (!userAddress || userAddress.length == 0)
      window.location.href = "/login";
  }, [account, authStore, userAddress, pathname]);

  return <>{children}</>;
}
