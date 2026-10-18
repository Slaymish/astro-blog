# Four original-project cover replacements

Hamish requested replacements for the four generated illustrations and explicitly retained the 19 explanatory diagrams. The final replacement manifest contains only ArticulateAI, Otto, Synod and Lumen. No entry copy, date, order or links changed. The catalogue contains 38 backfill entries and eight original stories.

- ArticulateAI: `run.py`'s actual twelve-choice command menu. `articulate-menu.py` runs the original source to its first input, with an inert import adapter so no microphone, audio client or API is invoked. `render-covers.mjs` typesets that exact captured output.
- Otto: the unmodified native `JournalView`, rendered offscreen by `NSHostingView` using the repository's shipped capability data. `render-otto.swift` supplies a read-only bridge; it does not operate the desktop, record audio or use model services. The cover states that it is an offline render.
- Synod: the plugin built from its original TypeScript source, running in Obsidian 1.13.7 in the empty CaptureVault. The real status panel is cropped from `synod-native.png`.
- Lumen: the original plugin research form, running in the same empty Obsidian vault. The form is cropped from `lumen-native.png`. The question was not submitted.

The temporary vault lives under `/Users/hamishburke/Documents/Codex/project-media-2026-10-10/CaptureVault`. Both plugins were enabled with Hamish's explicit approval. The personal vault was not used for captures. No dependencies were installed. Existing esbuild compiled the plugin code with Obsidian external.

`native-covers.mjs` makes the two screenshot covers. `replacement-covers.json` records media source, alt text and capture time. `update-bundle.py` updates the selected local media metadata. `publish.mjs` snapshots the dataset, uploads covers and patches only cover fields with revision preconditions. Its verification preserves all non-cover fields and the 42 other story revisions.

## Broader preparation, subsequently narrowed

A broader pass prepared replacements for all 23 authored covers while an optional scope question was pending. Those reached Sanity before Hamish's reply specified only four generated illustrations. `restore-diagrams.mjs` restored the other 19 covers from the exact previous values. They are retained in the final catalogue and manifest. The unused source, game and artwork captures remain local research artifacts; they are not selected on the site.

`before-broader-update.json` preserves the original 46 documents before that pass. `broader-update-result.json` records the intermediate update. `before.json` snapshots the final four-cover update. `result.json` is the current result. Historical generic-image files in `../media/` are not selected by the current cover manifest.

Build and post-build tests pass, with 104 Markdown twins and all 221 tests passing. Delayed Netlify deploy `6ac982141511aa15b389ba9c` published at 1:09:37 PM NZDT. Verification passed against its permalink and the apex domain: all 38 backfill pages, expected cover assets, copy, canonicals and negotiated Markdown twins passed; the two removed URLs return 404. Fresh dataset comparison confirms that only the four requested cover fields differ from the pre-update catalogue, and all 19 diagram covers match their exact prior values.
