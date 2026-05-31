---
"kamaji": patch
---

Reduce the home-page Boids showcase from 2000 agents to 500. The iframe
is above the fold so the native `loading="lazy"` attribute is ignored,
and the WASM init at 2000 agents competes with hero render. At thumbnail
size the visual density at 500 reads the same. Reversible — just edit
the URL parameter. Follow-up (tracked separately) is an
IntersectionObserver-driven poster-to-iframe swap.
