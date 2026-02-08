"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useRouter } from "next/navigation";
import { useConnectModalStore } from "@/lib/store/connectModalStore";
import { initializeAuth } from "@/lib/zkLogin";
import { env } from "@/env";
import { useAuthStore } from "@/lib/store/authStore";

export default function LoginPage() {
  const account = useCurrentAccount();
  const authStore = useAuthStore();
  const userAddress = authStore.zkLoginAddress
    ? authStore.zkLoginAddress
    : account?.address
      ? account.address
      : "";
  const router = useRouter();
  const { setIsConnectModalOpen } = useConnectModalStore();

  const googleAuth = async () => {
    const { nonce, ephemeralKeyPair, maxEpoch, randomness } =
      await initializeAuth();

    sessionStorage.setItem(
      "sprinkle-temp-zklogin",
      JSON.stringify({
        nonce,
        ephemeralPrivateKey: ephemeralKeyPair.getSecretKey(),
        maxEpoch,
        randomness,
      }),
    );

    const params = new URLSearchParams({
      client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: env.NEXT_PUBLIC_AUTH_CALLBACK_URL,
      response_type: "id_token",
      scope: "openid",
      nonce: nonce,
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    window.location.href = url;
  };

  useEffect(() => {
    if (userAddress) {
      setIsConnectModalOpen(false);
      router.push("/");
    }
  }, [userAddress]);
  return (
    <main className="flex h-screen w-full flex-col items-center justify-between py-70">
      <span className="text-4xl font-bold">Sprinkle</span>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="mx-auto text-2xl font-bold">Login</CardTitle>
          <CardDescription className="mx-auto text-base">
            Login to your account via wallet or Google
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            className="w-full"
            size={"lg"}
            variant="outline"
            onClick={googleAuth}
          >
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
