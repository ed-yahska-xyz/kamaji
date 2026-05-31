---
"kamaji": patch
---

Stop tracking `public/sw.js`. It's a build artifact — `build.ts` copies `workers/sw.js` → `public/sw.js` on every `bun run build`. Keeping it in git meant the committed copy could (and did) drift from the source whenever a PR updated `workers/sw.js` without re-running the build. Now matches how `public/js/` and `public/projects/` are already gitignored. Production Docker builds always run `bun run build` so the runtime image is unaffected.
