# Beth Hurley work story, 2026-11-02

Published to Sanity as `workStory-beth-hurley`, slug `beth-hurley`. The origin API readback confirmed its exact credit, value score, resolved cover and all three evidence assets. Public-page deployment is verified separately.

Hamish confirmed that he designed and built the site and content model; Beth supplied the content and copy. The case study’s role field states that split explicitly. Copy mode: clean. Genre: portfolio case-study metadata.

The work has `valueScore: 85`, consistent with substantial end-to-end client delivery. Its original date feeds the modest recency bonus. The publisher deliberately refuses to overwrite an existing document, so after publication use a guarded patch instead of rerunning it.

## Where the screenshots came from

Captured from the live site `https://bethhurley.nz` with Playwright on 2026-11-02, using the
local chromium at `~/.cache/ms-playwright/chromium-1248`, viewport 1440x810 at deviceScaleFactor 2,
`reducedMotion: 'reduce'` so the scroll-reveal elements are not caught at opacity 0, then resized
to 2400px wide JPEG q88 with sharp.

| File | Route | What it shows |
|---|---|---|
| `assets/cover-site.jpg` | `/` scrolled to 760 | Homepage: name, menu, the About split and the top of Work |
| `assets/work-page.jpg` | `/dear-bones` | A collection page, text column beside a full-length photograph |
| `assets/photography.jpg` | `/photography` | The photo board |
| `assets/mobile-homepage.jpg` | `/` at 390x844 | The phone layout |

The hero at scroll 0 was rejected as the cover: it is a full-bleed photograph, so the card read
as an image rather than as a site.

## Publication decisions

- **Design credit.** Hamish confirmed the design was his, with Beth supplying content and copy. Both are stated in the role field.
- **Timeframe.** Preserved the staged 2026 timeframe and 2 November date rather than inventing a new project date at publication.
- **Order.** The legacy value 45 was checked unique before creation. Hidden value-plus-recency ranking now determines portfolio presentation.

## Shape it follows

`kind: professional` like Sprint Coach and BrontëHF, an image cover, three evidence images, one
link out to the site. Body is three plain paragraphs: the photography constraint, the row maths,
and the Contentful publish path.
