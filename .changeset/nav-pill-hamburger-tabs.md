---
"kamaji": minor
---

Replace the full-width cyan navbar with a floating pill + adaptive navigation. A rounded cyan title pill ("Akshay Shinde · [subtitle]") floats top-left on every page. On tablet/desktop a small black hamburger button floats top-right and opens an anchored nav menu. On mobile (<768px) the hamburger is replaced by a bottom tab bar that mirrors the nav items — and if the item count grows past 4 the tab bar collapses to the first three primary items plus a `More` tab that opens a native `<dialog>`-based bottom sheet listing every section. Native focus trap, Esc-to-close, and backdrop-click-to-close come from the browser; the client module (`src/client/nav.ts`) is ~50 lines of vanilla DOM. Adds `data/nav.ts` as a single source of truth for nav items and active-route matching.
