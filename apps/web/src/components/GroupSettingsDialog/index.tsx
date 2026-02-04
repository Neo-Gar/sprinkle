"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GroupCard from "@/components/GroupCard";
import { GROUP_ICONS, getGroupIcon } from "@/lib/groupIcons";
import type { Group } from "@/lib/types/group";
import { cn } from "@/lib/utils";

/** Same box as sidebar trigger/items so preview matches */
const groupOptionBox =
  "rounded-lg border border-input bg-background p-2 w-full text-left";

type GroupSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onSave: (groupId: string, data: { name: string; iconId: string }) => void;
};

export default function GroupSettingsDialog({
  open,
  onOpenChange,
  group,
  onSave,
}: GroupSettingsDialogProps) {
  const [name, setName] = useState("");
  const [iconId, setIconId] = useState<string>("utensils");

  useEffect(() => {
    if (group) {
      setName(group.name);
      setIconId(group.iconId);
    }
  }, [group, open]);

  const Icon = getGroupIcon(iconId);

  const handleSave = () => {
    if (group) {
      onSave(group.id, { name: name.trim(), iconId });
      onOpenChange(false);
    }
  };

  if (!group) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md" size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>Group settings</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg border bg-muted/30 p-2">
            <p className="text-muted-foreground mb-2 text-xs">Preview</p>
            <div className={groupOptionBox}>
              <GroupCard
                icon={Icon}
                name={name || "Group name"}
                membersCount={group.membersCount}
              />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground mb-1.5 block text-sm">
              Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {GROUP_ICONS.map(({ id, Icon: I }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIconId(id)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-md border transition",
                    iconId === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input hover:bg-muted/50",
                  )}
                >
                  <I className="size-5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="group-name"
              className="text-muted-foreground mb-1.5 block text-sm"
            >
              Group name
            </label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apartment, Trip"
              className="w-full"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={handleSave}>Save</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
