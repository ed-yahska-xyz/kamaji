# Kamaji - Professional Bio & Blog Project

## Project Overview
Personal website featuring professional bio and blog, built with Bun + HTMX.

## Color Scheme (Cyberpunk-Inspired)
- Primary Yellow: #FCE300 (background)
- Dark Yellow: #B8A000
- Olive Green: #5A5632 (navigation)
- Black: #000000 (text & accents)
- Dark Gray: #1A1A1A
- Gold Accent: #D4AF37

**Design Style**: Inspired by Cyberpunk 2077 website - clean, bold, with yellow background and black text for high contrast and readability.

## Personal Information
- Name: Akshay Shinde
- Birthdate: July 1, 1991
- Education: Masters of Computer Science from Oregon State University
- Interests: Front End Development, AI, Computer Graphics, Software Engineering

## Progress Tracker

### Completed
- [x] Initial project setup
- [x] Bun server configuration with routes (/, /blog, /api/blog-posts)
- [x] Bio page HTML structure with HTMX integration
- [x] CSS styling with Cyberpunk-inspired color scheme
- [x] HTMX integration for dynamic content
- [x] Blog page structure with filtering
- [x] Theme redesign - Cyberpunk 2077 inspired (yellow bg, black text, brutalist cards)

### To Do
- Add actual blog post content
- Create API endpoints for interest details
- Add contact form functionality
- Content management system
- Deployment setup

## Tech Stack
- Runtime: Bun
- Frontend: HTMX + HTML + CSS
- Server: Hono (with Hono JSX for server-side rendering)
- Database: PostgreSQL 16 (diary entries) via `postgres` driver

## Environment

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Diary read/write, auth | `postgres://user:pw@host:5432/diary`. If unset, diary + auth features degrade gracefully. |
| `BETTER_AUTH_SECRET` | Signing session tokens | Long random string. Rotate to invalidate every session. |
| `AUTH_BASE_URL` | Auth redirects | Public origin, e.g. `https://ed-yahska.xyz`. Defaults to `http://localhost:3000`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | One-shot admin seed only | Used by `scripts/seed-admin.ts`. Not read at runtime. |
| `LINODE_S3_CLUSTER_ID`, `LINODE_S3_BUCKET_NAME`, `LINODE_S3_READ_*` | Notes browsing | Existing. |

Sign-up is **disabled** at the HTTP layer. Only the one user created by the seed script can sign in.

## Auth (Better Auth)

Sessions are stored server-side in Postgres (`session` table). The cookie holds an opaque token — leaking it leaks one session, not the master credential. Revoke by deleting the row. Revocation is **immediate for the Jupyter gate** (`/forward-auth` reads the DB via `disableCookieCache`) but the diary admin UI trusts `session.cookieCache` and can lag **up to 5 min** (`auth/index.ts`).

