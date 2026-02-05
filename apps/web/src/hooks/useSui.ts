"use client";

import { Transaction } from "@mysten/sui/transactions";
import { getZkLoginSignature } from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { api } from "@/trpc/react";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SUI_TESTNET_GRPC_URL } from "@/lib/constants";
import { env } from "@/env";
import { useAuthStore } from "@/lib/store/authStore";
import { useDAppKit } from "@mysten/dapp-kit-react";

export function useSui({ provider }: { provider: "zklogin" | "wallet" }) {
  const suiClient = new SuiGrpcClient({
    network: "testnet",
    baseUrl: SUI_TESTNET_GRPC_URL,
  });

  const { data: zkLoginData } = api.zkLogin.getZkLoginData.useQuery(undefined, {
    enabled: provider === "zklogin",
  });
  const authStore = useAuthStore();
  const dAppKit = useDAppKit();

  const createBill = async ({
    billId,
    debtors,
    values,
  }: {
    billId: string;
    debtors: string[];
    values: number[];
  }) => {
    const txb = new Transaction();
    const txTarget = "::bill::create_bill";

    const billIdBytes = Array.from(new TextEncoder().encode(billId));

    const valuesU64 = values.map((v) => Math.round(Number(v)));

    txb.moveCall({
      target: `${env.NEXT_PUBLIC_SUI_PACKAGE_ID}${txTarget}`,
      arguments: [
        txb.pure.vector("u8", billIdBytes),
        txb.pure.vector("address", debtors),
        txb.pure.vector("u64", valuesU64),
      ],
    });

    // Zklogin provider
    if (provider === "zklogin") {
      txb.setSender(authStore.zkLoginAddress!);

      const transactionBytes = await txb.build({ client: suiClient });

      const zkLoginSignature = await signWithZkLogin(
        transactionBytes,
        Ed25519Keypair.fromSecretKey(zkLoginData?.ephemeralPrivateKey!),
        zkLoginData?.zkProof!,
        zkLoginData?.addressSeed!,
        zkLoginData?.maxEpoch!,
      );

      const result = await suiClient.core.executeTransaction({
        transaction: transactionBytes,
        signatures: [zkLoginSignature],
      });

      return result;
    }

    // Wallet provider
    const result = await dAppKit.signAndExecuteTransaction({
      transaction: txb,
    });

    return result;
  };

  return {
    createBill,
  };
}

const signWithZkLogin = async (
  transactionBytes: Uint8Array,
  ephemeralKeyPair: Ed25519Keypair,
  zkProof: any,
  addressSeed: string,
  maxEpoch: number,
) => {
  const { signature: userSignature } =
    await ephemeralKeyPair.signTransaction(transactionBytes);

  const zkLoginSignature = getZkLoginSignature({
    inputs: {
      ...(zkProof as unknown as any),
      addressSeed: addressSeed,
    },
    maxEpoch: maxEpoch,
    userSignature: userSignature,
  });

  return zkLoginSignature;
};
