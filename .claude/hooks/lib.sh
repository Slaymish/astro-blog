#!/usr/bin/env bash
# Shared helpers for this repo's hooks. Hooks must never break a session: on any
# unexpected condition they exit 0 and stay quiet.

repo_root() {
  echo "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
}

# pnpm is installed via nvm here, and hook subprocesses do not always inherit that PATH.
resolve_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then command -v pnpm; return 0; fi
  local candidate
  for candidate in "$HOME"/.nvm/versions/node/*/bin/pnpm /opt/homebrew/bin/pnpm /usr/local/bin/pnpm; do
    [ -x "$candidate" ] && { echo "$candidate"; return 0; }
  done
  return 1
}

# Path as given by the tool, resolved to a repo-relative path.
relative_path() {
  local raw="$1" root
  root="$(repo_root)"
  case "$raw" in
    "$root"/*) echo "${raw#"$root"/}" ;;
    /*) echo "" ;;
    *) echo "$raw" ;;
  esac
}
