---
name: workflow-release
description: Generate a GitHub Actions release workflow using changesets. Handles versioning PRs, GitHub releases, and optional container image builds. Use when setting up automated releases for a project.
disable-model-invocation: true
argument-hint: "[runtime: bun|node] [--with-docker] [--registry ghcr.io|docker.io]"
allowed-tools: Bash(mkdir *) Write Read Glob Grep
---

# Generate a Release Workflow

Create a GitHub Actions workflow at `.github/workflows/release.yml` that automates versioning and releasing using [changesets/action](https://github.com/changesets/action).

## How the two-phase pattern works

This workflow runs on every push to the main branch and operates in two phases:

1. **Phase 1 — Version PR**: When unreleased changesets exist, the action opens (or updates) a PR titled `chore: version packages` containing bumped versions and changelog updates.
2. **Phase 2 — Publish**: When that version PR is merged (no pending changesets remain), the workflow reads the version from `package.json`, compares it against the latest GitHub Release tag, and creates a new tag + GitHub Release if the version changed.

An optional downstream job builds and pushes a container image when a new version is published.

## Gather context

1. **Runtime**: Use `$ARGUMENTS[0]` if provided. Otherwise, detect from lock files.
2. **Main branch name**: Check `main` vs `master`.
3. **Docker**: If `--with-docker` is in the arguments, include the container build job. Look for a `Dockerfile` in the repo root to confirm the path.
4. **Container registry**: Default to `ghcr.io`. Use `--registry` argument if provided.
5. **Changesets config**: Check for `.changeset/config.json`. If missing, inform the user they need to run `changeset init`.
6. **Package name**: Read from `package.json` `name` field for image naming.

## Workflow structure

```yaml
name: Release

on:
  push:
    branches: [<main-branch>]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Version & Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      # Add packages: write only if Docker is included
    outputs:
      published: ${{ steps.changesets.outputs.hasChangesets == 'false' && steps.version-check.outputs.changed == 'true' }}
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@v5
      - # Setup runtime
      - # Install dependencies

      - name: Create Release Pull Request or Tag & Release
        id: changesets
        uses: changesets/action@v1
        with:
          version: <pkg-manager> run version
          publish: <pkg-manager> run release
          commit: "chore: version packages"
          title: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Get version
        id: version
        if: steps.changesets.outputs.hasChangesets == 'false'
        run: echo "version=$(jq -r '.version' package.json)" >> "$GITHUB_OUTPUT"

      - name: Check if version changed
        id: version-check
        if: steps.changesets.outputs.hasChangesets == 'false'
        run: |
          CURRENT="v${{ steps.version.outputs.version }}"
          LATEST=$(gh release view --json tagName -q '.tagName' 2>/dev/null || echo "none")
          if [ "$CURRENT" != "$LATEST" ]; then
            echo "changed=true" >> "$GITHUB_OUTPUT"
          else
            echo "changed=false" >> "$GITHUB_OUTPUT"
          fi
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Create GitHub Release
        if: steps.changesets.outputs.hasChangesets == 'false' && steps.version-check.outputs.changed == 'true'
        run: |
          gh release create "v${{ steps.version.outputs.version }}" \
            --title "v${{ steps.version.outputs.version }}" \
            --generate-notes
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # Include this job only if --with-docker was specified
  container:
    name: Build & Push Container
    needs: release
    if: needs.release.outputs.published == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v5

      - uses: docker/login-action@v3
        with:
          registry: <registry>
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}  # or secrets.DOCKER_TOKEN for Docker Hub

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            <registry>/${{ github.repository }}:latest
            <registry>/${{ github.repository }}:v${{ needs.release.outputs.version }}
```

## Rules

- Use a `concurrency` group to prevent overlapping runs.
- The release job needs `contents: write` and `pull-requests: write` permissions.
- Only add `packages: write` when the container job is included.
- The version check makes the workflow idempotent — re-running on an already-released commit is a no-op.
- Ensure `package.json` has `version` and `release` scripts. If not, tell the user what to add (e.g., `"version": "changeset version"`, `"release": "echo released"`).
- Do NOT include the container job unless `--with-docker` is specified or the user asks for it.
- **Preserve sibling env vars**: Before writing, glob `.github/workflows/*.yml` for a top-level `env:` block. If sibling workflows share env vars (e.g. `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` to silence the Node 20 → 24 deprecation warnings on JS actions), include the same block here so the new workflow stays consistent with the project's existing CI conventions.
- If `.github/workflows/release.yml` already exists, show the user the diff and ask before overwriting. Watch for project-specific customizations like cross-repo `sparse-checkout`, build secrets (`secrets:` on `build-push-action`), or custom Dockerfile paths — these aren't in the template and a regeneration will clobber them.
