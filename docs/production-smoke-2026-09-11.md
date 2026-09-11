# Site rewrite: production smoke test

Run on 11 September 2026, approximately 19:20–19:25 NZST, against https://hamishburke.dev,
after merging `rewrite` into `main` (commit `299863e`) and the Netlify production deploy of
that commit reached `ready`.

Every public route, redirect, retired-content response and crawl endpoint passed. Two
Cloudflare edge settings still need changing by hand and are listed under Outstanding; both
are configuration at the edge, not code, and the Netlify origin serves the correct thing in
each case. The browser-dependent checks (console, theme persistence, 375 px layout,
calculator and PDF interaction) are still unverified.

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

## Outstanding: two Cloudflare settings

1. **Rocket Loader is on, and it defers the theme resolver.** Cloudflare injects
   `/cdn-cgi/scripts/.../rocket-loader.min.js` and rewrites every script's `type` to
   `e92c55ad…-text/javascript`, including the inline theme script. An unrecognised `type`
   means the browser does not execute it, so the resolver no longer runs before first paint
   and a light-theme visitor sees a dark flash. The CSP hash still matches, because it covers
   the script's text and not its attributes. Turn Rocket Loader off under Speed >
   Optimization > Content Optimization. This is the step the rewrite plan already called for.
2. **Cloudflare strips `Strict-Transport-Security`.** The header leaves Netlify correctly and
   is absent through the edge. Enable HSTS under SSL/TLS > Edge Certificates, matching
   `max-age=31536000; includeSubDomains`.

Cloudflare's email obfuscation also injects `email-decode.min.js`, because the footer carries
a `mailto:` link. It is same-origin so the policy permits it; worth turning off with Rocket
Loader if the injected scripts are unwanted.

## Not yet verified

Needs a real browser: no CSP violations in the console, the theme choice persisting across a
reload, no horizontal scroll at 375 px, the GPU calculator recalculating as inputs move, and
a report PDF rendering to canvas. Lighthouse has not been run. The hosted Sanity Studio has
not been deployed: no `studioHost` is configured, so `sanity deploy` would prompt for a new
public hostname. `pnpm run studio:dev` serves the new schema locally in the meantime.

The subtractive migration has not been run. It is the irreversible half and should follow a
period of the new site being live.
