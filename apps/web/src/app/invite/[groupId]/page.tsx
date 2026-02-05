"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { api } from "@/trpc/react";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { useConnectModalStore } from "@/lib/store/connectModalStore";
import { getGroupIcon } from "@/lib/groupIcons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Wallet } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";

export default function InvitePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const pass = searchParams.get("pass") ?? "";
  const account = useCurrentAccount();
  const authStore = useAuthStore();
  const userAddress = authStore.zkLoginAddress
    ? authStore.zkLoginAddress
    : account?.address
      ? account.address
      : "";
  const setSelectedGroupId = useSidebarStore((s) => s.setSelectedGroupId);
  const setShowAllBills = useSidebarStore((s) => s.setShowAllBills);
  const setIsConnectModalOpen = useConnectModalStore(
    (s) => s.setIsConnectModalOpen,
  );

  const {
    data: group,
    isLoading: groupLoading,
    error: groupError,
  } = api.group.getGroup.useQuery({ id: groupId }, { enabled: !!groupId });

  const utils = api.useUtils();
  const joinGroup = api.group.joinGroup.useMutation({
    onSuccess: async (result) => {
      if (result.success) {
        setShowAllBills(false);
        setSelectedGroupId(groupId);
        if (userAddress) {
          await utils.group.getUserGroups.invalidate({
            address: userAddress,
          });
        }
        router.replace("/");
      }
    },
  });

  if (groupId == null || groupId === "") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="text-muted-foreground size-12" />
        <h1 className="text-xl font-semibold">Invalid invite link</h1>
        <p className="text-muted-foreground text-center text-sm">
          Missing group ID in the URL.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  if (groupLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <Loader2 className="text-muted-foreground size-12 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading invite...</p>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="text-destructive size-12" />
        <h1 className="text-xl font-semibold">Group not found</h1>
        <p className="text-muted-foreground text-center text-sm">
          This invite link may be invalid or the group was deleted.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  const GroupIcon = getGroupIcon(group.iconId);

  if (!pass) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="text-destructive size-12" />
        <h1 className="text-xl font-semibold">Invalid invite link</h1>
        <p className="text-muted-foreground text-center text-sm">
          This invite link is missing the required password parameter.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  const wrongPassword =
    joinGroup.data &&
    !joinGroup.data.success &&
    joinGroup.data.error === "wrong_password";
  const notFound =
    joinGroup.data &&
    !joinGroup.data.success &&
    joinGroup.data.error === "not_found";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-muted mx-auto mb-2 flex size-14 items-center justify-center rounded-full">
            <GroupIcon className="text-muted-foreground size-8" />
          </div>
          <CardTitle>Join group "{group.name}"</CardTitle>
          <CardDescription>
            {group.membersCount} member{group.membersCount === 1 ? "" : "s"} in
            this group
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {wrongPassword && (
            <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              Invalid invite link. The password may be incorrect.
            </div>
          )}
          {notFound && (
            <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              Group no longer exists.
            </div>
          )}

          {!userAddress ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-center text-sm">
                Connect your wallet to join this group.
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => setIsConnectModalOpen(true)}
              >
                <Wallet className="size-4" />
                Connect wallet
              </Button>
            </div>
          ) : (
            <Button
              className="w-full gap-2"
              disabled={joinGroup.isPending}
              onClick={() =>
                joinGroup.mutate({
                  id: groupId,
                  pass,
                  address: userAddress,
                })
              }
            >
              {joinGroup.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join group"
              )}
            </Button>
          )}

          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/">Cancel</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
