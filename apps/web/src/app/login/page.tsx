"use client";

import dynamic from "next/dynamic";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const DAppKitClientProvider = dynamic(
  () =>
    import("@/context/DAppKitClientProvider").then(
      (mod) => mod.DAppKitClientProvider,
    ),
  { ssr: false },
);
const ConnectModal = dynamic(
  () =>
    import("@/context/DAppKitClientProvider").then((mod) => mod.ConnectModal),
  { ssr: false, loading: () => <button disabled>Loading...</button> },
);

export default function LoginPage() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DAppKitClientProvider>
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
              onClick={() => setIsOpen(true)}
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
        <div />
      </main>
      <ConnectModal open={isOpen} />
    </DAppKitClientProvider>
  );
}
