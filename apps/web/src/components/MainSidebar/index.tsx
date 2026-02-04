"use client";

import { useState, useCallback } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { formatAddress } from "@mysten/sui/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "../ui/button";
import GroupCard from "../GroupCard";
import GroupSettingsDialog from "../GroupSettingsDialog";
import { ChevronDown, Link2, LogOut, Receipt, Settings } from "lucide-react";
import { getGroupIcon } from "@/lib/groupIcons";
import type { Group } from "@/lib/types/group";
import { useSidebarStore } from "@/lib/store/sidebarStore";

const MOCK_GROUPS: Group[] = [
  {
    id: "1",
    name: "Apartment",
    iconId: "home",
    membersCount: 3,
    inviteLink: "https://sprinkle.app/invite/abc123",
  },
  {
    id: "2",
    name: "Trip",
    iconId: "pizza",
    membersCount: 5,
    inviteLink: "https://sprinkle.app/invite/def456",
  },
  {
    id: "3",
    name: "Office",
    iconId: "users",
    membersCount: 8,
    inviteLink: "https://sprinkle.app/invite/ghi789",
  },
];

export default function MainSidebar() {
  const account = useCurrentAccount();
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { selectedGroupId, showAllBills, setSelectedGroupId, setShowAllBills } =
    useSidebarStore();

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const handleGroupChange = useCallback(
    (groupId: string) => {
      setSelectedGroupId(groupId || null);
    },
    [setSelectedGroupId],
  );

  const handleCopyInviteLink = useCallback(() => {
    if (!selectedGroup) return;
    void navigator.clipboard.writeText(selectedGroup.inviteLink);
  }, [selectedGroup]);

  const handleSaveGroup = useCallback(
    (groupId: string, data: { name: string; iconId: string }) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, name: data.name, iconId: data.iconId as Group["iconId"] }
            : g,
        ),
      );
    },
    [],
  );

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
              className="h-auto! w-full! py-2 [&>svg]:ml-auto"
            >
              <SelectValue placeholder="Select group">
                {selectedGroup ? (
                  <GroupCard
                    icon={getGroupIcon(selectedGroup.iconId)}
                    name={selectedGroup.name}
                    membersCount={selectedGroup.membersCount}
                  />
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              className="min-w-(--radix-select-trigger-width)"
            >
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  <GroupCard
                    icon={getGroupIcon(g.iconId)}
                    name={g.name}
                    membersCount={g.membersCount}
                  />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedGroup && (
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
                onClick={handleCopyInviteLink}
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
                variant={showAllBills ? "default" : "outline"}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setShowAllBills(true)}
              >
                <Receipt className="size-4" />
                My bills
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
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-border mr-auto flex w-full flex-row items-center justify-center gap-5 border-t p-5">
          <span className="text-base font-medium">
            {account?.address ? formatAddress(account.address) : "No account"}
          </span>
        </SidebarFooter>
      </Sidebar>

      <GroupSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        group={selectedGroup ?? null}
        onSave={handleSaveGroup}
      />
    </>
  );
}
