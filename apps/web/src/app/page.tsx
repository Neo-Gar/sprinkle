import Home from "@/components/Home";
import { AppKitLayout } from "@/context/AppKitLayout";
import { AuthContext } from "@/context/AuthContext";

export default function HomePage() {
  return (
    <AppKitLayout>
      <AuthContext>
        <Home />
      </AuthContext>
    </AppKitLayout>
  );
}
