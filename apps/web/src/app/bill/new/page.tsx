"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { api } from "@/trpc/react";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { getGroupIcon } from "@/lib/groupIcons";
import { formatAddress } from "@mysten/sui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { useSui } from "@/hooks/useSui";
import { nanoid } from "nanoid";

type SplitMode = "percent" | "amount";

type MemberSplit = {
  mode: SplitMode;
  value: number;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function NewBillPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const account = useCurrentAccount();
  const authStore = useAuthStore();
  const userAddress = authStore.zkLoginAddress
    ? authStore.zkLoginAddress
    : account?.address
      ? account.address
      : "";
  const { createBill: createSuiBill } = useSui({
    provider: authStore.zkLoginAddress ? "zklogin" : "wallet",
  });
  const utils = api.useUtils();
  const setSelectedGroupId = useSidebarStore((s) => s.setSelectedGroupId);
  const setShowAllBills = useSidebarStore((s) => s.setShowAllBills);

  const preselectedGroupId = searchParams.get("group") ?? "";

  const { data: groups, isLoading: groupsLoading } =
    api.group.getUserGroups.useQuery(
      { address: userAddress },
      { enabled: !!userAddress },
    );

  const [groupId, setGroupId] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [payerAddress, setPayerAddress] = useState("");
  const [splits, setSplits] = useState<Record<string, MemberSplit>>({});
  const [addMemberSelect, setAddMemberSelect] = useState("");

  type GroupItem = {
    id: string;
    name: string;
    iconId: string;
    members?: string[];
  };
  const groupList = (groups ?? []) as unknown as GroupItem[];

  const selectedGroup = useMemo(
    () => groupList.find((g) => g.id === groupId),
    [groupList, groupId],
  );

  const members: string[] = useMemo(
    () => selectedGroup?.members ?? [],
    [selectedGroup],
  );

  const nonPayerMembers = useMemo(
    () => members.filter((m) => m !== payerAddress),
    [members, payerAddress],
  );

  const addedMemberAddresses = useMemo(
    () => Object.keys(splits).filter((addr) => nonPayerMembers.includes(addr)),
    [splits, nonPayerMembers],
  );

  const availableToAdd = useMemo(
    () => nonPayerMembers.filter((addr) => !splits[addr]),
    [nonPayerMembers, splits],
  );

  useEffect(() => {
    if (
      preselectedGroupId &&
      groupList.some((g) => g.id === preselectedGroupId)
    ) {
      setGroupId(preselectedGroupId);
    }
  }, [preselectedGroupId, groupList]);

  useEffect(() => {
    if (userAddress && members.includes(userAddress)) {
      setPayerAddress(userAddress);
    } else if (members[0]) {
      setPayerAddress(members[0]);
    }
  }, [userAddress, members]);

  useEffect(() => {
    if (members.length === 0) return;
    setAddMemberSelect("");
    setSplits((prev) => {
      const next = { ...prev };
      for (const addr of Object.keys(next)) {
        if (!nonPayerMembers.includes(addr)) delete next[addr];
      }
      return next;
    });
  }, [groupId, payerAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSplit = useCallback(
    (address: string, mode: SplitMode, value: number) => {
      setSplits((prev) => ({ ...prev, [address]: { mode, value } }));
    },
    [],
  );

  const addMember = useCallback((address: string) => {
    setSplits((prev) => ({ ...prev, [address]: { mode: "amount", value: 0 } }));
    setAddMemberSelect("");
  }, []);

  const removeMember = useCallback((address: string) => {
    setSplits((prev) => {
      const next = { ...prev };
      delete next[address];
      return next;
    });
  }, []);

  const computedAmounts = useMemo(() => {
    const total = parseFloat(totalAmount) || 0;
    const result: Record<string, number> = {};
    for (const addr of addedMemberAddresses) {
      const s = splits[addr];
      if (!s) continue;
      if (s.mode === "percent") {
        result[addr] = round2((total * s.value) / 100);
      } else {
        result[addr] = round2(s.value);
      }
    }
    return result;
  }, [addedMemberAddresses, splits, totalAmount]);

  const sumSplits = useMemo(
    () => round2(Object.values(computedAmounts).reduce((a, b) => a + b, 0)),
    [computedAmounts],
  );

  const totalNum = parseFloat(totalAmount) || 0;
  const isValidTotal = totalNum > 0;
  const hasAtLeastOneDebtor = addedMemberAddresses.length > 0;
  const splitsMatchTotal =
    !hasAtLeastOneDebtor ||
    (isValidTotal && Math.abs(sumSplits - totalNum) < 0.02);

  const createBill = api.bill.createBill.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setShowAllBills(false);
        setSelectedGroupId(groupId);
        utils.bill.getBills.invalidate();
        router.replace("/");
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAddress || !isValidTotal || !splitsMatchTotal) return;
    const splitsRecord: Record<string, number> = {};
    for (const addr of addedMemberAddresses) {
      const amount = computedAmounts[addr] ?? 0;
      if (amount > 0) splitsRecord[addr] = amount;
    }

    const billId = nanoid();

    const debtors = addedMemberAddresses;
    const values = debtors.map((addr) => computedAmounts[addr] ?? 0);

    const result = await createSuiBill({
      billId,
      debtors,
      values,
    });

    const txDigest =
      (result as { Transaction?: { digest?: string } })?.Transaction?.digest ??
      (result as { digest?: string })?.digest ??
      undefined;

    createBill.mutate({
      billId,
      groupId,
      description: description.trim(),
      totalAmount: totalNum,
      currency: "SUI",
      payerAddress,
      splits: splitsRecord,
      transactionDigest: txDigest,
    });
  };

  if (!userAddress) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="text-muted-foreground size-12" />
        <h1 className="text-xl font-semibold">Connect wallet</h1>
        <p className="text-muted-foreground text-center text-sm">
          Connect your wallet to create a bill.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  if (groupsLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <Loader2 className="text-muted-foreground size-12 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!groupList.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="text-muted-foreground size-12" />
        <h1 className="text-xl font-semibold">No groups</h1>
        <p className="text-muted-foreground text-center text-sm">
          Join a group first to create bills.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-5" />
            Create bill
          </CardTitle>
          <CardDescription>
            Add a new bill and split it between group members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select value={groupId} onValueChange={setGroupId} required>
                <SelectTrigger id="group" className="w-full">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groupList.map((g) => {
                    const Icon = getGroupIcon(g.iconId);
                    return (
                      <SelectItem key={g.id} value={g.id}>
                        <span className="flex items-center gap-2">
                          <Icon className="size-4" />
                          {g.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedGroup && members.length <= 1 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-3 text-sm text-amber-700 dark:text-amber-400">
                  <AlertCircle className="size-4 shrink-0" />
                  Add members to the group first to split the bill
                </div>
                <Button type="button" variant="outline" asChild>
                  <Link href="/">Go back</Link>
                </Button>
              </div>
            )}

            {selectedGroup && members.length > 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Dinner at restaurant"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total">Total amount (SUI)</Label>
                  <Input
                    id="total"
                    type="number"
                    min="0"
                    step="0.000000001"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>

                {selectedGroup && members.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <Label>Payer (who paid)</Label>
                      <Select
                        value={payerAddress}
                        onValueChange={setPayerAddress}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            userAddress,
                            ...members.filter((addr) => addr !== userAddress),
                          ].map((addr) => (
                            <SelectItem key={addr} value={addr}>
                              <span className="flex items-center gap-2">
                                {addr === userAddress ? (
                                  <span className="text-primary font-medium">
                                    You
                                  </span>
                                ) : (
                                  <span className="font-mono text-sm">
                                    {formatAddress(addr)}
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Split between members</Label>
                      <p className="text-muted-foreground text-xs">
                        Add members who should share this bill. Sum must equal
                        total amount ({totalNum.toFixed(9)} SUI).
                      </p>
                      {availableToAdd.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={addMemberSelect}
                            onValueChange={(v) => {
                              setAddMemberSelect(v);
                              if (v) addMember(v);
                            }}
                          >
                            <SelectTrigger className="w-full max-w-xs min-w-[12rem]">
                              <span className="flex items-center gap-2">
                                <UserPlus className="size-4" />
                                <SelectValue placeholder="Add member" />
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              {availableToAdd.map((addr) => (
                                <SelectItem key={addr} value={addr}>
                                  {addr === userAddress ? (
                                    <span className="font-medium">You</span>
                                  ) : (
                                    <span className="font-mono text-sm">
                                      {formatAddress(addr)}
                                    </span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {addedMemberAddresses.length > 0 && (
                        <>
                          <div
                            className={cn(
                              "rounded-md border p-2 text-sm",
                              !splitsMatchTotal &&
                                isValidTotal &&
                                "border-destructive/50 bg-destructive/5",
                            )}
                          >
                            Current sum: {sumSplits.toFixed(2)}
                            {!splitsMatchTotal && isValidTotal && (
                              <span className="text-destructive ml-2">
                                (must be {totalNum.toFixed(2)})
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-3">
                            {addedMemberAddresses.map((addr) => {
                              const s = splits[addr] ?? {
                                mode: "amount" as SplitMode,
                                value: 0,
                              };
                              const amount = computedAmounts[addr] ?? 0;
                              return (
                                <div
                                  key={addr}
                                  className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
                                >
                                  <span className="w-full shrink-0 text-sm font-medium sm:w-auto">
                                    {addr === userAddress ? (
                                      <span className="bg-primary/15 text-primary inline-flex items-center rounded-md px-2 py-0.5">
                                        You
                                      </span>
                                    ) : (
                                      <span className="text-foreground font-mono">
                                        {formatAddress(addr)}
                                      </span>
                                    )}
                                  </span>
                                  <Select
                                    value={s.mode}
                                    onValueChange={(v: SplitMode) =>
                                      updateSplit(addr, v, s.value)
                                    }
                                  >
                                    <SelectTrigger className="min-w-[7rem]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="percent">
                                        Percent
                                      </SelectItem>
                                      <SelectItem value="amount">
                                        Amount
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {s.mode === "amount" ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      className="w-24"
                                      value={s.value || ""}
                                      onChange={(e) =>
                                        updateSplit(
                                          addr,
                                          "amount",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                    />
                                  ) : (
                                    <div className="flex w-full min-w-0 flex-1 items-center gap-3">
                                      <Slider
                                        min={0}
                                        max={100}
                                        step={1}
                                        value={[Math.round(s.value)]}
                                        onValueChange={(v) =>
                                          updateSplit(
                                            addr,
                                            "percent",
                                            v[0] ?? 0,
                                          )
                                        }
                                      />
                                      <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                                        {Math.round(s.value)}% ={" "}
                                        {amount.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive ml-auto shrink-0"
                                    onClick={() => removeMember(addr)}
                                    title="Remove from bill"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      {nonPayerMembers.length > 0 &&
                        addedMemberAddresses.length === 0 && (
                          <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm">
                            Add at least one member above to split the bill
                          </p>
                        )}
                    </div>
                  </>
                )}

                {createBill.data && !createBill.data.success && (
                  <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <AlertCircle className="size-4 shrink-0" />
                    {"message" in createBill.data &&
                    typeof (createBill.data as { message?: string }).message ===
                      "string"
                      ? (createBill.data as { message: string }).message
                      : "Failed to create bill"}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={
                      !groupId ||
                      !description.trim() ||
                      !isValidTotal ||
                      !hasAtLeastOneDebtor ||
                      !splitsMatchTotal ||
                      createBill.isPending ||
                      members.length <= 1
                    }
                  >
                    {createBill.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create bill"
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/">Cancel</Link>
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
