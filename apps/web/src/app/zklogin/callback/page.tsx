"use client";

import { api } from "@/trpc/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ZkLoginCallbackPage() {
  const router = useRouter();
  const authStore = useAuthStore();
  const params = useSearchParams();
  const idToken = params.get("id_token");
  const [dataError, setDataError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const {
    mutate: authenticate,
    isPending,
    isError,
    error,
  } = api.zkLogin.authenticate.useMutation({
    onSuccess: (data) => {
      authStore.setZkLoginAddress(data.zkLoginAddress);
      router.push("/");
    },
    onError: (err) => {
      console.error(err);
    },
  });

  useEffect(() => {
    if (!idToken || startedRef.current) return;
    startedRef.current = true;

    const zkLoginDataJSON = sessionStorage.getItem("sprinkle-temp-zklogin");
    if (!zkLoginDataJSON) {
      setDataError("Session data not found. Please try signing in again.");
      return;
    }

    try {
      const { nonce, ephemeralKeyPair, maxEpoch, randomness } =
        JSON.parse(zkLoginDataJSON);
      authenticate({ idToken, nonce, ephemeralKeyPair, maxEpoch, randomness });
    } catch {
      setDataError("Invalid session data. Please try signing in again.");
    }
  }, [idToken, authenticate]);

  const hasError = !idToken || dataError || isError;
  const errorMessage = !idToken
    ? "No ID token received"
    : dataError
      ? dataError
      : isError
        ? (error?.message ?? "Sign in failed")
        : null;

  if (hasError && errorMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="text-destructive size-12" />
          <h1 className="text-xl font-semibold">Sign in failed</h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            {errorMessage}
          </p>
        </div>
        <Button asChild>
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Loader2 className="text-muted-foreground size-12 animate-spin" />
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-medium">Signing you in...</p>
        <p className="text-muted-foreground text-sm">
          Completing zkLogin authentication
        </p>
      </div>
    </div>
  );
}
