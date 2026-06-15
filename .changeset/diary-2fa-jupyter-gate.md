---
"kamaji": minor
---

Add TOTP two-factor auth and a cross-subdomain Jupyter sign-in gate. Diary accounts can enroll in TOTP (with backup codes) via `scripts/enable-2fa.ts`; sign-in then requires a second step at `/diary/2fa` accepting either a 6-digit code or a backup code. A new `/forward-auth` endpoint lets Caddy gate `jupyter.ed-yahska.xyz` with the diary session — it reads the database directly so revocation is immediate. The session cookie is scoped to `.ed-yahska.xyz` on the real domain so sibling subdomains receive it. Post-login redirects now resolve `next` through the URL parser, closing protocol-relative, backslash, userinfo, and non-http open-redirect bypasses, and both `/diary/login` and `/diary/2fa` are rate-limited per client IP.
