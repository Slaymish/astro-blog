# Stream reveal

An article about how an answer arrives on screen, with a live demonstration of what five arrival modes cost the reader who is trying to read them. Each one lands its full text at the same elapsed time, so the only thing that differs between them is how the text got there, and only characters reflows.

## What is here

| File | What it is |
|---|---|
| `src/components/StreamReveal.astro` | The demonstration. One server-rendered paragraph, five arrival modes, a vertical speed slider that multiplies the playback clock from 0.25x to 2x, and the reflow count measured live with a `ResizeObserver` on the paragraph. |
| `docs/stream-reveal/post-body.md` | The article copy, published as the `markdownBody` of the `post` below. |
| `docs/stream-reveal/publish.mjs` | Creates that post. Dry run by default; `SANITY_WRITE_ACK=1 node docs/stream-reveal/publish.mjs --write` writes it, and it refuses when a post with that id or slug already exists. Once the post exists, edit `post-body.md` and run the same command with `--update`, which patches `markdownBody` and `excerpt` and leaves the title, tags and date alone. |

The piece is a `post` (`post-one-view-of-the-answer`, `/posts/one-view-of-the-answer`), so it appears in the writing feed that `/work` and `/writing` read. It was previewed at `/notes/one-view-of-the-answer` before the CMS write; that scaffold page is deleted, and `netlify.toml` 301s the old path to the post.

## The measurement

A reflow is counted as a change of at least one pixel in the paragraph's height while the text is arriving, which is what moves a line out from under a reader. It is observed on the paragraph, not on the stage, because the stage holds a fixed minimum height so the page does not jump between modes.

Measured at 390px wide, on the 336 character sample answer:

| Mode | Reflows | Time to full text |
|---|---|---|
| Characters | 10 | 4.0 s |
| Words | 0 | 4.0 s |
| Chunks | 0 | 4.0 s |
| Sentences | 0 | 4.0 s |
| Held | 0 | 4.0 s |

`TARGET` is 4000 ms at the default 25 simulated tok/s. Every character has one arrival timestamp shared by all views. Words, chunks and sentences buffer until their final character and a boundary arrive; Held waits for EOF. The first sentence therefore waits for its entire prefix, rather than appearing at time zero. `completionOffsets()` is tested in `tests/stream-arrival.test.ts`.

The vertical slider uses a four-character-per-token approximation (labelled simulated in its accessible name and tooltip), not a model tokenizer: default 25 tok/s, range 6.25–50 tok/s for the current sample. All arrivals use the same multiplier, so changing the rate changes latency in every mode.
An earlier version had a sixth mode, "All at once", which painted the answer in 0.4 s. It went because it was not a case: nothing can paint before the model finishes, so the honest instant baseline is Held with its wait, and the two read as the same demo twice otherwise.

Every mode except Characters places its units in the DOM before anything is painted, so the paragraph is at its final size from the first frame and the animation only moves opacity, transform and blur. Characters is the only mode whose count moves with the viewport, because it is the only one that re-lays-out mid-answer.

The speed slider rescales the character timestamps through `cue()`. The elapsed-time metric and wait label report real elapsed seconds. Held uses the identical paragraph as the other modes with opacity zero until EOF; it must not introduce nested paragraphs or change height. Browser checks compare paragraph height and the metrics position before, during and after Held on desktop and mobile.
## How a chunk is chosen

Chunks are not a fixed word count. The splitter breaks after sentence and comma punctuation, before a connective that starts a new idea (`and`, `but`, `until`, `which`, `where`, `instead`), and otherwise at three to six words chosen by a deterministic hash so a replay is identical. A chunk that would end on `the`, `of`, `to` or another word that holds a phrase open takes one more word. A chunk left holding a single connective joins the chunk in front of it. No chunk exceeds 30 characters, which keeps it from overflowing a 390px screen as an inline block.

The result on the sample answer: `The library on the corner` / `shut in 2019` / `and the building sat empty` / `for three years,` / `until a group of neighbours` and so on, nineteen chunks.

## Verify

```sh
pnpm run build
python3 -m http.server 8899 --bind 127.0.0.1 --directory dist
```

Then open `/posts/one-view-of-the-answer.html`. Two things bite in a headless browser:

- A hidden tab gets no `IntersectionObserver` callbacks, so the demo appears dead. Call `Page.bringToFront` before measuring, and read `document.visibilityState` if a run seems not to start.
- `Emulation.setDeviceMetricsOverride` has to be set after the navigation, followed by a `resize` event, or geometry comes back at the previous viewport.

## Publishing

Done on 8 November 2026: the copy is a `post` (`post-one-view-of-the-answer`) with `post-body.md` as `markdownBody`, `splitAtComponent` became `splitAtComponents` in `src/content/markdown.ts` and `src/pages/posts/[slug].astro` renders `<StreamReveal />` for `{{stream-reveal}}` through `src/components/PostEmbed.astro` beside the existing `{{gpu-calculator}}`, and the scaffold page is gone.

A second embed was a route change, not just a page: the marker was already generic in the renderer, so the work was the split helper, the component map, its tests and the schema description. Keeping the embed list in `PostEmbed.astro` means a token for anything not listed stays an invisible comment rather than printing to a reader.
