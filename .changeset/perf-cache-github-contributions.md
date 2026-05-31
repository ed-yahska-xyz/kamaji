---
"kamaji": patch
---

Add `Cache-Control: public, max-age=300` to the `/api/github-contributions` response so browsers (and any reverse proxy / CDN) cache the response for 5 minutes. The home page fires the HTMX contributions request on every visit, and the upstream GraphQL roundtrip was the single largest server-side contributor to perceived home-page latency (~405ms uncached vs <1ms for everything else). Back/forward navigations and quick reloads now skip the request entirely.
