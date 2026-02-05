import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  getExtendedEphemeralPublicKey,
  jwtToAddress,
  genAddressSeed,
} from "@mysten/sui/zklogin";
import { env } from "@/env";
import { jwtDecode } from "jwt-decode";
import { TRPCError } from "@trpc/server";
import { generateUserSalt, getZkProof } from "@/lib/zkLogin";
import { cookies } from "next/headers";
import { decryptJWE, generateJWE } from "@/lib/jwe";
import { ZK_LOGIN_JWE_EXPIRATION_SECONDS } from "@/lib/constants";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

interface JwtPayload {
  iss?: string;
  sub?: string; // Subject ID
  aud?: string[] | string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  nonce?: string; // Nonce for zkLogin
}

export const zkLoginRouter = createTRPCRouter({
  authenticate: publicProcedure
    .input(
      z.object({
        idToken: z.string(),
        nonce: z.string(),
        ephemeralPrivateKey: z.string(),
        maxEpoch: z.number(),
        randomness: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const cookieStore = await cookies();
      const masterSeed = env.MASTER_SEED;
      const zkProverUrl = env.ZK_PROVER_URL;
      const proverBackendKey = env.PROVER_BACKEND_KEY;
      const ephemeralKeypair = Ed25519Keypair.fromSecretKey(
        input.ephemeralPrivateKey,
      );

      const decodedJwt = jwtDecode(input.idToken) as JwtPayload;

      const jwtNonce = decodedJwt.nonce;

      if (jwtNonce !== input.nonce) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nonce mismatch" });
      }

      const userSalt = await generateUserSalt(input.idToken, masterSeed);
      const zkLoginAddress = jwtToAddress(input.idToken, userSalt, false);

      const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
        ephemeralKeypair.getPublicKey(),
      );

      let zkProof;
      try {
        zkProof = await getZkProof({
          proverUrl: zkProverUrl,
          authorization: proverBackendKey,
          jwt: input.idToken,
          extendedEphemeralPublicKey: extendedEphemeralPublicKey,
          maxEpoch: input.maxEpoch,
          jwtRandomness: input.randomness,
          salt: userSalt,
        });
      } catch (error) {
        console.warn("Prover service failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get zk proof",
        });
      }

      const addressSeed = genAddressSeed(
        BigInt(userSalt),
        "sub",
        decodedJwt.sub!,
        Array.isArray(decodedJwt.aud)
          ? (decodedJwt.aud[0] ?? "")
          : (decodedJwt.aud ?? ""),
      ).toString();

      const zkLoginData = {
        zkProof: JSON.stringify(zkProof),
        addressSeed,
        nonce: input.nonce,
        ephemeralPrivateKey: ephemeralKeypair.getSecretKey(),
        maxEpoch: input.maxEpoch,
        randomness: input.randomness,
      };

      const zkLoginJWE = await generateJWE(
        JSON.stringify(zkLoginData),
        ZK_LOGIN_JWE_EXPIRATION_SECONDS,
      );

      cookieStore.set("zkLoginJWE", zkLoginJWE, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: ZK_LOGIN_JWE_EXPIRATION_SECONDS,
        path: "/",
        expires: new Date(Date.now() + ZK_LOGIN_JWE_EXPIRATION_SECONDS * 1000),
      });

      return {
        zkLoginAddress,
      };
    }),
  getZkLoginData: publicProcedure.query(async () => {
    const cookieStore = await cookies();
    const zkLoginJWE = cookieStore.get("zkLoginJWE");
    if (!zkLoginJWE) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No zkLoginJWE found",
      });
    }
    const zkLoginData = await decryptJWE({
      jweToken: zkLoginJWE.value,
      validateExpiration: true,
      expirationSeconds: ZK_LOGIN_JWE_EXPIRATION_SECONDS,
    });
    if (!zkLoginData) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid zkLoginJWE",
      });
    }
    const zkProof = JSON.parse(zkLoginData.zkProof);

    return {
      zkProof: zkProof as any,
      addressSeed: zkLoginData.addressSeed as string,
      nonce: zkLoginData.nonce as string,
      ephemeralPrivateKey: zkLoginData.ephemeralPrivateKey as string,
      maxEpoch: zkLoginData.maxEpoch as number,
      randomness: zkLoginData.randomness as string,
    };
  }),
});
