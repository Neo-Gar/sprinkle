import { AppKitLayout } from "@/context/AppKitLayout";

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppKitLayout>{children}</AppKitLayout>;
}
