---
"kamaji": patch
---

Fix stale service-worker caching that occasionally required two hard
reloads to pick up redesigned pages. Bumps the notes cache name to
v2 so old caches evict on activate, registers a visibilitychange
handler that calls `registration.update()` when a tab returns to the
foreground, and adds an inline invalidation playbook at the top of
`workers/sw.js` so future bumps are obvious.
