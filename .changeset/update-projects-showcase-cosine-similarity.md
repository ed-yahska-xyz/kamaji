---
"kamaji": minor
---

Bump the `projects-showcase` submodule to the latest `main`, adding the cosine-similarity article (RAG intro + sentence-embedding section) to the code gallery. The build now also copies image assets (`png`/`svg`/`jpg`/…) from `projects-showcase` into `public/`, since article-style projects embed figures via relative paths that previously 404'd in the deploy; elo's `docs/` figures and `source-data/` flag duplicates are excluded as dev-only artifacts.
