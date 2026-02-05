import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { generateRandomness, generateNonce } from "@mysten/sui/zklogin";
import { SUI_TESTNET_GRPC_URL } from "./constants";

export interface ZkProofRequest {
  jwt: string;
  extendedEphemeralPublicKey: string;
  maxEpoch: string;
  jwtRandomness: string;
  salt: string;
  keyClaimName: string;
}

export interface ZkProofResponse {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
}

export async function initializeAuth() {
  const suiClient = new SuiGrpcClient({
    network: "testnet",
    baseUrl: SUI_TESTNET_GRPC_URL,
  });
  const { systemState } = await suiClient.core.getCurrentSystemState();

  const maxEpoch = Number(systemState.epoch) + 2;
  const ephemeralKeyPair = new Ed25519Keypair();
  const randomness = generateRandomness();
  const nonce = generateNonce(
    ephemeralKeyPair.getPublicKey(),
    maxEpoch,
    randomness,
  );

  return {
    nonce,
    ephemeralKeyPair,
    maxEpoch,
    randomness,
  };
}

export async function generateUserSalt(
  jwt: string,
  masterSeed: string,
): Promise<string> {
  const decodedJwt = JSON.parse(atob(jwt.split(".")[1] ?? ""));
  const iss = decodedJwt.iss || "";
  const aud = Array.isArray(decodedJwt.aud)
    ? decodedJwt.aud[0]
    : decodedJwt.aud || "";
  const sub = decodedJwt.sub || "";

  const combined = masterSeed + iss + aud + sub;

  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const salt = BigInt("0x" + hash.slice(0, 32));
      return salt.toString();
    }
  } catch (error) {
    console.warn(
      "Web Crypto API not available, falling back to simple hash:",
      error,
    );
  }

  // Fallback: Simple hash using built-in functions
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]!) & 0xffffffff;
  }

  // Convert to hex string and take first 32 characters
  const hashHex = Math.abs(hash).toString(16).padStart(8, "0");
  const salt = BigInt("0x" + hashHex + hashHex + hashHex + hashHex); // Repeat to get 32 chars

  return salt.toString();
}

export async function getZkProof({
  proverUrl,
  authorization,
  jwt,
  extendedEphemeralPublicKey,
  maxEpoch,
  jwtRandomness,
  salt,
}: {
  proverUrl: string;
  authorization: string;
  jwt: string;
  extendedEphemeralPublicKey: string;
  maxEpoch: number;
  jwtRandomness: string;
  salt: string;
}) {
  const response = await fetch(proverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${authorization}`,
    },
    body: JSON.stringify({
      jwt: jwt,
      extendedEphemeralPublicKey: extendedEphemeralPublicKey,
      maxEpoch: maxEpoch.toString(),
      jwtRandomness: jwtRandomness,
      salt: salt,
      keyClaimName: "sub",
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to get zk proof");
  }
  const data = await response.json();
  return data;
}
