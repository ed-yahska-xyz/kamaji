import { existsSync, readFileSync } from "node:fs";
import { timingSafeEqual } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";

const SECRET_PATH = "/run/secrets/admin_token";

const adminToken: string | undefined = (() => {
  if (existsSync(SECRET_PATH)) return readFileSync(SECRET_PATH, "utf8").trim();
  return process.env.ADMIN_TOKEN?.trim() || undefined;
})();

export const COOKIE_NAME = "kamaji_admin";

export function adminAuthConfigured(): boolean {
  return !!adminToken;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function isAdmin(c: Context): boolean {
  if (!adminToken) return false;
  const cookie = getCookie(c, COOKIE_NAME);
  if (!cookie) return false;
  return safeEqual(cookie, adminToken);
}

export function tokenMatches(token: string): boolean {
  if (!adminToken) return false;
  return safeEqual(token, adminToken);
}

export function grantAdminCookie(c: Context): void {
  if (!adminToken) return;
  setCookie(c, COOKIE_NAME, adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function revokeAdminCookie(c: Context): void {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}
