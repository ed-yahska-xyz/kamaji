---
"kamaji": minor
---

Add manually-triggered deploy workflow. SSHes into the Linode host, pulls the selected GHCR image tag, and runs docker compose up to swap the running container. Supports deploying any published release version (default: latest) via workflow_dispatch input for easy rollback.
