import type { Context } from "hono";
import { auth, hasAuth } from "../auth/index.ts";

export { hasAuth };

export async function isAdmin(c: Context): Promise<boolean> {
  if (!auth) return false;
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  return result !== null && !!result.user;
}
