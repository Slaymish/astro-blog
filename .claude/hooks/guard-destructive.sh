#!/usr/bin/env bash
# PreToolUse(Bash): blocks the two irreversible operations in this repo until
# they are explicitly acknowledged - writes to the production Sanity dataset,
# and git commands that discard uncommitted work.
#
# `scripts/seed-page-copy.ts` uses createOrReplace across every page-copy
# singleton, so running it discards anything edited in Studio since the script
# was last updated. The copy-* and migrate-* scripts patch live documents.
# None of them have a dry-run mode.
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

destructive=0
patching=0
case "$command_text" in
  *seed:copy*|*seed-page-copy.ts*) destructive=1 ;;
esac
case "$command_text" in
  *copy-depersona.ts*|*copy-humanise.ts*|*copy-humanise-posts.ts*|*migrate-home-datasheet.ts*) patching=1 ;;
esac

[ "$destructive" -eq 0 ] && [ "$patching" -eq 0 ] && exit 0

if [ "$destructive" -eq 1 ]; then
  cat >&2 <<'MSG'
Blocked: this publishes page-copy singletons with createOrReplace, overwriting
whatever is currently in the production dataset.

Before running it, reconcile the live Studio values into
scripts/seed-page-copy.ts, otherwise copy edited in Studio is lost and there is
no undo. Ask Hamish to confirm the reconcile has happened.

To run it once the reconcile is done and Hamish has agreed:
  SANITY_WRITE_ACK=1 <the same command>
MSG
else
  cat >&2 <<'MSG'
Blocked: this script commits patches to the production Sanity dataset and has no
dry-run mode. Confirm with Hamish that the live documents should change, then:
  SANITY_WRITE_ACK=1 <the same command>
MSG
fi
exit 2
