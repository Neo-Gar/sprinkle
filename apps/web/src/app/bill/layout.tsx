import { AppKitLayout } from "@/context/AppKitLayout";
import { AuthContext } from "@/context/AuthContext";

export default function BillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppKitLayout>
      <AuthContext>{children}</AuthContext>
    </AppKitLayout>
  );
}
