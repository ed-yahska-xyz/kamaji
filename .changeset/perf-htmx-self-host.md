---
"kamaji": patch
---

Self-host htmx instead of loading from unpkg. Removes a render-blocking
third-party request whose latency varied from ~100ms to a stall, and which
blocked the home page from painting on flaky networks. The file is copied
from `node_modules/htmx.org/dist/htmx.min.js` to `public/js/htmx.min.js`
during `bun run build`, and the script tag in `Layout.tsx` now points at
the local path with `defer`.
