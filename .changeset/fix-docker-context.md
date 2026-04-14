---
"kamaji": patch
---

Fix container build failing to find Dockerfile. Without an explicit context, docker/build-push-action was using the GitHub git context of the triggering repo instead of the local working directory where the virtuals repo was checked out. Added context: . to use the checked-out sparse-checkout.
