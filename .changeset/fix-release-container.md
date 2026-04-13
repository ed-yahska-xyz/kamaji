---
"kamaji": patch
---

Fix container build always being skipped on release. Use hasChangesets output instead of published (which is never true for private packages), with a version-changed guard to prevent false triggers on PRs without changesets.
