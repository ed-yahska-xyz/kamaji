---
"kamaji": patch
---

Fix container build failing with "no such file or directory" for kamaji/Dockerfile. The sparse-checkout was using cone mode (default), which only accepts directory paths. Changed to checkout the whole kamaji directory from the virtuals repo.
