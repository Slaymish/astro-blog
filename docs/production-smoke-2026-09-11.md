# Site rewrite: production smoke test

Run on 11 September 2026, approximately 19:20–19:25 NZST, against https://hamishburke.dev,
after merging `rewrite` into `main` (commit `299863e`) and the Netlify production deploy of
that commit reached `ready`.

Every public route, redirect, retired-content response and crawl endpoint passed. Three
Cloudflare edge settings still need changing by hand and are listed below; all are
configuration at the edge, not code, and the Netlify origin serves the correct thing in every
case. A fourth, Rocket Loader, was turned off during this session and is verified fixed. The
browser-dependent checks (console, theme persistence, 375 px layout, calculator and PDF
interaction) are still unverified.

## Production results

| Check | Observed result |
| --- | --- |
| Preserve list | All 22 of `/`, `/work`, `/work/you-inc`, `/work/sprint-coach`, `/writing`, `/posts/building-a-private-ai-server-for-friends`, `/reports/home-lab-architectural-study`, `/tags/ai`, `/reading`, `/about`, `/cv`, `/cv.pdf`, `/contact`, `/privacy`, `/terms`, `/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/site.webmanifest`, `/favicon.svg`, `/og-default.png` return HTTP 200. |
| Legacy redirects | `/projects`, `/tools`, `/projects/sprint-coach`, `/projects/you-inc` and `/posts/gpu-share` each return 301 to the expected target. |
| Retired content | `/projects/otto`, `/projects/drop-eta`, `/api/pdf`, `/api/insights` and `/reports/a-survey-of-nosql-databases-and-polyglot-persistence-patterns` each return 410. |
| Private endpoints | Unauthenticated `/stats` returns 401. `/reading/sent?state=ok` returns 200 and is `noindex`. An unknown path returns 404. |
| Canonicals | `/` declares `https://hamishburke.dev/`, `/work/you-inc` declares `https://hamishburke.dev/work/you-inc`, `/posts/building-a-private-ai-server-for-friends` declares its own route. No `.html` leaks. |
| Structured data | Exactly one `application/ld+json` block per page on all three pages checked. |
| Open Graph | `/` uses `/og-default.png` (200, `image/png`, 13 KB). `/work/you-inc` and the GPU post use Sanity CDN URLs with `w=` and `auto=format`; the You Inc image is the asset uploaded by the additive migration. |
| RSS | Lists all three posts under their public `/posts/` URLs. No `posts/gpu-share`. |
| Sitemap | 36 `<loc>` entries. No `/stats`, no `/reading/sent`, and no build-time timestamp. |
| Content security policy | The per-page `<meta>` policy is present with hashed `script-src`. No `unsafe-inline` and no `style` attribute anywhere in the served homepage. |
| Response headers | `content-security-policy: frame-ancestors 'none'`, `x-content-type-options`, `referrer-policy`, `permissions-policy`, `cross-origin-opener-policy` and `cross-origin-resource-policy` all present as configured. |
| Booking | `/contact` exposes the Cal.com link for the browser-side `metadata[ref]` rewriter. Browser execution not verified; no appointment created. |
| Netlify origin | `https://hamishswords.netlify.app/` serves `strict-transport-security: max-age=31536000; includeSubDomains; preload` and unmodified `<script>` tags, confirming the origin configuration is correct. |

## Cloudflare edge settings

Rocket Loader was turned off on 11 September and the fix is verified: the inline theme
resolver is served as a bare `<script>` again, its body hashes to
`sha256-iySaVqzE48qmeRMfJXfMKOxccAMHjq8hF4bD2ffqaDk=`, and that hash is present in the page's
`script-src`. It runs before first paint as designed. Three settings remain.

1. **Email Address Obfuscation is rewriting `mailto:` links, and it costs content.** At the
   Netlify origin the footer serves `<a href="mailto:hamishapps@gmail.com">`. Through the edge
   it becomes `<a href="/cdn-cgi/l/email-protection#2048...">`, and on `/contact` the visible
   address is replaced by a placeholder that only JavaScript decodes: the string
   `hamishapps@gmail.com` does not appear in the served HTML at all. Without JavaScript, the
   contact page shows no email address, on a page whose own copy says email is the surest way
   to reach him. Turn it off under Scrape Shield. (The `email-click` analytics event is not
   affected: `email-decode.min.js` is a classic script and runs before the deferred shell
   module, so the href is back to `mailto:` by the time the tracker binds.)
2. **JavaScript Detections injects an inline script the policy cannot allow.** Cloudflare adds
   an inline `(function(){...__CF$cv$params...})()` that builds a hidden iframe and loads
   `/cdn-cgi/challenge-platform/scripts/jsd/main.js`. It carries a per-request ray id and
   timestamp, so its hash changes on every response and can never be listed. Under a hash-only
   `script-src` it is blocked, and it is the one thing standing between this site and a clean
   console. Turn it off under Security > Bots > JavaScript Detections.
3. **Cloudflare strips `Strict-Transport-Security`.** The header leaves Netlify correctly
   (`max-age=31536000; includeSubDomains; preload`) and is absent through the edge. Enable HSTS
   under SSL/TLS > Edge Certificates, matching `max-age=31536000; includeSubDomains`.

Of the three inline scripts the page serves, the theme resolver is covered by a hash, the
JSON-LD block needs no hash because `application/ld+json` is data rather than executable
script, and the Cloudflare challenge script above is the only genuine violation.

## Not yet verified

Needs a real browser: no CSP violations in the console, the theme choice persisting across a
reload, no horizontal scroll at 375 px, the GPU calculator recalculating as inputs move, and
a report PDF rendering to canvas. Lighthouse has not been run. The hosted Sanity Studio has
not been deployed: no `studioHost` is configured, so `sanity deploy` would prompt for a new
public hostname. `pnpm run studio:dev` serves the new schema locally in the meantime.

The subtractive migration has not been run. It is the irreversible half and should follow a
period of the new site being live.
