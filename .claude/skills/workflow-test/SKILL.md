---
name: workflow-test
description: Generate a GitHub Actions test workflow that runs on PRs. Use when setting up CI testing for a project.
disable-model-invocation: true
argument-hint: "[runtime: bun|node|deno] [test-command]"
allowed-tools: Bash(mkdir *) Write Read Glob Grep
---

# Generate a Test Workflow

Create a GitHub Actions workflow at `.github/workflows/test.yml` that runs the project's test suite on every pull request to the main branch.

## Gather context

Before generating, determine the project's setup:

1. **Runtime**: Use `$ARGUMENTS[0]` if provided. Otherwise, detect from the repo:
   - `bun.lock`, `bun.lockb`, or `bunfig.toml` -> bun (use `oven-sh/setup-bun@v2`). `bun.lock` is the text-format lockfile (Bun ≥1.2 default); `bun.lockb` is the older binary format.
   - `pnpm-lock.yaml` -> node with pnpm
   - `yarn.lock` -> node with yarn
   - `package-lock.json` -> node with npm
   - `deno.lock` -> deno
   - `go.mod` -> go (use `actions/setup-go@v5`)
   - `Cargo.toml` -> rust (use `dtolnay/rust-toolchain@stable`)
   - `pyproject.toml` / `requirements.txt` -> python (use `actions/setup-python@v5`)
2. **Test command**: Use `$ARGUMENTS[1]` if provided. Otherwise, read `package.json` scripts for a `test` script, or use the runtime's default test command.
3. **Main branch name**: Check if the repo uses `main` or `master`.

## Workflow structure

```yaml
name: Tests

on:
  pull_request:
    branches: [<main-branch>]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - # Setup runtime step (runtime-specific)
      - # Install dependencies step
      - # Run tests step
```

## Rules

- Keep it minimal: one job, one runner, no matrix unless the user asks.
- Use the latest stable versions of setup actions.
- Include `bun-version: latest` for bun, or equivalent version pinning for other runtimes.
- Do NOT add linting, type-checking, or build steps unless the user asks.
- **Preserve sibling env vars**: Before writing, glob `.github/workflows/*.yml` for a top-level `env:` block. If sibling workflows share env vars (e.g. `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` to silence the Node 20 → 24 deprecation warnings on JS actions), include the same block here so the new workflow stays consistent with the project's existing CI conventions.
- If `.github/workflows/test.yml` already exists, show the user the diff and ask before overwriting.
