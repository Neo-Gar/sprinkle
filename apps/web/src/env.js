import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    MONGODB_URI: z.string(),
    MONGODB_DB: z.string(),
    MASTER_SEED: z.string(),
    ZK_PROVER_URL: z.string(),
    PROVER_BACKEND_KEY: z.string(),
    JWE_PUBLIC_KEY_B64: z.string(),
    JWE_PRIVATE_KEY_B64: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string(),
    NEXT_PUBLIC_AUTH_CALLBACK_URL: z.string(),
    NEXT_PUBLIC_SUI_PACKAGE_ID: z.string(),
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_AUTH_CALLBACK_URL: process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL,
    MASTER_SEED: process.env.MASTER_SEED,
    ZK_PROVER_URL: process.env.ZK_PROVER_URL,
    PROVER_BACKEND_KEY: process.env.PROVER_BACKEND_KEY,
    JWE_PUBLIC_KEY_B64: process.env.JWE_PUBLIC_KEY_B64,
    JWE_PRIVATE_KEY_B64: process.env.JWE_PRIVATE_KEY_B64,
    NEXT_PUBLIC_SUI_PACKAGE_ID: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
