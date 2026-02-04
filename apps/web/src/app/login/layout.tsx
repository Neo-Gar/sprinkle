import { AppKitLayout } from "@/context/AppKitLayout";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppKitLayout>{children}</AppKitLayout>;
}
