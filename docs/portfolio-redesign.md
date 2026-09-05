# Portfolio editorial refresh

The homepage selects You Inc, Sprint Coach, and Home Lab explicitly rather than sorting by date. `/work` lists all stories newest first; `/projects` redirects there. Primary navigation is maintained in the shared Header component.

## Editing stories

Sanity's optional **Project introduction** overrides the concise editorial defaults in `src/lib/workEditorial.ts`. **Project narrative** replaces the existing Portable Text body when populated. Existing published bodies are still read, so the redesign does not require a content migration. You Inc has a revised default narrative that reflects its move from SaaS to self-hosting, rather than displaying the older account-signup narrative.

The existing result field remains visible on each detail page. Material limitations stay with the story, rather than being repeated on listing cards. Both schema copies include the new fields. No production CMS documents were mutated by this change.

## Remaining personal assets

- Home Lab uses its existing recovery architecture diagram. Replace it with an actual photograph when one is available; do not generate a photograph of the machine.
- Books have an optional **My reading note** field, displayed beneath the author. No opinions have been invented. Once Hamish adds notes, one can be chosen for the homepage or About.

## Preview and release

This remains the existing Astro / Sanity / Netlify site. The redesign does not migrate hosting. The Netlify redirect makes the old project index a real 301 in production; the Astro route also redirects during development.
