#!/usr/bin/env bash
# PreToolUse(Bash): blocks the two irreversible operations in this repo until
# they are explicitly acknowledged - writes to the production Sanity dataset,
# and git commands that discard uncommitted work.
#
# `scripts/migrate-2026-09.ts` writes to the production dataset. Its `additive`
# mode is re-runnable and harmless to the live site; its `subtractive` mode
# unsets legacy fields and deletes documents, and is the irreversible one - only
# the pre-rewrite export under .sanity-backups/ can restore what it removes.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

payload="$(cat)"
command_text="$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)"
[ -z "$command_text" ] && exit 0

# Explicit acknowledgement in the command itself is the escape hatch.
case "$command_text" in *SANITY_WRITE_ACK=1*|*GIT_DESTRUCTIVE_ACK=1*) exit 0 ;; esac

# Git commands that discard uncommitted work. Only worth blocking when there is
# uncommitted work to lose, so the dirty check comes first.
git_destructive=0
case "$command_text" in
  *"git checkout -- "*|*"git checkout ."*|*"git restore"*|*"git reset --hard"*|*"git clean -f"*|*"git clean -d"*|*"git stash drop"*|*"git stash clear"*)
    git_destructive=1 ;;
esac
if [ "$git_destructive" -eq 1 ]; then
  root="$(repo_root)"
  if [ -n "$(cd "$root" 2>/dev/null && git status --porcelain 2>/dev/null)" ]; then
    cat >&2 <<'MSG'
Blocked: this discards uncommitted changes, and the working tree is dirty. There
is no reflog for unstaged work - once it is gone it cannot be recovered.

Check `git status` and confirm with Hamish that the changes being thrown away are
yours and not his work in progress. Prefer a narrower path, or copy the file
aside first.

To proceed once he has agreed:
  GIT_DESTRUCTIVE_ACK=1 <the same command>
MSG
    exit 2
  fi
fi

# Matching the bare filename blocked `git add`, `cat` and `grep` on these scripts,
# which made the warning noise. Match execution instead: split the command on shell
# separators and require a segment whose leading word, once wrappers and env
# assignments are stripped, is a JS runner.
runs_script() {
  local text="$1" script_re="$2" seg s
  text="${text//&&/$'\n'}"
  text="${text//||/$'\n'}"
  text="${text//;/$'\n'}"
  text="${text//|/$'\n'}"

  local IFS=$'\n'
  for seg in $text; do
    [[ "$seg" =~ $script_re ]] || continue

    s="${seg#"${seg%%[![:space:]]*}"}"
    while [[ "$s" =~ ^([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*|env|command|exec|npx|time|sudo|nohup)[[:space:]]+ ]]; do
      s="${s#"${BASH_REMATCH[0]}"}"
    done
    if [[ "$s" =~ ^(pnpm|npm|yarn|bun)[[:space:]]+(exec|dlx|run)[[:space:]]+ ]]; then
      s="${s#"${BASH_REMATCH[0]}"}"
    fi

    [[ "$s" =~ ^(tsx|ts-node|node|bun|deno)([[:space:]]|$) ]] && return 0
  done
  return 1
}

destructive=0

# `pnpm run migrate ...` never names the script file, so check separately.
if [[ "$command_text" =~ (^|[[:space:]\;\&\|\(])(pnpm|npm|yarn|bun)([[:space:]]+run)?[[:space:]]+migrate([[:space:]]|$) ]]; then
  destructive=1
fi
runs_script "$command_text" '(^|/)migrate-[0-9a-z-]+\.ts' && destructive=1

# A dry run writes nothing, so it does not need the acknowledgement.
case "$command_text" in *--dry-run*) destructive=0 ;; esac

[ "$destructive" -eq 0 ] && exit 0

cat >&2 <<'MSG'
Blocked: this writes to the production Sanity dataset.

`additive` is re-runnable and leaves the live site working. `subtractive` is the
irreversible one: it unsets the legacy fields on every work story and post and
deletes the ghost project/aphorism documents. Only the pre-rewrite export under
.sanity-backups/ can restore what it removes, and restoring it replaces the
whole dataset.

Read the printed mutations from a dry run first:
  pnpm run migrate <mode> --dry-run

Then, once Hamish has agreed:
  SANITY_WRITE_ACK=1 <the same command>
MSG
exit 2
