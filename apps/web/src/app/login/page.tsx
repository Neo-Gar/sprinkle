"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useRouter } from "next/navigation";
import { useConnectModalStore } from "@/lib/store/connectModalStore";

export default function LoginPage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const { setIsConnectModalOpen } = useConnectModalStore();

  useEffect(() => {
    if (account) {
      router.push("/");
    }
  }, [account]);
  return (
    <main className="flex h-screen w-full flex-col items-center justify-between py-70">
      <span className="mx-auto text-4xl font-bold">Sprinkle</span>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="mx-auto text-2xl font-bold">Login</CardTitle>
          <CardDescription className="mx-auto text-base">
            Login to your account via wallet or Google
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button className="w-full" size={"lg"} variant="outline">
            Login with Google
          </Button>
          <Button
            className="w-full"
            size={"lg"}
            variant="outline"
            onClick={() => setIsConnectModalOpen(true)}
          >
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
      <div />
    </main>
  );
}
