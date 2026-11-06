# Stream reveal

An article about how an answer arrives on screen, with a live demonstration of the layout cost of five ways of drawing it.

## What is here

| File | What it is |
|---|---|
| `src/components/StreamReveal.astro` | The demonstration. One server-rendered paragraph, five ways of revealing it, and the reflow count measured live with a `ResizeObserver` on the paragraph. |
| `src/pages/notes/one-view-of-the-answer.astro` | Preview scaffold. Carries the article copy so the piece can be read on a real build before it exists in the CMS. |
| `docs/stream-reveal/post-body.md` | The same copy as markdown for a `post` document's `markdownBody`. |

## The measurement

A reflow is counted as a change of at least one pixel in the paragraph's height while the text is arriving, which is what moves a line out from under a reader. It is observed on the paragraph, not on the stage, because the stage holds a fixed minimum height so the page does not jump between modes.

Measured at 390px wide, on the 336 character sample answer:

| Mode | Reflows | Time to full text |
|---|---|---|
| Characters | 9 | 4.6 s |
| Words | 0 | 7.0 s |
| Chunks | 0 | 4.8 s |
| Sentences | 0 | 1.3 s |
| All at once | 0 | 0.6 s |

Every mode except Characters places its units in the DOM before anything is painted, so the paragraph is at its final size from the first frame and the animation only moves opacity, transform and blur. Characters is the only mode whose count moves with the viewport, because it is the only one that re-lays-out mid-answer.

## How a chunk is chosen

Chunks are not a fixed word count. The splitter breaks after sentence and comma punctuation, before a connective that starts a new idea (`and`, `but`, `until`, `which`, `where`, `instead`), and otherwise at three to six words chosen by a deterministic hash so a replay is identical. A chunk that would end on `the`, `of`, `to` or another word that holds a phrase open takes one more word. A chunk left holding a single connective joins the chunk in front of it. No chunk exceeds 30 characters, which keeps it from overflowing a 390px screen as an inline block.

The result on the sample answer: `The library on the corner` / `shut in 2019` / `and the building sat empty` / `for three years,` / `until a group of neighbours` and so on, nineteen chunks.

## Verify

```sh
pnpm run build
python3 -m http.server 8899 --bind 127.0.0.1 --directory dist
```

Then open `/notes/one-view-of-the-answer.html`. Two things bite in a headless browser:

- A hidden tab gets no `IntersectionObserver` callbacks, so the demo appears dead. Call `Page.bringToFront` before measuring, and read `document.visibilityState` if a run seems not to start.
- `Emulation.setDeviceMetricsOverride` has to be set after the navigation, followed by a `resize` event, or geometry comes back at the previous viewport.

## Publishing

The copy ships today as a stand-in page. To land it as a normal post:

1. Create a `post` in Sanity with `post-body.md` as `markdownBody`.
2. Generalise `splitAtComponent` in `src/content/markdown.ts` to take more than one token and render `<StreamReveal />` for `{{stream-reveal}}` in `src/pages/posts/[slug].astro`, alongside the existing `{{gpu-calculator}}`.
3. Delete `src/pages/notes/one-view-of-the-answer.astro`.

The demonstration does not need the CMS to be useful, so the page is worth keeping if a static home is wanted instead.
