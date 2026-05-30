---
name: workflow-changeset-check
description: Generate a GitHub Actions workflow that checks PRs for changesets. Use when adding changeset-based versioning to a project.
disable-model-invocation: true
argument-hint: "[runtime: bun|node]"
allowed-tools: Bash(mkdir *) Write Read Glob Grep
---

# Generate a Changeset Check Workflow

Create a GitHub Actions workflow at `.github/workflows/changeset-check.yml` that warns when a pull request is missing a changeset file.

This workflow complements the [changesets](https://github.com/changesets/changesets) versioning strategy. It does NOT fail the build — it posts a warning in the job summary so maintainers can decide whether a changeset is needed.

## Gather context

1. **Runtime**: Use `$ARGUMENTS[0]` if provided. Otherwise, detect from lock files (same detection as workflow-test).
2. **Main branch name**: Check if the repo uses `main` or `master`.
3. **Changesets installed**: Check if `@changesets/cli` is in `package.json` devDependencies. If not, inform the user they need to install it (`bun add -D @changesets/cli && bun run changeset init` or equivalent).

## Workflow structure

```yaml
name: Changeset Check

on:
  pull_request:
    branches: [<main-branch>]

jobs:
  changeset-check:
    name: Check for changesets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - # Setup runtime
      - # Install dependencies

      - name: Check for changesets
        run: |
          CHANGESETS=$(git diff --name-only origin/<main-branch>...HEAD -- '.changeset/*.md' | grep -v README.md || true)

          if [ -z "$CHANGESETS" ]; then
            echo "::warning::No changeset found. If this PR includes user-facing changes, run \`<pkg-manager> run changeset\` to add one."
            echo ""
            echo "## Warning: No Changeset Found" >> "$GITHUB_STEP_SUMMARY"
            echo "" >> "$GITHUB_STEP_SUMMARY"
            echo "This PR does not include a changeset. If it includes user-facing changes, please run:" >> "$GITHUB_STEP_SUMMARY"
            echo "" >> "$GITHUB_STEP_SUMMARY"
            echo '```sh' >> "$GITHUB_STEP_SUMMARY"
            echo "<pkg-manager> run changeset" >> "$GITHUB_STEP_SUMMARY"
            echo '```' >> "$GITHUB_STEP_SUMMARY"
            echo "" >> "$GITHUB_STEP_SUMMARY"
            echo "If this change doesn't need a release, add an empty changeset:" >> "$GITHUB_STEP_SUMMARY"
            echo "" >> "$GITHUB_STEP_SUMMARY"
            echo '```sh' >> "$GITHUB_STEP_SUMMARY"
            echo "<pkg-manager> run changeset -- --empty" >> "$GITHUB_STEP_SUMMARY"
            echo '```' >> "$GITHUB_STEP_SUMMARY"
          else
            echo "Changesets found:"
            echo "$CHANGESETS"
            echo "## Changeset Found" >> "$GITHUB_STEP_SUMMARY"
            echo "" >> "$GITHUB_STEP_SUMMARY"
            echo "The following changesets are included:" >> "$GITHUB_STEP_SUMMARY"
            echo "$CHANGESETS" | while read -r f; do echo "- \`$f\`" >> "$GITHUB_STEP_SUMMARY"; done
          fi
```

## Rules

- Use `fetch-depth: 0` on checkout so `git diff` can compare against the base branch.
- The check is a **warning, not a failure** — do not `exit 1` when changesets are missing.
- Replace `<pkg-manager>` with the detected package manager (bun, npm, yarn, pnpm).
- Replace `<main-branch>` with the actual main branch name.
- **Preserve sibling env vars**: Before writing, glob `.github/workflows/*.yml` for a top-level `env:` block. If sibling workflows share env vars (e.g. `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` to silence the Node 20 → 24 deprecation warnings on JS actions), include the same block here so the new workflow stays consistent with the project's existing CI conventions.
- If `.github/workflows/changeset-check.yml` already exists, show the user the diff and ask before overwriting.
