#!/usr/bin/env bash
# PostToolUse(Edit|Write): checks the repo invariants whose breakage is silent.
# Nothing here can block the edit; it reports back so the follow-up happens in
# the same turn rather than in review.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

root="$(repo_root)"
payload="$(cat)"
raw_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' 2>/dev/null)"
[ -z "$raw_path" ] && exit 0

path="$(relative_path "$raw_path")"
[ -z "$path" ] && exit 0

findings=()

# Sanity schemas are mirrored by hand. Drift is invisible: Studio simply lacks
# the field and nothing errors.
case "$path" in
  src/sanity/schemaTypes/*.ts|studio-production/schemaTypes/*.ts)
    base="$(basename "$path")"
    a="$root/src/sanity/schemaTypes/$base"
    b="$root/studio-production/schemaTypes/$base"
    if [ ! -f "$a" ]; then
      findings+=("Schema mirror: src/sanity/schemaTypes/$base does not exist. Both schema directories must carry the same file.")
    elif [ ! -f "$b" ]; then
      findings+=("Schema mirror: studio-production/schemaTypes/$base does not exist. Create it so the standalone Studio sees this type.")
    elif ! diff -q "$a" "$b" >/dev/null 2>&1; then
      findings+=("Schema mirror: src/sanity/schemaTypes/$base and studio-production/schemaTypes/$base now differ. Mirror the change before moving on. (diff -u to see it)")
    fi
    ;;
esac

# The test script globs tests/*.test.ts, so a test in a subdirectory never runs
# and CI still passes.
case "$path" in
  tests/*/*.test.ts|tests/*/*/*.test.ts)
    findings+=("Test location: $path will never run. The test script globs tests/*.test.ts only, so subdirectories are silently skipped. Move it to tests/.")
    ;;
esac

# Legacy URL handling lives in two places that cannot be diffed against each other.
case "$path" in
  src/lib/legacyRoutes.ts)
    findings+=("Legacy routes are mirrored: the [[redirects]] blocks in netlify.toml must match this file. Astro's redirects config is deliberately unused here because it emits meta-refresh pages.")
    ;;
esac

# Routing and canonical behaviour is spread across the layout, the site helpers
# and the crawl endpoints.
case "$path" in
  src/components/layout/Layout.astro|src/lib/site.ts|src/pages/robots.txt.ts|src/pages/sitemap.xml.ts|src/pages/rss.xml.ts|src/pages/llms.txt.ts)
    findings+=("Routing/canonical surface touched. Review Layout.astro, src/lib/site.ts and the four crawl endpoints together, and keep trailingSlash: 'never' and build format 'file' in step. If an invariant changed, update ARCHITECTURE.md in the same commit.")
    ;;
esac

# Colour tokens are used whole: no opacity modifiers, no scale gradations.
# text-lg/7 and friends are line-height syntax, not colour, so they are excluded.
case "$path" in
  *.astro|*.tsx|*.jsx|*.css)
    if [ -f "$root/$path" ]; then
      hits="$(grep -noE '(bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|accent|caret|placeholder|shadow)-[a-z0-9-]+/[0-9]{1,3}' "$root/$path" \
        | grep -vE ':text-(xs|sm|base|lg|[0-9]?xl)/' | head -5)"
      if [ -n "$hits" ]; then
        findings+=("Colour token opacity modifier in $path: $(printf '%s' "$hits" | tr '\n' ' '). Tokens are used whole. If a tinted variant is needed, stop and ask for a dedicated token.")
      fi
    fi
    ;;
esac

[ "${#findings[@]}" -eq 0 ] && exit 0

{
  for finding in "${findings[@]}"; do printf -- '- %s\n' "$finding"; done
} >&2
exit 2
