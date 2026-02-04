import type { GroupIconId } from "@/lib/groupIcons";

export type Group = {
  id: string;
  name: string;
  iconId: GroupIconId;
  membersCount: number;
  inviteLink: string;
};
