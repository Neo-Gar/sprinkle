"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { SidebarProvider, SidebarInset } from "../ui/sidebar";
import MainSidebar from "../MainSidebar";
import BillCard from "../BillCard";
import { Button } from "../ui/button";
import type { Bill } from "@/lib/types/bill";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { api } from "@/trpc/react";

export default function Home() {
  const account = useCurrentAccount();
  const { selectedGroupId, showAllBills } = useSidebarStore();
  const { data: bills } = api.bill.getBills.useQuery({
    groupId: selectedGroupId ?? "",
    userAddress: account?.address ?? "",
  });

  const filteredBills = useMemo(() => {
    if (!bills) return [];
    const withGroup = bills.filter((bill) => bill.group != null);
    if (showAllBills) return withGroup;
    if (selectedGroupId) {
      return withGroup.filter((bill) => bill.groupId === selectedGroupId);
    }
    return [];
  }, [selectedGroupId, showAllBills, bills]);

  const title = showAllBills ? "All Bills" : "Bills";
  const showEmptyState = !showAllBills && !selectedGroupId;

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset>
        <div className="flex h-full flex-col gap-6 p-6">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {showEmptyState ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              <p className="text-muted-foreground text-sm">
                Select a group to view bills
              </p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              <p className="text-muted-foreground text-sm">
                No bills in this group yet
              </p>
              <Button asChild>
                <Link
                  href={
                    selectedGroupId
                      ? `/bill/new?group=${selectedGroupId}`
                      : "/bill/new"
                  }
                >
                  Create bill
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {filteredBills.map((bill) => (
                <BillCard key={bill.id} bill={bill as Bill} />
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
