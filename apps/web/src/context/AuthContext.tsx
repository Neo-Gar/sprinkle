"use client";

import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";

export function AuthContext({ children }: { children: React.ReactNode }) {
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
}