- Library: [`better-auth`](https://www.better-auth.com/) with the built-in Kysely + `pg` adapter, plus the `twoFactor` plugin (TOTP).
- Tables: `user`, `session`, `account`, `verification` (migration `0002_auth.sql`), `twoFactor` + `user.twoFactorEnabled` (migration `0003_two_factor.sql`) — both in `../blogs/db`.
- Routes mounted at `/api/auth/*` (managed by Better Auth).
- Our wrapper at `POST /diary/login` accepts a plain HTML form, hands it to `auth.api.signInEmail`, and forwards the session cookie. Logout via `GET /diary/logout`.
- Hash algorithm: scrypt (Better Auth default).

### Two-factor (TOTP)

- Enroll once with `scripts/enable-2fa.ts` (wrapper: `scripts/enable-2fa.sh`) — signs in, prints an `otpauth://` URI + backup codes, then confirms a code to activate. **Save the backup codes** — they are the only recovery path if you lose the authenticator.
- When enabled, `signInEmail` returns `{ twoFactorRedirect: true }` + a short-lived two-factor cookie instead of a full session. `POST /diary/login` detects this and bounces to `GET /diary/2fa`; `POST /diary/2fa` accepts a 6-digit TOTP (`verifyTOTP`) or a backup code (`verifyBackupCode`, format `xxxxx-xxxxx`) and forwards the resulting session cookie. A fully-issued session therefore implies 2FA was completed.
- `POST /diary/login` and `POST /diary/2fa` are rate-limited (10 attempts / 5 min per IP) to bound TOTP brute force.

### Cross-subdomain / Jupyter gate

- On the real domain, the session cookie is scoped to `.ed-yahska.xyz` (`advanced.crossSubDomainCookies`) so siblings like `jupyter.ed-yahska.xyz` receive it; disabled on localhost. `session.cookieCache` (5 min) avoids a DB hit per request for the diary UI; the Jupyter gate opts out (see above).
- `GET /forward-auth` is the Caddy `forward_auth` target for the Jupyter subdomain: 200 (+ `X-User-Email`) when a session exists, else 302 to `/diary/login?next=<original URL>`. `safeRedirect` resolves `next` through the URL parser and only allows relative paths or `*.ed-yahska.xyz` — this closes protocol-relative, backslash, userinfo, and non-http open-redirect bypasses. See `../virtuals/kamaji/Caddyfile`.

## Diary

The home page heatmap shows paragraph counts per day for the trailing 52 weeks. Each cell links to `/diary/YYYY-MM-DD`.

- Schema and migrations live in [`../blogs/db/`](../blogs/db). Run `bun run migrate` there against `DATABASE_URL`.
- Postgres runs as a service in `../virtuals/kamaji/docker-compose.yml`.
- Write flow: sign in at `/diary/login` → `/diary/new` → POST `/api/diary/paragraphs` → redirected to `/diary/:date`.
- Hashtags (`#word`) in paragraph bodies are auto-extracted at write time and searchable at `/diary?tag=<word>`.

### Local diary dev

```bash
# 1. Start Postgres
cd ../virtuals/kamaji
POSTGRES_PASSWORD=devpass docker compose up -d postgres

# 2. Apply schema + seed
cd ../../blogs/db
bun install
DATABASE_URL=postgres://kamaji:devpass@localhost:5432/diary bun run migrate
DATABASE_URL=postgres://kamaji:devpass@localhost:5432/diary bun run seed   # optional

# 3. Create the admin user (one-shot)
cd ../../kamaji
DATABASE_URL=postgres://kamaji:devpass@localhost:5432/diary \
  ADMIN_EMAIL=you@example.com \
  ADMIN_PASSWORD='a-strong-password-here' \
  bun run scripts/seed-admin.ts

# 4. Run kamaji
DATABASE_URL=postgres://kamaji:devpass@localhost:5432/diary \
  BETTER_AUTH_SECRET=dev-secret-please-replace-in-prod \
  bun run dev

# Sign in at http://localhost:3000/diary/login
```

To expose Postgres to the host for local kamaji, add `ports: ["5432:5432"]` to the `postgres` service in a compose override.

## Build Process

### Development
```bash
bun run dev    # Builds client + runs server with hot reload
```

### Production Build
```bash
bun run build  # Compiles everything for production
bun run start  # Runs pre-compiled server
```

### What `bun run build` does:
1. **Zig WASM** - Compiles `projects-showcase/boids/wasm` to WebAssembly
2. **Client TypeScript** - Bundles `src/client/*.ts` to `public/js/`
3. **Static Assets** - Copies HTML/JS/CSS/WASM from `projects-showcase/` to `public/`
4. **Server TSX** - Pre-compiles `index.tsx` and all components/pages to `dist/index.js`

### Output Structure
```
dist/
  index.js       # Bundled server (all TSX pre-compiled to JS)
public/
  js/            # Client-side scripts
  projects-showcase/  # Static project files
```

### Docker Deployment
The server TSX is pre-compiled to avoid runtime JSX transformation issues:
- Build: `bun run build`
- Run: `bun run dist/index.js` (or `bun run start`)

### Dev vs production — perf testing

- `bun run dev` rebuilds and runs `bun --watch index.tsx`. TSX is re-evaluated per request and the watcher adds restart overhead — fine for iteration, **not** representative of production latency.
- `bun run start` runs the pre-bundled `dist/index.js` with `NODE_ENV=production`. Use this for any latency measurement.
- When debugging a slow request in dev, watch the terminal — the Hono request logger (gated on `NODE_ENV !== "production"`) prints method/path/status/duration per request. Production stays silent.

## Design Notes
- **Inspiration**: Cyberpunk 2077 official website aesthetic
- **Key Features**:
  - Yellow (#FCE300) background for bold, futuristic look
  - Black text for maximum contrast and readability
  - Olive green (#5A5632) navigation for depth
  - Brutalist card design with sharp corners and bold shadows
  - Box shadows instead of rounded corners for modern, edgy feel
  - Uppercase typography with letter-spacing for tech aesthetic
  - Hover effects with shadow translation for depth
