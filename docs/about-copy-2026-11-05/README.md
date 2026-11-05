# About page copy cleanup, 2026-11-05

Two things on `aboutPage`, both visible from the public dataset.

**Dead fields removed.** The document still carried `hero` and `portrait` from an older
schema. Neither is in `src/sanity/schemaTypes/aboutPage.ts` and neither is in the
`getAboutPage()` projection in `src/content/queries.ts`, so nothing rendered them, but both
said *"Web developer at Alphero"* while every rendered title says software engineer. Deleting
them removes the only place on the site where the old title survived.

**The live duplication.** `intro` and `largeCopy` were printing the same sentence twice, one
after the other, above the project cards:

- intro: *"...the same two questions, who is allowed to reach a system, and what it does when part of it goes away."*
- largeCopy: *"They look scattered, though most of them come back to the same thing, a system somebody else can reach, and what it does when a part of it fails."*

The intro keeps the thesis. `largeCopy` now names the projects instead of re-stating it.

## Running it

```
node publish-copy.mjs --check                        # lint and diff against the live doc, no token
node publish-copy.mjs                                # dry run, Sanity validates the mutation
SANITY_WRITE_ACK=1 node publish-copy.mjs --write     # the real patch
```

Written and applied 2026-11-05. Verified by reading the document back (`hero` and `portrait`
null, new `largeCopy` text present) and by loading `https://hamishburke.com/about` in a
browser after the build hook's deploy: new sentence present, old one gone, no "Web developer"
anywhere in the rendered text.
