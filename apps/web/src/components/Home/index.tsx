"use client";

import { useMemo } from "react";
import { SidebarProvider, SidebarInset } from "../ui/sidebar";
import MainSidebar from "../MainSidebar";
import BillCard from "../BillCard";
import type { Bill } from "@/lib/types/bill";
import type { Group } from "@/lib/types/group";
import { useSidebarStore } from "@/lib/store/sidebarStore";

const MOCK_GROUP_APARTMENT: Group = {
  id: "1",
  name: "Apartment",
  iconId: "home",
  membersCount: 3,
  inviteLink: "",
};

const MOCK_GROUP_TRIP: Group = {
  id: "2",
  name: "Trip",
  iconId: "pizza",
  membersCount: 5,
  inviteLink: "",
};

const MOCK_GROUP_OFFICE: Group = {
  id: "3",
  name: "Office",
  iconId: "coffee",
  membersCount: 8,
  inviteLink: "",
};

const MOCK_BILLS: Bill[] = [
  {
    id: "b1",
    group: MOCK_GROUP_APARTMENT,
    description: "Groceries and utilities for March",
    totalAmount: 320,
    userAmount: 107,
    currency: "USD",
  },
  {
    id: "b2",
    group: MOCK_GROUP_TRIP,
    description: "Dinner at the restaurant",
    totalAmount: 85,
    userAmount: 0,
    currency: "USD",
  },
  {
    id: "b3",
    group: MOCK_GROUP_OFFICE,
    description: "Office supplies - you paid for everyone",
    totalAmount: 150,
    userAmount: -120,
    currency: "USD",
  },
];

export default function Home() {
  const { selectedGroupId, showAllBills } = useSidebarStore();

  const filteredBills = useMemo(() => {
    if (showAllBills) {
      return MOCK_BILLS;
    }
    if (selectedGroupId) {
      return MOCK_BILLS.filter((bill) => bill.group.id === selectedGroupId);
    }
    return [];
  }, [selectedGroupId, showAllBills]);

  const title = showAllBills ? "All Bills" : "Bills";
  const showEmptyState = !showAllBills && !selectedGroupId;

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset>
        <div className="flex h-full flex-col gap-6 p-6">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {showEmptyState ? (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Select a group to view bills
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {filteredBills.map((bill) => (
                <BillCard key={bill.id} bill={bill} />
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
