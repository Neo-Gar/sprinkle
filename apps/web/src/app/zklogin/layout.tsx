import { AppKitLayout } from "@/context/AppKitLayout";

export default function ZkLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppKitLayout>{children}</AppKitLayout>;
}
