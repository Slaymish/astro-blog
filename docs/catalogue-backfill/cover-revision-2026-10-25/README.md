# Cover revision, 25 October 2026

Twenty work covers from the October backfill share one explainer template: a
"PROJECT DIAGRAM" label, the project title, three numbered boxes joined by
arrows, and a footer such as "Illustration of the implemented structure". The
same drawing with different words reads as a generated infobox rather than as
evidence of work.

This revision replaces all twenty. Three now show the project's own output; the
other seventeen are a single mark per project, drawn from what it does.

## Real output

| Story | File | Where it comes from |
| --- | --- | --- |
| Cookie Cat | `real-cookie-cat-title.png` | The Godot web export in `Slaymish/PlatformerGame` (`HTML/Assignment-1-godot.html`) run headless in Chrome, captured at 2x with CDP. Godot's web build needs `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`, otherwise it renders an error dialog about `SharedArrayBuffer`. |
| Conversational Timing Lab | `turn-timing-cover.png` | `turn-timing-cover.py`, plotted from `results/e0_ami_full.txt` (commit `e46e7a1`). |
| Personal Language Corpus | `corpus-register-cover.png` | `corpus-register-cover.py`, plotted from `outputs/reference/nietzsche-profile.json`. |

## Drawn marks

`covers2.mjs` draws the remaining seventeen as SVG and rasterises them with
sharp. Each mark is trimmed to its ink and fitted to the same 1180x620 box, so
the family holds one optical weight. No text, no numbering, no arrows, no
disclaimer: the card underneath already carries the title.

Palette comes from `src/styles/tokens.css` (`paper-0`, `ink-100`, `ink-500`,
`line-400`, `signal-700`).

## Publishing

`manifest.json` records each file's source and the new alt text.
`publish-covers.mjs` is a dry run by default:

```sh
node publish-covers.mjs                                   # report only
SANITY_WRITE_ACK=1 node publish-covers.mjs --write        # upload + patch
```

Uploads must go through `@sanity/client`. A hand-built multipart body, and the
equivalent `curl -F file=@...`, are rejected by the asset endpoint as
`422 Invalid image, could not process` ("Input buffer contains unsupported image
format") even for a valid PNG. The images are fine; the multipart framing is not.

After the write, the build hook configured in Sanity fires a deploy within
seconds and can race the CDN purge. Check the baked HTML on more than one page
before trusting it: `curl -s https://hamishburke.dev/work | grep -o
'/production/[a-f0-9]\{40\}'` should show the new asset hashes.
