"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { formatAddress } from "@mysten/sui/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import GroupCard from "../GroupCard";
import GroupSettingsDialog from "../GroupSettingsDialog";
import {
  Copy,
  CreditCard,
  Icon,
  Link2,
  LogOut,
  Plus,
  Receipt,
  Settings,
} from "lucide-react";
import { getGroupIcon } from "@/lib/groupIcons";
import type { Group } from "@/lib/types/group";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

const NEW_GROUP_VALUE = "__new_group__";

export default function MainSidebar() {
  const account = useCurrentAccount();
  const authStore = useAuthStore();
  const userAddress = authStore.zkLoginAddress
    ? authStore.zkLoginAddress
    : account?.address
      ? account.address
      : "";

  const router = useRouter();
  const { disconnectWallet } = useDAppKit();
  const { data: groups, refetch: refetchGroups } =
    api.group.getUserGroups.useQuery({
      address: userAddress,
    });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [inviteLinkOpen, setInviteLinkOpen] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate: updateGroup } = api.group.updateGroup.useMutation();
  const { mutateAsync: createGroup } = api.group.createGroup.useMutation();

  const {
    selectedGroupId,
    showAllBills,
    showMyDebts,
    setShowMyDebts,
    setSelectedGroupId,
    setShowAllBills,
  } = useSidebarStore();

  const selectedGroup = groups && groups.find((g) => g.id === selectedGroupId);
  const isNewGroupSelected = selectedGroupId === NEW_GROUP_VALUE;

  const handleGroupChange = useCallback(
    (value: string) => {
      if (value === NEW_GROUP_VALUE) {
        setSelectedGroupId(NEW_GROUP_VALUE);
        setCreateGroupOpen(true);
        return;
      }
      setSelectedGroupId(value || null);
    },
    [setSelectedGroupId],
  );

  const handleCreateGroupClose = useCallback(
    (open: boolean) => {
      setCreateGroupOpen(open);
      if (!open && isNewGroupSelected) {
        setSelectedGroupId(null);
      }
    },
    [isNewGroupSelected, setSelectedGroupId],
  );

  const handleCreateGroup = useCallback(
    async (data: { name: string; iconId: string }) => {
      if (!userAddress) return;
      const created = await createGroup({
        name: data.name,
        iconId: data.iconId,
        creatorAddress: userAddress,
      });
      await refetchGroups();
      setSelectedGroupId(created.id);
      setCreateGroupOpen(false);
    },
    [userAddress, createGroup, setSelectedGroupId],
  );

  const handleCopyInviteLink = useCallback(() => {
    if (!selectedGroup) return;
    void navigator.clipboard.writeText(selectedGroup.inviteLink);
  }, [selectedGroup]);

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-5">
          <Select
            value={selectedGroupId || undefined}
            onValueChange={handleGroupChange}
          >
            <SelectTrigger
              size="default"
              className={cn(
                "h-auto! w-full! [&>svg]:ml-auto",
                selectedGroup ? "py-2" : "py-8",
              )}
            >
              <SelectValue placeholder="Select group or create new">
                {isNewGroupSelected ? (
                  <div className="flex w-full items-center gap-2">
                    <Plus className="text-muted-foreground size-5 shrink-0" />
                    <span className="font-medium">New Group</span>
                  </div>
                ) : selectedGroup ? (
                  <GroupCard
                    icon={getGroupIcon(selectedGroup.iconId)}
                    name={selectedGroup.name}
                    membersCount={selectedGroup.members.length}
                  />
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              className="min-w-(--radix-select-trigger-width)"
            >
              {groups &&
                groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    <GroupCard
                      icon={getGroupIcon(g.iconId)}
                      name={g.name}
                      membersCount={g.members.length}
                    />
                  </SelectItem>
                ))}
              <SelectItem value={NEW_GROUP_VALUE}>
                <div className={"flex w-full flex-row items-center gap-2"}>
                  <div className="flex h-full w-1/3 min-w-0 flex-col items-center justify-center p-4">
                    <Plus className="size-10 shrink-0 object-center" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-2">
                    <span className="truncate text-base font-medium">
                      New Group
                    </span>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {selectedGroup && !isNewGroupSelected && (
            <SidebarGroup className="mt-3 flex flex-col gap-2 p-0">
              <SidebarGroupLabel asChild>
                <span className="text-foreground text-base font-medium">
                  Group
                </span>
              </SidebarGroupLabel>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setInviteLinkOpen(true)}
              >
                <Link2 className="size-4" />
                Invite link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="size-4" />
                Group settings
              </Button>
            </SidebarGroup>
          )}
        </SidebarHeader>
        <SidebarContent className="p-3">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <span className="text-foreground text-base font-medium">
                Bills
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                asChild
              >
                <Link
                  href={
                    selectedGroupId && selectedGroupId !== NEW_GROUP_VALUE
                      ? `/bill/new?group=${selectedGroupId}`
                      : "/bill/new"
                  }
                >
                  <Plus className="size-4" />
                  Create bill
                </Link>
              </Button>
              <Button
                variant={showAllBills ? "default" : "outline"}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setShowAllBills(true)}
              >
                <Receipt className="size-4" />
                All bills
              </Button>
              <Button
                variant={showMyDebts ? "default" : "outline"}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setShowMyDebts(true)}
              >
                <CreditCard className="size-4" />
                My debts
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel asChild>
              <span className="text-foreground text-base font-medium">
                Settings
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  disconnectWallet();
                  authStore.logOut();
                  router.push("/login");
                }}
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-border mr-auto flex w-full flex-row items-center justify-center gap-5 border-t p-5">
          <span className="text-base font-medium">
            {userAddress ? formatAddress(userAddress) : "No account"}
          </span>
        </SidebarFooter>
      </Sidebar>

      <GroupSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        group={(selectedGroup as unknown as Group) ?? null}
        onSave={(groupId, data) =>
          updateGroup({ id: groupId, name: data.name, iconId: data.iconId })
        }
      />

      <GroupSettingsDialog
        open={createGroupOpen}
        onOpenChange={handleCreateGroupClose}
        group={null}
        onCreate={handleCreateGroup}
      />

      <AlertDialog
        open={inviteLinkOpen}
        onOpenChange={(open) => {
          setInviteLinkOpen(open);
          if (!open) {
            setInviteLinkCopied(false);
            if (copiedTimeoutRef.current) {
              clearTimeout(copiedTimeoutRef.current);
              copiedTimeoutRef.current = null;
            }
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md" size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>Invite link</AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            readOnly
            value={`https://sprinkle-split.vercel.app/invite/${selectedGroup?.id}?pass=${selectedGroup?.password}`}
            className="py-3 font-mono text-sm"
          />
          <div className="flex w-full flex-row items-center justify-between">
            <AlertDialogCancel
              className="w-[20%]"
              onClick={() => setInviteLinkOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="default"
              size="sm"
              className="w-[75%] gap-2"
              onClick={() => {
                if (selectedGroup) {
                  const link = `https://sprinkle-split.vercel.app/invite/${selectedGroup.id}?pass=${selectedGroup.password}`;
                  void navigator.clipboard.writeText(link);
                  if (copiedTimeoutRef.current)
                    clearTimeout(copiedTimeoutRef.current);
                  setInviteLinkCopied(true);
                  copiedTimeoutRef.current = setTimeout(
                    () => setInviteLinkCopied(false),
                    5000,
                  );
                }
              }}
            >
              <Copy className="size-4" />
              {inviteLinkCopied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
