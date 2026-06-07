#!/usr/bin/env bash
# Wrapper around scripts/seed-admin.ts so you can seed the admin user
# from your shell without remembering env-var syntax.
#
# Usage as a function (source first, then call):
#   source ./scripts/seed-admin.sh
#   kamaji_seed_admin you@example.com 'your-password'
#   kamaji_seed_admin you@example.com 'your-password' "postgres://..."
#
# Usage as a script:
#   ./scripts/seed-admin.sh you@example.com 'your-password'
#   ./scripts/seed-admin.sh you@example.com 'your-password' "postgres://..."
#
# DATABASE_URL precedence: 3rd arg > $DATABASE_URL env > localhost dev default.

kamaji_seed_admin() {
  local email="$1"
  local password="$2"
  local db_url="${3:-${DATABASE_URL:-postgres://kamaji:devpass@localhost:5434/diary}}"

  if [[ -z "$email" || -z "$password" ]]; then
    echo "usage: kamaji_seed_admin <email> <password> [database_url]" >&2
    return 1
  fi

  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

  DATABASE_URL="$db_url" \
    ADMIN_EMAIL="$email" \
    ADMIN_PASSWORD="$password" \
    bun run "$script_dir/seed-admin.ts"
}

# When executed directly (not sourced), forward args to the function.
if [[ "${BASH_SOURCE[0]:-$0}" == "${0}" ]]; then
  kamaji_seed_admin "$@"
fi
