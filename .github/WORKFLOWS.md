# GitHub Workflows

This directory contains GitHub Actions workflows that automate testing, versioning, releasing, and deployment. Together they implement a **changeset-driven release pipeline** with a manually triggered deploy step.

## Overview

| Workflow | Trigger | Purpose |
|---|---|---|
| `test.yml` | Pull request to `main` | Run the test suite |
| `changeset-check.yml` | Pull request to `main` | Warn if a PR lacks a changeset |
| `release.yml` | Push to `main` | Version packages, tag releases, build & push container image |
| `deploy.yml` | Manual dispatch | Pull a released image onto the production host |

The flow:

```
PR opened ──► test.yml + changeset-check.yml
              │
              ▼
         Merge to main
              │
              ▼
         release.yml ──► opens a "version packages" PR
              │          (or, if that PR is merged, cuts
              │           a tag + GitHub Release + container image)
              ▼
      Operator runs deploy.yml manually ──► SSH into host, pull new image
```

---

## `test.yml` — Tests

Runs on every pull request targeting `main`.

- Checks out the code, installs the runtime, installs dependencies, runs the test command.
- Keeps the fast feedback loop cheap: one job, one runner, no matrix.
- Acts as a required status check before a PR can merge.

## `changeset-check.yml` — Changeset Check

Runs on every pull request targeting `main`. Enforces the [Changesets](https://github.com/changesets/changesets) convention: contributors describe user-facing changes in a small markdown file under `.changeset/`, and the release workflow later consumes those files to compute version bumps and changelogs.

- Diffs the PR against `main` and looks for added files in `.changeset/` (excluding the README).
- If none are found, posts a non-blocking warning in the job summary with instructions to create one (either a real changeset or an empty one for changes that don't need to be released).
- If any are found, lists them in the summary as confirmation.

The check is a **warning, not a hard failure** — this is deliberate so maintainers can merge PRs that genuinely don't need a release entry without fighting CI.

## `release.yml` — Version & Release

Runs on every push to `main` and is the heart of the automation. It uses [`changesets/action`](https://github.com/changesets/action) to turn accumulated changeset files into actual releases in a two-phase pattern.

### How it works

1. **Phase 1 — Open a "Version Packages" PR.** When unreleased changesets exist, the action opens (or updates) a PR titled `chore: version packages`. That PR contains the proposed version bumps and changelog updates. Nothing ships yet.
2. **Phase 2 — Publish.** When the version PR is merged, this same workflow runs again, sees no pending changesets, reads the new version from `package.json`, compares it against the latest GitHub Release tag, and — if it has changed — creates a new tag and a GitHub Release with auto-generated notes.

A `concurrency` group prevents overlapping runs on the same branch from racing.

### Container build

When phase 2 actually publishes a new version, a downstream `container` job runs:

- Logs into GitHub Container Registry (`ghcr.io`).
- Builds the project's Docker image and pushes it with two tags: the exact version (`v1.2.3`) and `latest`.
- In this repo the Dockerfile lives in a **separate private repository**, so the job checks that repo out with a sparse-checkout (only the relevant directory) using a personal access token stored as a secret. A build-arg secret lets the Dockerfile itself clone further private dependencies if needed. Most projects will simply check out the current repo and build from its own Dockerfile.

### Permissions

The release job needs elevated permissions: `contents: write` (to push tags/commits), `pull-requests: write` (to open the version PR), and `packages: write` (to push the image).

## `deploy.yml` — Deploy

Manually triggered (`workflow_dispatch`) with a single input: the image tag to deploy (e.g. `v1.2.3` or `latest`). Separating deploy from release means shipping is an explicit human decision, not an automatic consequence of merging.

Two jobs:

1. **Validate** — If a specific version was requested, verify that a GitHub Release with that tag actually exists. Fails fast with a clear error otherwise.
2. **Deploy** — Gated on a GitHub **Environment** (`production`), which can require reviewer approval and scope secrets to this job. SSHes into the production host using stored credentials and runs:
   - `git pull` to refresh any host-side config (e.g. `docker-compose.yml`),
   - `docker compose pull` to fetch the requested image,
   - `docker compose up -d` to restart the service,
   - `docker compose ps` to surface the resulting state in the log.

The chosen version is passed to the host as an environment variable so the compose file can pin to it.

---

## Supporting files

- **`CODEOWNERS`** — Assigns default reviewers for PRs. A single catch-all entry routes every file to one owner/team; more specific patterns can be added to route subtrees to different owners.

## Secrets & configuration referenced

The workflows expect these to be configured in repo / environment settings:

| Name | Used by | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | all workflows | Built-in; used for release creation, package push, API calls |
| Deploy host / user / SSH key | `deploy.yml` | SSH access to the production server |
| Deploy path | `deploy.yml` | Directory on the host containing the compose file |
| Cross-repo PAT | `release.yml` | Read access to the external Dockerfile repository (only needed when the Dockerfile lives outside this repo) |

## Design notes

- **Changesets over conventional commits.** Contributors explicitly declare intent in a file rather than relying on commit-message parsing. The cost is an extra file per PR; the benefit is that release notes are written at PR time by the person who knows what changed.
- **Release ≠ Deploy.** Tagging and publishing an image is automatic; putting that image in front of users is a separate manual step gated by an environment. This keeps bad merges out of production and makes rollbacks as simple as re-running deploy with an older tag.
- **`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`.** Pins the Node runtime that JavaScript actions execute under. Useful when actions emit deprecation warnings on older default Node versions.
- **Idempotency in the version check.** The release job only cuts a new GitHub Release when `package.json`'s version differs from the latest tag — so re-running the workflow on an already-released commit is a no-op.
