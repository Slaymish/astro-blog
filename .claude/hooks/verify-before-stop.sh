#!/usr/bin/env bash
# Stop: when source files are dirty, run the test suite and astro check before
# the turn ends. Both are fast (about 1s and 7s). CI runs the same checks, but
# only after a push.
#
# The result is cached against a signature of the dirty files, so an unchanged
# tree is not re-checked on every turn. If the same failing state blocks twice,
# the hook stops blocking so it cannot trap the session.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

root="$(repo_root)"
cd "$root" 2>/dev/null || exit 0
command -v git >/dev/null 2>&1 || exit 0

payload="$(cat)"
session="$(printf '%s' "$payload" | jq -r '.session_id // "unknown"' 2>/dev/null)"
state_dir="${TMPDIR:-/tmp}/astro-blog-hooks"
mkdir -p "$state_dir" 2>/dev/null || exit 0
passed_file="$state_dir/passed-$session"
blocks_file="$state_dir/blocks-$session"

file_meta() {
  stat -f '%z %m' "$1" 2>/dev/null || stat -c '%s %Y' "$1" 2>/dev/null
}

dirty="$(git status --porcelain -- src tests 2>/dev/null \
  | sed 's/^...//; s/.* -> //' \
  | grep -E '\.(ts|tsx|astro)$' || true)"
[ -z "$dirty" ] && exit 0

signature="$(
  while IFS= read -r f; do
    printf '%s %s\n' "$f" "$(file_meta "$f")"
  done <<< "$dirty" | cksum
)"

if [ -f "$passed_file" ] && [ "$(cat "$passed_file" 2>/dev/null)" = "$signature" ]; then
  exit 0
fi

blocks=0
[ -f "$blocks_file" ] && blocks="$(cat "$blocks_file" 2>/dev/null || echo 0)"

pnpm_bin="$(resolve_pnpm)" || exit 0

test_out="$("$pnpm_bin" run test 2>&1)"; test_status=$?
check_out="$("$pnpm_bin" exec astro check 2>&1)"; check_status=$?

if [ "$test_status" -eq 0 ] && [ "$check_status" -eq 0 ]; then
  printf '%s' "$signature" > "$passed_file"
  rm -f "$blocks_file"
  exit 0
fi

if [ "$blocks" -ge 2 ]; then
  rm -f "$blocks_file"
  printf '%s' "$signature" > "$passed_file"
  jq -n --arg msg "astro check or the test suite is still failing after two attempts. Not blocking again this session; tell Hamish what is failing rather than leaving it silent." \
    '{hookSpecificOutput: {hookEventName: "Stop", additionalContext: $msg}}' 2>/dev/null
  exit 0
fi

echo $((blocks + 1)) > "$blocks_file"

{
  echo "Source files are dirty and the local checks fail. Fix these before ending the turn."
  if [ "$test_status" -ne 0 ]; then
    echo ""
    echo "--- pnpm run test (exit $test_status) ---"
    printf '%s\n' "$test_out" | tail -40
  fi
  if [ "$check_status" -ne 0 ]; then
    echo ""
    echo "--- pnpm exec astro check (exit $check_status) ---"
    printf '%s\n' "$check_out" | tail -40
  fi
} >&2
exit 2
