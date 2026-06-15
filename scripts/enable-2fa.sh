#!/usr/bin/env bash
# Wrapper around scripts/enable-2fa.ts so you can enable TOTP two-factor
# from your shell without remembering env-var syntax.
#
# Usage as a function (source first, then call):
#   source ./scripts/enable-2fa.sh
#   kamaji_enable_2fa you@example.com 'your-password'
#   kamaji_enable_2fa you@example.com 'your-password' "postgres://..."
#
# Usage as a script:
#   ./scripts/enable-2fa.sh you@example.com 'your-password'
#   ./scripts/enable-2fa.sh you@example.com 'your-password' "postgres://..."
#
# DATABASE_URL precedence: 3rd arg > $DATABASE_URL env > localhost dev default.

kamaji_enable_2fa() {
  local email="$1"
  local password="$2"
  local db_url="${3:-${DATABASE_URL:-postgres://kamaji:devpass@localhost:5432/diary}}"

  if [[ -z "$email" || -z "$password" ]]; then
    echo "usage: kamaji_enable_2fa <email> <password> [database_url]" >&2
    return 1
  fi

  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

  DATABASE_URL="$db_url" \
    ADMIN_EMAIL="$email" \
    ADMIN_PASSWORD="$password" \
    bun run "$script_dir/enable-2fa.ts"
}

# When executed directly (not sourced), forward args to the function.
if [[ "${BASH_SOURCE[0]:-$0}" == "${0}" ]]; then
  kamaji_enable_2fa "$@"
fi
