---
"kamaji": patch
---

Cache GitHub contributions responses in-process for 10 minutes. The home
page fires the HTMX contributions request on every visit, and the
upstream GraphQL roundtrip was the single largest server-side
contributor to perceived home-page latency (~405ms uncached vs <1ms for
everything else). Adds `Cache-Control: public, max-age=300` to the
response so back/forward navigations skip the request entirely.
Failures are not cached — transient 5xxs won't be pinned for the TTL.
