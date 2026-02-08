"use client";

import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { getZkLoginSignature } from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { api } from "@/trpc/react";
import { env } from "@/env";
import { useAuthStore } from "@/lib/store/authStore";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

export function useSui({ provider }: { provider: "zklogin" | "wallet" }) {
  const suiClient = new SuiJsonRpcClient({
    network: "testnet",
    url: getJsonRpcFullnodeUrl("testnet"),
  });

  const { data: zkLoginData } = api.zkLogin.getZkLoginData.useQuery(undefined, {
    enabled: provider === "zklogin",
  });
  const authStore = useAuthStore();
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();

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

    const MIST_PER_SUI = 1_000_000_000;
    const valuesU64 = values.map((v) => Math.round(Number(v) * MIST_PER_SUI));

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

  const payDebt = async ({ debtId }: { debtId: string }) => {
    const debtObj = await suiClient.getObject({
      id: debtId,
      options: { showContent: true },
    });

    const content = debtObj.data?.content as
      | {
          type: string;
          fields: {
            id: { id: string };
            bill_id: unknown;
            creditor: string;
            value: string;
          };
        }
      | undefined;

    if (!content?.fields || !content.type?.includes("::bill::Debt")) {
      throw new Error("Debt object not found");
    }

    const valueMist = BigInt(content.fields.value);

    const txb = new Transaction();
    const txTarget = "::bill::pay_debt";

    if (provider === "zklogin") {
      txb.setSender(authStore.zkLoginAddress!);
    } else {
      txb.setSender(account?.address!);
    }

    const coin = coinWithBalance({
      balance: valueMist,
    });

    txb.moveCall({
      target: `${env.NEXT_PUBLIC_SUI_PACKAGE_ID}${txTarget}`,
      arguments: [txb.object(debtId), coin],
    });

    // Zklogin provider
    if (provider === "zklogin") {
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
    payDebt,
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
