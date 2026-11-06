# Stream reveal

An article about how an answer arrives on screen, with a live demonstration of the layout cost of four ways of drawing it.

## What is here

| File | What it is |
|---|---|
| `src/components/StreamReveal.astro` | The demonstration. One server-rendered paragraph, four ways of revealing it, and the reflow count measured live with a `ResizeObserver` on the paragraph. |
| `src/pages/notes/token-streaming.astro` | Preview scaffold. Carries the article copy so the piece can be read on a real build before it exists in the CMS. |
| `docs/stream-reveal/post-body.md` | The same copy as markdown for a `post` document's `markdownBody`. |

## The measurement

A reflow is counted as a change of at least one pixel in the paragraph's height while the text is arriving, which is what moves a line out from under a reader. It is observed on the paragraph, not on the stage, because the stage holds a fixed minimum height so the page does not jump between modes.

Measured at 780px wide, 327 character answer:

| Mode | Reflows | Time to full text |
|---|---|---|
| Characters | 3 | 4.1 s |
| Words | 0 | 5.6 s |
| Sentences | 0 | 1.3 s |
| All at once | 0 | 0.6 s |

Every mode except Characters places every word in the DOM before anything is painted, so the paragraph is at its final size from the first frame and the animation only moves opacity, transform and blur.

## Verify

```sh
pnpm run build
python3 -m http.server 8899 --bind 127.0.0.1 --directory dist
```

Then open `/notes/token-streaming.html`. Two things bite in a headless browser:

- A hidden tab gets no `IntersectionObserver` callbacks, so the demo appears dead. Call `Page.bringToFront` before measuring, and read `document.visibilityState` if a run seems not to start.
- `Emulation.setDeviceMetricsOverride` has to be set after the navigation, followed by a `resize` event, or geometry comes back at the previous viewport.

## Publishing

The copy ships today as a stand-in page. To land it as a normal post:

1. Create a `post` in Sanity with `post-body.md` as `markdownBody`.
2. Generalise `splitAtComponent` in `src/content/markdown.ts` to take more than one token and render `<StreamReveal />` for `{{stream-reveal}}` in `src/pages/posts/[slug].astro`, alongside the existing `{{gpu-calculator}}`.
3. Delete `src/pages/notes/token-streaming.astro`.

The demonstration does not need the CMS to be useful, so the page is worth keeping if a static home is wanted instead.
