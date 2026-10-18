# Requested catalogue revision

Hamish requested removal of the Alphero Voice Skill and HamishStyler work entries and a replacement for Otto's app-icon cover on 10 October 2026.

The two entries were removed from production Sanity after confirming they had no incoming document references. Their full documents and Otto's previous document are retained in before.json. Otto now uses an imagegen conceptual cover showing voice requests, capability cards, desktop windows and session notes. The prompt and original image path are recorded in ../image-prompts.md, with the selected output also saved as otto-cover.png.

result.json records the successful transaction, new asset and 46 remaining work stories. The other 45 stories retained their original revisions. The reusable content bundle and generator now exclude the two removed projects, preserve all remaining order values, and include Otto's replacement cover.

A production-data build produced 104 Markdown twins. All 221 tests passed. Delayed Netlify deploy 6ac971f19108bdf145c948c8 is published and verified: all 38 remaining backfill pages, covers, canonicals and negotiated Markdown copies pass. Both removed URLs return 404 on the deploy permalink and apex domain, and the live Otto page uses the new image. The catalogue, sitemap and llms.txt include the remaining entries. ../production-verification.json records zero failures.
