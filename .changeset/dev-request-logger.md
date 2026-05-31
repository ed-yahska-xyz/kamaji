---
"kamaji": patch
---

Add Hono's built-in request logger middleware to the server, gated to dev only (`NODE_ENV !== "production"`). Surfaces per-request method, path, status, and duration on stdout to make it obvious which request — typically `/api/github-contributions` — is the bottleneck when the home page feels slow. No behavior change in production.
