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

function formatAmount(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function Home() {
  const account = useCurrentAccount();
  const userAddress = account?.address ?? "";
  const { selectedGroupId, showAllBills, showMyDebts } = useSidebarStore();

  const useAllBillsQuery = showAllBills || showMyDebts;
  const { data: billsForUser } = api.bill.getBillsForUser.useQuery(
    { userAddress, debtsOnly: showMyDebts },
    { enabled: useAllBillsQuery && !!userAddress },
  );
  const { data: groupBills } = api.bill.getBills.useQuery(
    { groupId: selectedGroupId ?? "", userAddress },
    { enabled: !useAllBillsQuery && !!selectedGroupId },
  );

  const filteredBills = useMemo(() => {
    const list = useAllBillsQuery ? billsForUser ?? [] : groupBills ?? [];
    return list.filter((bill) => bill.group != null);
  }, [useAllBillsQuery, billsForUser, groupBills]);

  const totalDebt = useMemo(() => {
    return filteredBills.reduce(
      (sum, b) => sum + (b.userAmount > 0 ? b.userAmount : 0),
      0,
    );
  }, [filteredBills]);

  const currency =
    filteredBills.length > 0 ? filteredBills[0]!.currency : "USD";
  const title = showMyDebts
    ? "My debts"
    : showAllBills
      ? "All Bills"
      : "Bills";
  const showEmptyState = !showAllBills && !showMyDebts && !selectedGroupId;
  const showPayAll =
    totalDebt > 0 && (showMyDebts || (!!selectedGroupId && !showAllBills));

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset>
        <div className="flex h-full flex-col gap-6 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {showPayAll && (
              <Button size="lg" className="w-full sm:w-auto">
                Pay all {formatAmount(totalDebt, currency)}
              </Button>
            )}
          </div>
          {showEmptyState ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              <p className="text-muted-foreground text-sm">
                Select a group to view bills
              </p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              <p className="text-muted-foreground text-sm">
                {showMyDebts
                  ? "You have no debts"
                  : "No bills in this group yet"}
              </p>
              {!showMyDebts && (
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
              )}
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
