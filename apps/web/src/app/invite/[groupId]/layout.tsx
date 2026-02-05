import { AppKitLayout } from "@/context/AppKitLayout";
import { AuthContext } from "@/context/AuthContext";

export default function InviteLayout({
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
