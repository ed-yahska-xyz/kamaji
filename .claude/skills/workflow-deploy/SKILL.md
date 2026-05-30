---
name: workflow-deploy
description: Generate a GitHub Actions manual deploy workflow. Supports SSH-based deploys with docker compose, or other strategies. Use when adding a deploy workflow to a project.
disable-model-invocation: true
argument-hint: "[strategy: ssh-docker|ssh-script]"
allowed-tools: Bash(mkdir *) Write Read Glob Grep
---

# Generate a Deploy Workflow

Create a GitHub Actions workflow at `.github/workflows/deploy.yml` that deploys a released version to production via manual trigger (`workflow_dispatch`).

Separating deploy from release means shipping is an explicit human decision, not an automatic consequence of merging.

## Gather context

1. **Strategy**: Use `$ARGUMENTS[0]` if provided. Otherwise, default to `ssh-docker`.
   - `ssh-docker`: SSH into host, pull a Docker image, restart with `docker compose`.
   - `ssh-script`: SSH into host, run a deploy script.
2. **Environment**: Always use a GitHub Environment named `production` so the deploy job can require reviewer approval and scope secrets.
3. **Existing workflow**: Check if `.github/workflows/deploy.yml` already exists.

## Workflow structure

```yaml
name: Deploy

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Image tag to deploy (e.g. v1.2.3, or "latest")'
        required: true
        default: 'latest'
        type: string

jobs:
  validate:
    name: Validate release
    runs-on: ubuntu-latest
    steps:
      - name: Verify release exists
        if: inputs.version != 'latest'
        run: |
          if ! gh release view "${{ inputs.version }}" -R ${{ github.repository }} >/dev/null 2>&1; then
            echo "::error::Release ${{ inputs.version }} not found in ${{ github.repository }}"
            exit 1
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  deploy:
    name: Deploy to production
    needs: validate
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      packages: read   # only needed for ssh-docker pulling from ghcr
    steps:
      - name: SSH and redeploy
        uses: appleboy/ssh-action@v1
        env:
          # Forward variables you don't want templated directly into the script body.
          GHCR_USER: ${{ github.actor }}
          GHCR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          DEPLOY_VERSION: ${{ inputs.version }}
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          envs: GHCR_USER,GHCR_TOKEN,DEPLOY_VERSION
          script: |
            set -euo pipefail
            cd "${{ secrets.DEPLOY_PATH }}"
            # Strategy-specific commands here
```

`appleboy/ssh-action` only forwards env vars listed in `envs:` to the remote shell. Use it to keep tokens out of the script body's `${{ }}` interpolation — values arrive as real env vars on the host instead.

### ssh-docker strategy

The deploy script on the host:

```bash
git pull origin <main-branch>
export APP_VERSION="$DEPLOY_VERSION"
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT
docker compose pull <service-name>
docker compose up -d <service-name>
docker compose ps
```

Notes on the docker login step:

- For ghcr images **owned by the same repo whose workflow is running**, the built-in `secrets.GITHUB_TOKEN` works as the password — no PAT needed. Requires `permissions: packages: read` on the job.
- For ghcr images in a **different namespace**, or any other private registry, swap in a long-lived `read:packages` PAT stored as a separate secret (e.g. `GHCR_PULL_PAT`).
- `--password-stdin` keeps the token off the process command line and out of shell history.
- The `trap … EXIT` runs `docker logout` even if `pull`/`up` fails, so the host's `~/.docker/config.json` never holds a stale or expired token. The image stays in the local image cache, so the running container is unaffected by the logout.
- This means **no manual `docker login` on the host is needed** — auth happens fresh every deploy.

Ask the user for:
- The docker compose service name (or read it from `docker-compose.yml` if it exists).
- The environment variable name their compose file uses for the image tag.

### ssh-script strategy

The deploy script on the host:

```bash
git pull origin <main-branch>
./deploy.sh "${{ inputs.version }}"
```

Tell the user they need a `deploy.sh` script on the host.

## Required secrets

