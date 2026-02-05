import { AppKitLayout } from "@/context/AppKitLayout";

export default function BillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppKitLayout>{children}</AppKitLayout>;
}
