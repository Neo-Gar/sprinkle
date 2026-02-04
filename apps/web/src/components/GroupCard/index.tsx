import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type GroupCardProps = {
  icon: LucideIcon;
  name: string;
  membersCount?: number;
  className?: string;
};

export default function GroupCard({
  icon: Icon,
  name,
  membersCount = 0,
  className,
}: GroupCardProps) {
  return (
    <div className={cn("flex w-full flex-row items-center gap-2", className)}>
      <div className="flex h-full w-1/3 min-w-0 flex-col items-center justify-center p-4">
        <Icon className="size-10 shrink-0 object-center" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-2">
        <span className="truncate text-base font-medium">{name}</span>
        <span className="text-muted-foreground text-sm">
          {membersCount} {membersCount === 1 ? "member" : "members"}
        </span>
      </div>
    </div>
  );
}
