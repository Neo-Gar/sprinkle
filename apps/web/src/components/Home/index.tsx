"use client";

import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { SidebarProvider } from "../ui/sidebar";
import MainSidebar from "../MainSidebar";

export default function Home() {
  const account = useCurrentAccount();
  return (
    <SidebarProvider>
      <MainSidebar />
      <main>
        <div>Hello sprinkle!</div>
        {account && <div>Account: {account.address}</div>}
      </main>
    </SidebarProvider>
  );
}
