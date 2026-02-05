"use client";

import { useParams } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { api } from "@/trpc/react";
import { getGroupIcon } from "@/lib/groupIcons";
import { formatAddress } from "@mysten/sui/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";

function formatAmount(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function BillDetailsPage() {
  const params = useParams();
  const billId = params.billId as string;
  const account = useCurrentAccount();
  const authStore = useAuthStore();
  const userAddress = authStore.zkLoginAddress
    ? authStore.zkLoginAddress
    : account?.address
      ? account.address
      : "";

  const {
    data: bill,
    isLoading,
    error,
  } = api.bill.getBill.useQuery(
    { id: billId, userAddress },
    { enabled: !!billId },
  );

  if (!billId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="text-muted-foreground size-12" />
        <h1 className="text-xl font-semibold">Bill not found</h1>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <Loader2 className="text-muted-foreground size-12 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading bill...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="text-destructive size-12" />
        <h1 className="text-xl font-semibold">Bill not found</h1>
        <p className="text-muted-foreground text-center text-sm">
          This bill may have been deleted or the link is invalid.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  const GroupIcon = bill.group ? getGroupIcon(bill.group.iconId) : Receipt;
  const splits = bill.splits ?? {};
  const splitEntries = Object.entries(splits).filter(
    ([, amount]) => amount > 0,
  );
  const payerLabel =
    bill.payerAddress === userAddress
      ? "You"
      : formatAddress(bill.payerAddress);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
              <GroupIcon className="text-muted-foreground size-5" />
            </div>
            <div className="min-w-0 flex-1">
              {bill.group && (
                <p className="text-muted-foreground truncate text-sm">
                  {bill.group.name}
                </p>
              )}
              <CardTitle className="truncate">{bill.description}</CardTitle>
            </div>
          </div>
          <CardDescription className="text-base">
            Total: {formatAmount(bill.totalAmount, bill.currency)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-500" />
              Paid the bill
            </h3>
            <div className="bg-muted/30 rounded-lg border px-3 py-2">
              <span className="font-medium">{payerLabel}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Receipt className="size-4" />
              Who owes what
            </h3>
            {splitEntries.length === 0 ? (
              <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm">
                No split (payer covered the full amount)
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {splitEntries.map(([addr, amount]) => (
                  <li
                    key={addr}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2",
                      addr === userAddress && "border-primary/30 bg-primary/5",
                    )}
                  >
                    <span className="font-mono text-sm">
                      {addr === userAddress ? "You" : formatAddress(addr)}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatAmount(amount, bill.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-4 pt-2">
            {bill.userAmount > 0 && (
              <Button className="w-full" size="lg">
                Pay {formatAmount(bill.userAmount, bill.currency)}
              </Button>
            )}
            <div className="flex gap-4">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Back to bills</Link>
              </Button>
              {bill.transactionDigest && (
                <Button asChild variant="secondary" className="flex-1">
                  <Link
                    href={`https://suiscan.xyz/testnet/tx/${bill.transactionDigest}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <ExternalLink className="size-4" />
                    Transaction link
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
