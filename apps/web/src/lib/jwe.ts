"use server";

import { compactDecrypt, CompactEncrypt, importPKCS8, importSPKI } from "jose";
import { env } from "@/env";

export async function generateJWE(data: string, expirationSeconds: number) {
  const publicKeyBase64 = env.JWE_PUBLIC_KEY_B64;

  const publicKeyPem = Buffer.from(publicKeyBase64, "base64").toString("utf8");

  const publicKey = await importSPKI(publicKeyPem, "RSA-OAEP-256");

  const payload = {
    data,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expirationSeconds,
  };

  const jweToken = await new CompactEncrypt(
    new TextEncoder().encode(JSON.stringify(payload)),
  )
    .setProtectedHeader({
      alg: "RSA-OAEP-256",
      enc: "A256GCM",
      typ: "JWE",
    })
    .encrypt(publicKey);

  return jweToken;
}

export async function decryptJWE({
  jweToken,
  validateExpiration,
  expirationSeconds,
}: {
  jweToken: string;
  validateExpiration?: boolean;
  expirationSeconds?: number;
}) {
  const privateKeyBase64 = env.JWE_PRIVATE_KEY_B64;

  const privateKeyPem = Buffer.from(privateKeyBase64, "base64").toString(
    "utf8",
  );

  const privateKey = await importPKCS8(privateKeyPem, "RSA-OAEP-256");

  const { plaintext } = await compactDecrypt(jweToken, privateKey);

  const payload = JSON.parse(new TextDecoder().decode(plaintext));

  if (validateExpiration) {
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if the token has the exp field
    if (!payload.exp) {
      throw new Error("DecryptJWE failed: Token missing expiration time");
    }

    // Check if the token has expired
    if (payload.exp < currentTime) {
      throw new Error("DecryptJWE failed: Token has expired");
    }

    // Check if the token was created too long ago (if expirationSeconds is specified)
    if (expirationSeconds && payload.iat) {
      const maxAge = currentTime - expirationSeconds;
      if (payload.iat < maxAge) {
        throw new Error("DecryptJWE failed: Token is too old");
      }
    }
  }

  return payload;
}
