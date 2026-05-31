---
"kamaji": patch
---

Add Cache-Control headers to static assets served by Hono's serveStatic.
Previously every reload re-downloaded CSS/JS/WASM in full. Now: built
JS and styles.css cache for 1 hour with must-revalidate, WASM caches
for 24 hours with must-revalidate, project-showcase HTML/JS/CSS caches
for 1 hour, and /sw.js is no-cache (so service-worker updates always
reach clients). Filenames aren't content-hashed yet, so we use
must-revalidate rather than immutable.
