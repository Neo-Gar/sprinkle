"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGroupIcon } from "@/lib/groupIcons";
import type { Bill } from "@/lib/types/bill";
import { cn } from "@/lib/utils";

type BillCardProps = {
  bill: Bill;
  className?: string;
};

function formatAmount(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function BillCard({ bill, className }: BillCardProps) {
  const GroupIcon = getGroupIcon(bill.group.iconId);

  // Determine state: owes (positive), gets back (negative), or settled (zero)
  const owesUser = bill.userAmount < 0; // They owe user
  const userOwes = bill.userAmount > 0; // User owes them
  const isSettled = bill.userAmount === 0; // Settled up

  const label = owesUser
    ? "You get back"
    : userOwes
      ? "You owe"
      : "Settled up";

  const amountDisplay = owesUser
    ? `+${formatAmount(Math.abs(bill.userAmount), bill.currency)}`
    : formatAmount(bill.userAmount, bill.currency);

  const amountColor = cn(
    "text-3xl font-bold tabular-nums tracking-tight",
    owesUser && "text-green-600 dark:text-green-500",
    userOwes && "text-red-600 dark:text-red-400",
    isSettled && "text-foreground",
  );

  return (
    <Link href={`/bill/${bill.id}`} className="block">
      <Card
        className={cn(
          "w-full max-w-md transition-colors hover:bg-muted/50 cursor-pointer",
          className,
        )}
      >
        <CardHeader className="gap-1 pb-2">
        <div className="flex items-center gap-2">
          <GroupIcon className="size-5 text-muted-foreground shrink-0" />
          <CardTitle className="text-base font-medium truncate">
            {bill.group.name}
          </CardTitle>
        </div>
        <CardDescription className="line-clamp-2">
          {bill.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="text-muted-foreground text-sm">
          Total: {formatAmount(bill.totalAmount, bill.currency)}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm">{label}</span>
          <span className={amountColor}>{amountDisplay}</span>
        </div>
      </CardContent>
      </Card>
    </Link>
  );
}
