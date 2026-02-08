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
import { useAuthStore } from "@/lib/store/authStore";

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
  const authStore = useAuthStore();
  const userAddress = authStore.zkLoginAddress
    ? authStore.zkLoginAddress
    : account?.address
      ? account.address
      : "";

  const { selectedGroupId, showAllBills, showMyDebts } = useSidebarStore();

  const useAllBillsQuery = showAllBills || showMyDebts;
  const { data: billsForUser } = api.bill.getBillsForUser.useQuery(
    { userAddress },
    { enabled: useAllBillsQuery && !!userAddress },
  );
  const { data: groupBills } = api.bill.getBills.useQuery(
    { groupId: selectedGroupId ?? "", userAddress },
    { enabled: !useAllBillsQuery && !!selectedGroupId },
  );

  const { data: userDebts } = api.bill.getDebtsForUser.useQuery(
    { userAddress },
    { enabled: !!userAddress },
  );

  const filteredBills = useMemo(() => {
    const list = useAllBillsQuery
      ? billsForUser
        ? showMyDebts
          ? billsForUser.filter((bill) =>
              userDebts?.some((debt) => debt.billId === bill.id),
            )
          : billsForUser
        : []
      : (groupBills ?? []);
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
  const title = showMyDebts ? "My debts" : showAllBills ? "All Bills" : "Bills";
  const showEmptyState = !showAllBills && !showMyDebts && !selectedGroupId;
  const showPayAll =
    totalDebt > 0 && (showMyDebts || (!!selectedGroupId && !showAllBills));

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="relative">
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredBills.map((bill) => (
                <BillCard key={bill.id} bill={bill as Bill} />
              ))}
            </div>
          )}
        </div>
        {showPayAll && (
          <div className="absolute right-0 bottom-0 left-0 flex justify-center pb-6">
            <Button size="lg">
              Pay all {formatAmount(totalDebt, currency)}
            </Button>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
