#!/usr/bin/env bun
/**
 * One-shot script to create the single admin user.
 *
 * Usage:
 *   DATABASE_URL=... ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... bun run scripts/seed-admin.ts
 *
 * Idempotent: re-running with the same email is a no-op.
 */
import { makeSeedAuth } from "../src/services/auth/index.ts";

const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD?.trim();
const name = process.env.ADMIN_NAME?.trim() || "Admin";

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  process.exit(1);
}
if (password.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters");
  process.exit(1);
}

const auth = makeSeedAuth();

try {
  await auth.api.signUpEmail({
    body: { email, password, name },
  });
  console.log(`created admin user: ${email}`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  if (/already exists|USER_ALREADY_EXISTS|duplicate key/i.test(msg)) {
    console.log(`admin user already exists: ${email}`);
  } else {
    console.error("failed to create admin:", msg);
    process.exit(1);
  }
}

process.exit(0);
