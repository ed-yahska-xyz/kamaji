---
"kamaji": minor
---

Replace the GitHub contributions heatmap with a daily diary system: clickable per-day grid (pinned to America/Los_Angeles), multi-paragraph entries with auto-extracted hashtags, and a `/diary/search` page supporting multi-tag chronological search. Authentication moves from a cookie-token scheme to Better Auth (email+password, opaque server-side sessions in Postgres) with sign-up disabled. DB credentials and the auth secret are read as Docker secrets from `/run/secrets/*` with env fallback.
