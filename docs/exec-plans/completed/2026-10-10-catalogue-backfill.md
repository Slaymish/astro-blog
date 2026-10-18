# Backfill forty work entries

## Purpose

Hamish has approved the forty entries in the main, research and compact sections of the GitHub audit. Each needs accurate historical dating, concise copy in his clean voice, a usable cover and the existing Sanity work-story shape so it can appear in the site's chronological catalogue. The additional provisional projects are excluded. Existing work and unrelated working-tree edits must be preserved.

## Progress

- [x] Read the work-story schema, rendering and voice guide and establish the forty-entry scope.
- [x] Resolve dates against original commit/release evidence and collect project media.
- [x] Write and validate forty complete work-story documents with covers and source provenance.
- [x] Render a review catalogue and inspect the covers and copy.
- [x] Import the forty entries and covers into production Sanity after explicit approval.
- [x] Verify the delayed production build and live generated pages, preserving existing documents.

## Surprises & Discoveries

The audit found 159 owned repositories. The forty recommended projects span 2021 to 2026 and include public and private source. The Sanity work-story schema already supports image and factual-figure covers. Site generation reads content from the Sanity CDN, whose regional purge can race the content-triggered deployment. A second build several minutes after content writes is necessary for final publication verification.

## Decision Log

The user explicitly selected the forty recommended entries and excluded provisional candidates on 10 October 2026. Related repositories such as BusRouter/transitsync-routing and Watzon/WatzonOld remain single work entries. No new homepage feature selection is implied.

Historical dates use an evidenced project milestone, with human-readable timeframe explaining the original period. GitHub repository creation is not automatically treated as publication. If an exact launch is unestablished, copy identifies a prototype or coursework, and provenance records the commit/release date used for catalogue sorting.

Covers use existing project screenshots/renders/plots where available. New explanatory covers depict implemented behaviour and remain clearly distinguishable from original screenshots. Private credentials, journal text, bank transactions and family details are excluded from generated demonstrations.

## Context and Orientation

Work entries are Sanity documents of type workStory. Routes in src/pages/work/[slug].astro fetch them through src/content/queries.ts and render Portable Text blocks with src/content/portableText.ts. Covers are images or stored facts rendered by src/components/WorkCover.astro. The independent, professional and research categories are defined in src/content/work.ts. Visitors see summary, introduction, role, narrative, result, links and cover. Date determines chronological ordering across work and writing.

The earlier audit and repository snapshots live at /Users/hamishburke/Documents/Codex/github-catalog-2026-10-10. Task materials live at docs/catalogue-backfill/ in this repository. The project uses pnpm and already has @sanity/client, sharp, tsx and the content validators. Local .env supplies Sanity access without revealing its token in logs. No dependency installation is needed.

## Plan of Work

Collect dated GitHub commits/releases and suitable media into the task directory. Maintain a source manifest with each repository, selected milestone, attribution and cover provenance. Author complete Portable Text documents in a local JSON bundle. Validate required fields, schema limits, dates, uniqueness, references, public links and voice punctuation. Build a local review gallery linking all forty entries and media.

Use the existing Sanity client for additive asset uploads and documents with stable backfill IDs. Dry-run before mutation, check that slugs and order values cannot collide, and preserve a read-only snapshot of existing content. Do not overwrite unrelated documents or edit existing code as part of content authoring. Complete a normal build and post-build tests against the final dataset. If publication needs a deployment command, establish the configured Netlify site and observe the repository's approval requirement before executing it.

## Concrete Steps

From /Users/hamishburke/Developer/astro-blog, create task files under docs/catalogue-backfill and use gh api to read original project history and media. Run the task's validator/importer in dry-run mode with node --env-file=.env. Save review output locally and open it in Codex. Run pnpm run build, then pnpm run test and pnpm run check when content is in the source read by the site. Record validation counts and rendered-page checks here as they become available.

## Validation and Acceptance

Every one of the forty selected projects has exactly one complete work story, an evidence-backed date, source attribution, a valid cover with alt text and no private repository link exposed publicly. Copy contains no em/en dashes, forbidden candour formula, invented adoption claims or unimplemented feature claims. Existing work entries remain intact. The normal validators accept the combined collection, the build succeeds, and all forty pages render with chronological index entries and generated Markdown twins. Covers are visually inspected at thumbnail and detail scale. Any exact date represented as an archival milestone is disclosed in the page's copy or role.

## Idempotence and Recovery

Stable IDs and content hashes make additive importing repeatable. Before writes, save existing work-story IDs/slugs/orders and block collisions. Reuse assets recorded in the upload manifest. Never run the destructive dataset migration, remove existing content or reset unrelated edits. If a step fails, retain the bundle and provenance and continue from the last verified stage.

## Artifacts and Notes

Primary deliverables are the content JSON bundle, date/source manifest, covers, review catalogue and importer/validation output. No dist output is committed. The user has authorised creation of the forty entries and their copy/media. Production dataset changes and deploy commands are separately governed by the repository's ask-first rule, with reviewable work prepared before any final approval request.

## Interfaces and Dependencies

