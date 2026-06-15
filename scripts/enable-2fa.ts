#!/usr/bin/env bun
/**
 * One-shot: enable TOTP two-factor for an existing user.
 *
 * Usage:
 *   DATABASE_URL=... BETTER_AUTH_SECRET=... \
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' \
 *   bun run scripts/enable-2fa.ts
 *
 * Prints an otpauth:// URI (add it to your authenticator app) plus one-time
 * backup codes, then asks for a code to confirm and activate 2FA. Set
 * TWO_FACTOR_CODE to skip the interactive prompt.
 *
 * Re-running replaces an unverified secret. If 2FA is already active, disable
 * it first (auth.api.disableTwoFactor) before re-enrolling.
 */
import { auth } from "../src/services/auth/index.ts";

if (!auth) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD?.trim();
if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  process.exit(1);
}

// 1. Sign in to obtain a session cookie (enableTwoFactor needs a session).
const signIn = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
if (!signIn.ok) {
  console.error("sign-in failed: check ADMIN_EMAIL / ADMIN_PASSWORD");
  process.exit(1);
}
const signInBody = (await signIn
  .clone()
  .json()
  .catch(() => null)) as { twoFactorRedirect?: boolean } | null;
if (signInBody?.twoFactorRedirect) {
  console.error("2FA is already enabled for this account. Disable it first to re-enroll.");
  process.exit(1);
}
const cookieHeader = (signIn.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0])
  .join("; ");
if (!cookieHeader) {
  console.error("no session cookie returned from sign-in");
  process.exit(1);
}
const headers = new Headers({ cookie: cookieHeader });

// 2. Enable 2FA — creates the secret. Not enforced until verified in step 3.
const { totpURI, backupCodes } = await auth.api.enableTwoFactor({ body: { password }, headers });

console.log("\nAdd this to your authenticator app (otpauth URI):\n");
console.log("  " + totpURI + "\n");
console.log("Backup codes (store somewhere safe — each works once):\n");
for (const code of backupCodes) console.log("  " + code);
console.log("");

// 3. Confirm with a live code to activate.
const code = (process.env.TWO_FACTOR_CODE ?? prompt("Enter the 6-digit code from your app to activate 2FA:") ?? "").trim();
if (!code) {
  console.error("no code entered; 2FA NOT activated (secret left unverified)");
  process.exit(1);
}
const verify = await auth.api.verifyTOTP({ body: { code }, headers, asResponse: true });
if (!verify.ok) {
  console.error("code did not verify; 2FA NOT activated. Re-run to try again.");
  process.exit(1);
}

console.log("\n2FA activated. Future sign-ins will require a code.");
process.exit(0);
