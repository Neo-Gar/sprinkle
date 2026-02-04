import type { LucideIcon } from "lucide-react";
import {
  Utensils,
  Users,
  Home,
  Wallet,
  Receipt,
  Pizza,
  Coffee,
  ShoppingCart,
  Gift,
  Heart,
  Star,
  Bookmark,
  Flag,
  Bell,
  MessageCircle,
  Mail,
  Phone,
  Camera,
  Image,
  Palette,
} from "lucide-react";

export const GROUP_ICONS = [
  { id: "utensils", Icon: Utensils },
  { id: "users", Icon: Users },
  { id: "home", Icon: Home },
  { id: "wallet", Icon: Wallet },
  { id: "receipt", Icon: Receipt },
  { id: "pizza", Icon: Pizza },
  { id: "coffee", Icon: Coffee },
  { id: "shopping-cart", Icon: ShoppingCart },
  { id: "gift", Icon: Gift },
  { id: "heart", Icon: Heart },
  { id: "star", Icon: Star },
  { id: "bookmark", Icon: Bookmark },
  { id: "flag", Icon: Flag },
  { id: "bell", Icon: Bell },
  { id: "message-circle", Icon: MessageCircle },
  { id: "mail", Icon: Mail },
  { id: "phone", Icon: Phone },
  { id: "camera", Icon: Camera },
  { id: "image", Icon: Image },
  { id: "palette", Icon: Palette },
] as const satisfies readonly { id: string; Icon: LucideIcon }[];

export type GroupIconId =
  (typeof GROUP_ICONS)[number]["id"];

export function getGroupIcon(id: string): LucideIcon {
  const found = GROUP_ICONS.find((g) => g.id === id);
  return found ? found.Icon : Utensils;
}