Use @sanity/client createClient with useCdn false for imports and verification. Each workStory contains title, descriptor, slug, kind, order, date, timeframe, summary, introduction, role, body, resultHeading, result, links, cover, evidence, artifacts and related. Portable Text paragraphs are block objects containing span children. Image covers reference Sanity image assets. All new IDs start with catalogue-backfill-. Existing src/content/validate.ts remains the runtime content contract.

## Outcomes & Retrospective

All forty entries have complete copy, required fields, evidence-backed archival dates, covers and public source links where appropriate. Watzon dates to the first preserved WatzonOld commit on 29 June 2022. Each page states its date basis rather than presenting a commit as a known launch.

The final covers comprise sixteen original repository assets or current live screenshots, three imagegen illustrations and twenty-one editable explanatory diagrams. All forty covers were inspected in contact sheets, with representative original and generated assets inspected at full size. No private source URL is included in visitor-facing documents or uploaded-asset descriptions.

The isolated preview build passes Astro checking and produces 106 Markdown twins. All 221 tests pass with zero skips, including the build-output checks for links, images, chronology and metadata. The full check command passes Astro and knip. Browser verification checked all forty pages at both 1440px and 390px, with no failed image loads, wrong headings or horizontal overflow, and verified forty review-gallery cards.

The dry-run importer validates the combined forty additions and eight existing work stories without collisions. The approved additive Sanity import is complete. The remaining acceptance step is publication verification after the delayed second deployment required by this repository. Existing source files were not edited by this task. Review servers are on localhost:4371 (actual site layout) and localhost:4372/review.html (copy, covers and provenance).

## Publication follow-up

Hamish explicitly approved production import and publication on 10 October 2026. The additive importer uploaded forty covers and created all forty documents in one transaction, then verified their presence and asset references. The signed-in Safari Netlify dashboard is available for the delayed second build; no new credentials or access were created. The site is hamishswords, with site id 29001146-bec3-4edb-8751-9378a0204baa. Publication verification is in progress.

Production-data build completed successfully and produced 106 Markdown twins; all 221 post-build tests passed with zero skips. Fresh Sanity verification confirms all forty documents match the authored bundle and all eight existing revisions are unchanged. Forty cover assets resolve and private-source URLs are absent from their descriptions. Reports are saved in sanity-verification.json and asset-verification.json, with build/test logs alongside them.

The delayed second build is temporarily blocked because macOS locked during the required cache wait, and the computer-use tool requires Hamish to unlock it manually. An asynchronous unlock request was sent. Netlify has no authenticated local CLI configuration, and the current Sanity token cannot read the webhook-management API (401), so no API workaround is available. The last public catalogue check still showed only the original eight entries. After unlock, use the already-open Safari Netlify deploys page, Trigger deploy, and verify the new deploy permalink with verify-production.mjs. Four minutes have already elapsed since the import at 2026-10-09T22:34:05.560Z, so no further cache wait is needed.

## Completed publication

After Hamish unlocked the Mac, the authorised delayed production deployment was triggered from the Netlify dashboard at 11:50 NZDT on 10 October 2026. Deploy 6ac96fc2c15e4a75f5655600 completed successfully and was published. verify-production.mjs checked all forty detail pages on the deploy permalink: HTTP 200, exact titles and copy, correct canonicals, resolving Sanity image covers with alt text and working negotiated Markdown twins. All forty entries appear in the deployed catalogue, sitemap and llms.txt. The apex catalogue at https://hamishburke.dev/work returns 200 and lists forty-eight work entries. The final fresh Sanity check again confirms all eight original document revisions unchanged. production-verification.json records zero failures. The objective is complete, with no source-code, dependency or unrelated document changes.

## Requested revision after publication

Hamish explicitly requested removal of Alphero Voice Skill and HamishStyler and a new Otto cover. The two documents were backed up and removed after verifying no incoming references. Otto was given an imagegen conceptual voice-assistant illustration, with prompt and provenance retained. The atomic transaction left 46 work stories and preserved the revisions of the other 45. The reusable bundle now excludes the removed entries and preserves all remaining order values. The production-data build produced 104 Markdown twins and all 221 tests passed. Delayed deploy 6ac971f19108bdf145c948c8 was triggered several minutes after the write and verified for all 38 remaining backfill pages and covers. Both removed URLs return 404 on the deploy permalink and apex domain; Otto shows the new cover. Verification recorded zero failures.

### Original-project covers, 10 October 2026

Hamish requested replacement of generated covers, then clarified that the 19 explanatory diagrams should remain. Final changes replace only the four illustrations for ArticulateAI, Otto, Synod and Lumen with original source-derived interfaces/menu and real Obsidian screenshots. The plugin screenshots use an explicitly approved empty temporary vault, not personal notes. A broader intermediate cover update was rolled back for the 19 diagrams before the final delayed deployment. All copy and dates remain unchanged. Dataset snapshots, source provenance and verification live in `docs/catalogue-backfill/real-media-2026-10-10/`.

The delayed final cover deploy `6ac982141511aa15b389ba9c` was published and verified at 1:09 PM NZDT. All 38 detail pages, expected cover assets and negotiated Markdown twins pass, as do catalogue/crawl checks and removed-URL 404 checks. Build and all 221 tests pass.
