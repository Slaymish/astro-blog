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

# The test script globs tests/*.test.ts, so a test in a subdirectory never runs
# and CI still passes.
case "$path" in
  tests/*/*.test.ts|tests/*/*/*.test.ts)
    findings+=("Test location: $path will never run. The test script globs tests/*.test.ts only, so subdirectories are silently skipped. Move it to tests/.")
    ;;
esac

# Routing and canonical behaviour is spread across the layout, the site helpers
# and the crawl endpoints.
case "$path" in
  src/layouts/Base.astro|src/site/seo.ts|src/site/config.ts|src/pages/robots.txt.ts|src/pages/sitemap.xml.ts|src/pages/rss.xml.ts|src/pages/llms.txt.ts)
    findings+=("Routing/canonical surface touched. Review Base.astro, src/site/seo.ts, src/site/config.ts and the four crawl endpoints together, and keep trailingSlash: 'never' and build format 'file' in step. If an invariant changed, update ARCHITECTURE.md in the same commit.")
    ;;
esac

# Colour lives in tokens.css and nowhere else. A literal hex anywhere else is a
# fourth vocabulary starting. The exceptions all run before or outside CSS:
# tokens.css itself, the two <meta name="theme-color"> values in Base.astro (the
# browser reads them before the first stylesheet parses), the static 410 page,
# and the icon generator, which rasterises to PNG.
case "$path" in
  src/styles/tokens.css|src/layouts/Base.astro|public/410.html|scripts/generate-icons.mjs) ;;
  *.astro|*.css)
    if [ -f "$root/$path" ]; then
      hits="$(grep -noE '#[0-9a-fA-F]{3,8}\b' "$root/$path" | head -5)"
      if [ -n "$hits" ]; then
        findings+=("Literal colour in $path: $(printf '%s' "$hits" | tr '\n' ' '). Colour comes from the roles in src/styles/themes.css, used whole. If a new value is needed, stop and ask for a dedicated token in src/styles/tokens.css.")
      fi
    fi
    ;;
esac

# A style attribute in rendered markup is refused by the hash-only CSP, and the
# page silently loses that styling rather than failing the build.
case "$path" in
  *.astro)
    if [ -f "$root/$path" ]; then
      hits="$(grep -noE 'style="|style=\{' "$root/$path" | head -5)"
      if [ -n "$hits" ]; then
        findings+=("Inline style in $path: $(printf '%s' "$hits" | tr '\n' ' '). The Content-Security-Policy is hash-only and cannot hash a style attribute. Use a class, or a custom property set on a class, instead.")
      fi
    fi
    ;;
esac

[ "${#findings[@]}" -eq 0 ] && exit 0

{
  for finding in "${findings[@]}"; do printf -- '- %s\n' "$finding"; done
} >&2
exit 2