Tell the user to configure these under Settings > Environments > `production` > Environment secrets (not repo-level secrets — the deploy job runs under `environment: production` and only resolves secrets scoped there):

| Secret | Purpose |
|---|---|
| `DEPLOY_HOST` | Hostname or IP of the production server |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | Private SSH key (full file contents, including `-----BEGIN`/`-----END` lines and trailing newline) |
| `DEPLOY_PATH` | Absolute directory on the host containing the compose file or deploy script (no trailing slash, no quotes) |

Recommend creating a GitHub Environment named `production` with required reviewers and a branch restriction (`main` only) for an approval/scope gate.

## Pre-deploy host preparation

Before the first deploy will succeed, the user must do these one-time steps on the host. The deploy workflow does not provision them — it just consumes them.

### 1. Authorize the SSH key

Generate a deploy-only keypair locally (ed25519, no passphrase) and copy the public key into the deploy user's `~/.ssh/authorized_keys` on the host:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/<name> -N "" -C "<purpose>"
ssh-copy-id -i ~/.ssh/<name>.pub <DEPLOY_USER>@<DEPLOY_HOST>
```

Then paste the **private** key file into the `DEPLOY_SSH_KEY` secret. Common gotchas:
- Pasting the `.pub` file by mistake → `ssh: handshake failed: unable to authenticate`.
- Missing the `-----BEGIN`/`-----END` lines or trailing newline → silent key-parse failure with the same handshake error.
- Provider dashboards (e.g. Linode account-level SSH keys) only inject keys at instance creation. Adding a key there after the box exists is a no-op — the key has to go into the host's `authorized_keys` directly.

### 2. Grant docker access to the deploy user (ssh-docker only)

The deploy user needs to talk to the Docker daemon socket without `sudo`:

```bash
ssh <admin-user>@<DEPLOY_HOST> 'sudo usermod -aG docker <DEPLOY_USER>'
```

The group is only read at login, so the user must open a **new** session to pick it up. Verify with `id` and `docker ps`. Symptom of skipping this: `permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock`.

Adding to the `docker` group is effectively root-equivalent (the docker socket can mount anything). Acceptable for a single-purpose deploy user; if not, configure passwordless sudo for `/usr/bin/docker` and prefix the workflow's commands with `sudo` instead.

### 3. (ssh-docker, private registry only) Confirm package access

If the image is in a private registry and the workflow uses `secrets.GITHUB_TOKEN` for auth, verify the package grants the running repo at least Read access:
- ghcr: https://github.com/users/<owner>/packages/container/<package>/settings → Manage Actions access.
- Auto-linked when the image is first pushed by `docker/login-action` from that same repo. If you move the package, you'll have to re-link or switch to a PAT.

## Rules

- The validate job must check that the requested release tag exists before deploying (skip check for "latest").
- Always use `set -euo pipefail` in SSH scripts so failures are caught.
- **Preserve sibling env vars**: Before writing, glob `.github/workflows/*.yml` for a top-level `env:` block. If sibling workflows share env vars (e.g. `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` to silence the Node 20 → 24 deprecation warnings on JS actions — `appleboy/ssh-action` is a JS action and is affected), include the same block here so the new workflow stays consistent with the project's existing CI conventions.
- Use `appleboy/ssh-action@v1` for SSH. Pass secrets and inputs that shouldn't be templated into the script body via `env:` + `envs:` rather than `${{ }}` interpolation in the script itself.
- Gate on a GitHub Environment (`production`) for approval control. Secrets live on the environment, not the repo.
- Do NOT hardcode hostnames, paths, or service names — always use secrets or ask the user.
- For ssh-docker with a private ghcr image, add `permissions: packages: read` and a `docker login` step using `secrets.GITHUB_TOKEN` instead of asking the user to maintain a long-lived PAT on the host.
- After documenting the workflow, also tell the user about the one-time host prep (key authorization, docker group, optional ghcr package access link). The workflow assumes these exist; the first deploy will fail with a confusing error if any are missing.
- If `.github/workflows/deploy.yml` already exists, show the user the diff and ask before overwriting.
