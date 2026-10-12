# Dependency triage, 12 October 2026

This is triage of the current lockfile, not a claim that alerts have been fixed.
`pnpm audit --prod --json` reported 80 advisories: 50 high, 24 moderate, six low,
and zero critical. The production filter includes the Sanity Studio workspace
and development tooling pulled in by the Netlify adapter; an audit scope label
alone does not prove an internet-exposed request path.

The contribution authentication code uses built-in Web Crypto, fetch and strict
JSON handling. The new routes do not call Astro.session or the Astro HTTP cache
helper directly. Astro nevertheless depends on devalue 5.9.2 and
http-cache-semantics 4.2.0, so these framework dependencies should be patched
before launch. Audit identifies fixes at devalue 5.9.3 and
http-cache-semantics 4.3.0, both within Astro's declared semver ranges.

The sharp findings include the optional Astro image transformer and the Netlify
local image emulator. Production imageCDN is disabled and report uploads accept
JSON only, but build-time image handling still needs a patched dependency.
Existing PR 35 updates the direct sharp version, adapter and framework; verify
its final resolved lockfile, because changing direct versions does not guarantee
all transitive findings are removed. PR 30 is a separate node-html-parser major
upgrade, not a fix for the framework dependencies above.

Unpatched findings remain for braces, extract-zip, node-forge and sprintf-js.
Their recorded paths are principally build/dev/Studio tooling. Do not invent a
patched override or suppress alerts just to make the audit green. Avoid processing
untrusted archives, patterns or certificates through affected tooling and follow
maintainer fixes. This report does not establish that every affected path is
unreachable. Keep public production contribution ingestion disabled while
remediation and real deployed tests remain pending.

| Package | Highest severity | Initial classification | Reported patched ranges |
|---|---|---|---|
| adm-zip | high | Sanity Studio / Studio build tooling | >=0.6.1 |
| brace-expansion | high | Mixed graph; inspect all paths before classifying exposure | >=5.0.10; >=5.0.11; >=5.0.12; >=5.0.5; >=5.0.6; >=5.0.7; >=5.0.8; >=5.0.9 |
| braces | high | Mixed graph; inspect all paths before classifying exposure | No patched release reported |
| defu | high | Mixed graph; inspect all paths before classifying exposure | >=6.1.5 |
| devalue | high | Astro framework dependency; prioritise patching before launch | >=5.9.3 |
| dompurify | low | Sanity Studio / Studio build tooling | >=3.4.16 |
| extract-zip | high | Build or local development graph | No patched release reported |
| fast-uri | high | Build or local development graph | >=3.1.1; >=3.1.2; >=3.1.3; >=3.1.4; >=3.1.5; >=3.1.6; >=3.1.7; >=3.1.8 |
| http-cache-semantics | high | Astro framework dependency; prioritise patching before launch | >=4.3.0 |
| image-size | high | Build or local development graph | >=2.0.3 |
| js-yaml | high | Sanity Studio / Studio build tooling | >=3.14.2; >=3.15.0; >=3.15.1; >=3.15.2 |
| node-forge | high | Build or local development graph | >=1.4.0; No patched release reported |
| picomatch | high | Mixed graph; inspect all paths before classifying exposure | >=4.0.4 |
| postcss | high | Build or local development graph | >=8.5.10; >=8.5.12; >=8.5.18; >=8.5.23 |
| sharp | high | Mixed graph; inspect all paths before classifying exposure | >=0.35.0; >=0.35.4; >=0.35.5 |
| smol-toml | high | Mixed graph; inspect all paths before classifying exposure | >=1.6.1; >=1.7.1; >=1.9.0 |
| source-map-js | high | Mixed graph; inspect all paths before classifying exposure | >=1.2.2 |
| sprintf-js | moderate | Sanity Studio / Studio build tooling | No patched release reported |
| svgo | high | Mixed graph; inspect all paths before classifying exposure | >=4.0.2; >=4.1.0 |
| tmp | high | Build or local development graph | >=0.2.6 |
| toml | high | Build or local development graph | >=4.1.2; >=4.2.0 |
| undici | high | Sanity Studio / Studio build tooling | >=7.29.1 |
| uuid | moderate | Sanity Studio / Studio build tooling | >=11.1.1 |

Source evidence is the local pnpm audit result and the GitHub Dependabot alert
API read. Primary framework advisories include
[devalue advisory](https://github.com/advisories/GHSA-4q55-j62x-fr9h) and
[HTTP cache advisory](https://github.com/advisories/GHSA-ch52-4w7c-c8xp).
No package versions or lockfile were changed during this triage.
