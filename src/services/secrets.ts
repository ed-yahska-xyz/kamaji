import { readFileSync, existsSync } from "fs";

/**
 * Read a secret the same way the rest of the app does (see
 * src/services/linode-s3/index.ts): prefer the Docker secret file mounted at
 * /run/secrets/<name>, fall back to the named env var for local dev.
 */
export function readSecret(name: string, envVar: string): string | undefined {
  const path = `/run/secrets/${name}`;
  if (existsSync(path)) return readFileSync(path, "utf8").trim();
  return process.env[envVar];
}
