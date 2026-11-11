# Stream reveal

An article about how an answer arrives on screen, with a live demonstration of what six arrival modes cost the reader who is trying to read them. Each one lands its full text at the same elapsed time, so the only thing that differs between them is how the text got there, and how much of it moves while it arrives.

## What is here

| File | What it is |
|---|---|
| `src/components/StreamReveal.astro` | The demonstration. One server-rendered paragraph, six arrival modes, a vertical speed slider that multiplies the playback clock from 0.25x to 2x, and the reflow count measured live with a `ResizeObserver` on the paragraph. |
| `docs/stream-reveal/post-body.md` | The article copy, kept in step with the `markdownBody` of the `post` below. |
| `docs/stream-reveal/publish.mjs` | Creates that post. Dry run by default; `SANITY_WRITE_ACK=1 node docs/stream-reveal/publish.mjs --write` writes it, and it refuses when a post with that id or slug already exists. Once the post exists, edit `post-body.md` and run the same command with `--update`, which patches the title, `markdownBody` and `excerpt` and leaves the tags and date alone. |

The piece is a `post` (`post-one-view-of-the-answer`, `/posts/one-view-of-the-answer`), so it appears in the writing feed that `/work` and `/writing` read. It was previewed at `/notes/one-view-of-the-answer` before the CMS write; that scaffold page is deleted, and `netlify.toml` 301s the old path to the post.

## The measurement

A reflow is counted as a change of at least one pixel in the paragraph's height while the text is arriving, which is what moves a line out from under a reader. It is observed on the paragraph, not on the stage, because the stage holds a fixed minimum height so the page does not jump between modes. First text is the elapsed time on the same clock at the first unit painted, which is the number a fast start is asking for.

Measured at 390px wide, on the 399 character sample answer:

| Mode | Reflows | First text | Time to full text |
|---|---|---|---|
| Characters | 10 | 0.0 s | 4.0 s |
| Hybrid | 2 | 0.0 s | 4.0 s |
| Words | 0 | 0.0 s | 4.0 s |
| Chunks | 0 | 0.3 s | 4.0 s |
| Sentences | 0 | 1.7 s | 4.0 s |
| Held | 0 | 4.0 s | 4.0 s |

Hybrid's two reflows are the typed clause re-wrapping. A per-frame height log puts them at 147 ms and 530 ms on this sample, and the paragraph holds its final height from 530 ms to the end, so the movement stops two thirds of a second in and the remaining three and a half seconds are still.

`TARGET` is 4000 ms at the default 25 simulated tok/s. Every character has one arrival timestamp shared by all views. Words, chunks, sentences and everything after a hybrid run's clause buffer until their final character and a boundary arrive; Held waits for EOF. The first sentence therefore waits for its entire prefix, rather than appearing at time zero. `completionOffsets()` and `hybridPhases()` are tested in `tests/stream-arrival.test.ts`.

The vertical slider uses a four-character-per-token approximation (labelled simulated in its accessible name and tooltip), not a model tokenizer: default 25 tok/s, range 6.25–50 tok/s for the current sample. All arrivals use the same multiplier, so changing the rate changes latency in every mode.
An earlier version had another mode, "All at once", which painted the answer in 0.4 s. It went because it was not a case: nothing can paint before the model finishes, so the honest instant baseline is Held with its wait, and the two read as the same demo twice otherwise.

Every mode except Characters, and except the typed clause inside Hybrid, places its units in the DOM before anything is painted, so the paragraph is at its final size from the first frame and the animation only moves opacity, transform and blur. Characters is the only mode whose count moves with the viewport for the whole run, because it is the only one that re-lays-out mid-answer all the way to the end; Hybrid re-lays-out for its first clause and then behaves like the buffered modes.

The speed slider rescales the character timestamps through `cue()`. The elapsed-time metric and wait label report real elapsed seconds. Held uses the identical paragraph as the other modes with opacity zero until EOF; it must not introduce nested paragraphs or change height. Browser checks compare paragraph height and the metrics position before, during and after Held on desktop and mobile.

## How hybrid is chosen

Hybrid is three phases in one run: the first clause a character at a time, words for the rest of the first sentence, whole sentences after that. The boundaries come from the text rather than a second clock, so every unit still lands on the shared character timeline: the phase changes because the answer reached a clause break, not because a timer said so.

`hybridPhases()` in `src/client/stream-arrival.ts` splits on the first `,`, `;` or `:` followed by a space. With no clause break in the first sentence the lead is the opening six words, because a whole first sentence painted at once is not a fast start. Everything after the lead is placed in the DOM at time zero with opacity zero, so only the typed clause can move the paragraph, and it stops moving once the clause is complete. That is the whole argument of the mode: the fine grain buys the first moment, and the coarse grain is what keeps it from running away.

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

To time the reflows rather than count them, poll `answer.getBoundingClientRect().height` on `requestAnimationFrame` from the click and record each change; that is where the 147 ms and 530 ms figures for Hybrid come from.

## Publishing

Done on 8 November 2026: the copy is a `post` (`post-one-view-of-the-answer`) with `post-body.md` as `markdownBody`, `splitAtComponent` became `splitAtComponents` in `src/content/markdown.ts` and `src/pages/posts/[slug].astro` renders `<StreamReveal />` for `{{stream-reveal}}` through `src/components/PostEmbed.astro` beside the existing `{{gpu-calculator}}`, and the scaffold page is gone.

The body was then rewritten in Sanity Studio, so Studio is where the published copy changed and `post-body.md` is kept in step with it rather than the other way round: read the live `markdownBody` before editing, and `publish.mjs --update` now patches the title alongside the body and excerpt so the constants in that script cannot drift from the post.

A second embed was a route change, not just a page: the marker was already generic in the renderer, so the work was the split helper, the component map, its tests and the schema description. Keeping the embed list in `PostEmbed.astro` means a token for anything not listed stays an invisible comment rather than printing to a reader.
