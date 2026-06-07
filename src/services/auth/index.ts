import { betterAuth, type BetterAuthOptions } from "better-auth";
import { Pool } from "pg";
import { readSecret } from "../secrets";

const databaseUrl = readSecret("database_url", "DATABASE_URL");

function trustedOrigins(): string[] {
  const env = process.env.AUTH_TRUSTED_ORIGINS;
  if (env) return env.split(",").map((s) => s.trim()).filter(Boolean);
  return ["http://localhost:3000", "https://ed-yahska.xyz"];
}

const sharedSecret =
  readSecret("better_auth_secret", "BETTER_AUTH_SECRET") ??
  databaseUrl ??
  "dev-only-insecure-secret";

function makeAuth(opts: { disableSignUp: boolean }) {
  if (!databaseUrl) return null;
  const pool = new Pool({ connectionString: databaseUrl });
  const config: BetterAuthOptions = {
    database: pool,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: true,
      disableSignUp: opts.disableSignUp,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // refresh once a day
    },
    trustedOrigins: trustedOrigins(),
    secret: sharedSecret,
    baseURL: process.env.AUTH_BASE_URL ?? "http://localhost:3000",
  };
  return betterAuth(config);
}

export const auth = makeAuth({ disableSignUp: true });

export function hasAuth(): boolean {
  return auth !== null;
}

// Only imported by scripts/seed-admin.ts. Creates a fresh auth instance
// with sign-up enabled so the first admin user can be inserted.
export function makeSeedAuth() {
  const a = makeAuth({ disableSignUp: false });
  if (!a) throw new Error("DATABASE_URL is required to seed the admin user");
  return a;
}
