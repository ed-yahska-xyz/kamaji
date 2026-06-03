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
| `DATABASE_URL` | Diary read/write | `postgres://user:pw@host:5432/diary`. If unset, diary features degrade gracefully (home grid renders empty, /diary/:date shows "no entry"). |
| `ADMIN_TOKEN` | Writing diary entries | Single-user admin token. Visit `/diary/login?token=…` once to set the cookie. |
| `LINODE_S3_CLUSTER_ID`, `LINODE_S3_BUCKET_NAME`, `LINODE_S3_READ_*` | Notes browsing | Existing. |
| `CONTRIBUTIONS_PAT` | — | **Removed** — GitHub contributions replaced by the diary. |

Production reads `ADMIN_TOKEN` from `/run/secrets/admin_token` (Docker secret) when present; falls back to env var.

## Diary

The home page heatmap shows paragraph counts per day for the trailing 52 weeks. Each cell links to `/diary/YYYY-MM-DD`.

- Schema and migrations live in [`../blogs/db/`](../blogs/db). Run `bun run migrate` there against `DATABASE_URL`.
- Postgres runs as a service in `../virtuals/kamaji/docker-compose.yml`.
- Write flow: `/diary/login?token=<ADMIN_TOKEN>` → `/diary/new` → POST `/api/diary/paragraphs` → redirected to `/diary/:date`.
- Hashtags (`#word`) in paragraph bodies are auto-extracted at write time and searchable at `/diary?tag=<word>`.

### Local diary dev

```bash
# 1. Start Postgres
cd ../virtuals/kamaji
POSTGRES_PASSWORD=devpass ADMIN_TOKEN=devtoken docker compose up -d postgres

# 2. Apply schema + seed
cd ../../blogs/db
bun install
DATABASE_URL=postgres://kamaji:devpass@localhost:5432/diary bun run migrate
DATABASE_URL=postgres://kamaji:devpass@localhost:5432/diary bun run seed   # optional

# 3. Run kamaji against it
cd ../../kamaji
DATABASE_URL=postgres://kamaji:devpass@localhost:5432/diary ADMIN_TOKEN=devtoken bun run dev
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
