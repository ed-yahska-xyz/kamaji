import { betterAuth, type BetterAuthOptions } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { Pool } from "pg";
import { readSecret } from "../secrets";

const databaseUrl = readSecret("database_url", "DATABASE_URL");

// Single source of truth for our public origin. Reused by index.tsx so the
// login/forward-auth redirects can't drift from what Better Auth signs against.
export const authBaseUrl = process.env.AUTH_BASE_URL ?? "http://localhost:3000";
const baseURL = authBaseUrl;

function trustedOrigins(): string[] {
  const env = process.env.AUTH_TRUSTED_ORIGINS;
  if (env) return env.split(",").map((s) => s.trim()).filter(Boolean);
  return [
    "http://localhost:3000",
    "https://ed-yahska.xyz",
    "https://jupyter.ed-yahska.xyz",
  ];
}

// When served from the real domain, scope the session cookie to the parent
// domain so the browser also sends it to sibling subdomains (e.g.
// jupyter.ed-yahska.xyz). This is what lets Caddy `forward_auth` gate Jupyter
// with our session. Disabled on localhost/IP, where a dotted parent domain
// would be rejected by the browser.
function crossSubDomain(): string | null {
  try {
    const host = new URL(baseURL).hostname;
    if (host === "ed-yahska.xyz" || host.endsWith(".ed-yahska.xyz")) {
      return ".ed-yahska.xyz";
    }
  } catch {
    /* fall through */
  }
  return null;
}

const sharedSecret =
  readSecret("better_auth_secret", "BETTER_AUTH_SECRET") ??
  databaseUrl ??
  "dev-only-insecure-secret";

function makeAuth(opts: { disableSignUp: boolean }) {
  if (!databaseUrl) return null;
  const pool = new Pool({ connectionString: databaseUrl });
  const cookieDomain = crossSubDomain();
  // `satisfies` (not `: BetterAuthOptions`) so the plugins tuple is preserved
  // and Better Auth infers the two-factor methods onto `auth.api`.
  const config = {
    database: pool,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: true,
      disableSignUp: opts.disableSignUp,
    },
    // TOTP two-factor. Once a user enables it, sign-in returns a
    // `twoFactorRedirect` instead of a session until the code is verified.
    plugins: [twoFactor({ issuer: "ed-yahska.xyz" })],
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // refresh once a day
      // Validate the signed cookie without a DB round-trip. Matters because
      // Caddy `forward_auth` hits /forward-auth on every Jupyter request.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    trustedOrigins: trustedOrigins(),
    ...(cookieDomain
      ? { advanced: { crossSubDomainCookies: { enabled: true, domain: cookieDomain } } }
      : {}),
    secret: sharedSecret,
    baseURL,
  } satisfies BetterAuthOptions;
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
