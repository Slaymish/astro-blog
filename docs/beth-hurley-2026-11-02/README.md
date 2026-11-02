# Beth Hurley work story, 2026-11-02

Staged, not published. `node publish-beth.mjs --check` validates it; the write needs an
Editor token (queued for Hamish).

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

## Open before publishing

- **Design credit.** `role` says "Front-end build and the content model." The other client stories
  name who designed it (Brontë's says the design was hers). Confirm whether Beth brought the design,
  and the sentence gets one clause.
- **Timeframe.** Set to 2026 with the date at the launch, which is today. Adjust if it finished earlier.
- **Order.** 45 is the next free integer; order values run 0 to 47 with no duplicates, and the
  index sorts by date, so this only breaks a tie.

## Shape it follows

`kind: professional` like Sprint Coach and BrontëHF, an image cover, three evidence images, one
link out to the site. Body is three plain paragraphs: the photography constraint, the row maths,
and the Contentful publish path.
