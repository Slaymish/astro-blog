https://chester.how/
- I Like the grid structure, which diff sized boxes
- Boxes are either projects, or writings, or info/image panels (like hobbies etc)
- Cute animated cartoon as footer on hover
- their nav bar contains: "Chester,Projects,Writing,Reading,Hobbies"
    - Very simple, my current site has no way for me to list projects (only blog posts and reports)

https://leerob.com/
- Incredibly simple, main page almost looks non styled
- 'By Lee Robinson' links back to main page

https://www.taniarascia.com/
- Custom cartoon glyph in hero, adds character (not AI!!)
- Simple light/dark icon, and dropdown with 5 colours to choose from to change accent. All you need, current theme customiser is heavy and unnecessary
- In writing pages, has a fixed TOC on right
- A comments section for the writings (using Github as signin!)

https://v3.brittanychiang.com/
- I like the direct CTA thats to email them in hero


Chatgpt's Recommendations:

Alright, overall styling ideas, but with a constraint: pick one “spine” and let everything else be quiet. Your notes point to a spine of “clean reading + dashboard grid”, with one or two human flourishes.

First, the spine: typography + grid.

* Typography: readable, slightly opinionated, not “product UI”. One good serif for headings (optional) + a neutral sans for body, or just one excellent sans and call it done. Don’t do three fonts.
* Line length: cap body text around ~65–75 characters. Big difference in how “writerly” it feels.
* Grid: commit to a 12-col grid (or whatever) and use 2–3 card widths only. The Chester vibe is “varied spans, consistent gutters”.

Visual language (the bits people feel instantly)

* Borders over shadows. Thin 1px borders, subtle rounding, almost no drop shadows. Shadows scream “SaaS landing page”.
* One accent colour only. Everything else is neutral. Your accent is for links, buttons, and one tiny highlight per page.
* Whitespace as the main “design”. Make it feel like you’re not trying too hard.

Cards/tile styling (your homepage will live or die here)

* Make tiles look like “index cards”: title, one-line blurb, tags, and a tiny arrow. That’s it.
* Tags should be low-contrast chips (almost grey). If tags are loud, the page becomes a keyboard-smash of labels.
* On hover: one microinteraction only (border brightens, background lifts slightly, arrow nudges). Subtle.

Navigation

* Keep it boring: left = name, right = nav links, far right = theme toggle + accent picker (if you insist).
* Use “By Hamish” or “Hamish” as the home link like leerob. It’s quietly confident.

Hero styling (don’t overbuild it)

* Treat the hero as a “masthead”, not a banner.
* One sentence, then a single strong CTA (email), and optionally two quiet links (Projects, Writing).
* If you want character: a hand-drawn glyph beside your name, tiny, like a maker’s mark. Not a mascot.

Writing pages (make them feel like a book, not a blog theme)

* Big title, then metadata in small type, then content.
* Sticky TOC on desktop is genuinely useful; on mobile it should collapse into a “Contents” button.
* Add small niceties: footnote styling, callouts for “aside”, good code block styling if you have technical posts.
* If you do comments, make them visually clearly “below the essay”, not part of it.

Theme controls (strong opinion)

* Light/dark toggle: yes.
* Accent picker: yes, but 4–6 colours max, and no UI beyond a tiny popover.
* Anything more is procrastination dressed as craftsmanship.

A few aesthetic directions you could lean into (pick one)

1. “Quiet Swiss” (closest to leerob + Tania)
   Lots of whitespace, borders, crisp type, almost no decoration. Your glyph is the only personality.
2. “Notebook / index cards” (closest to Chester)
   Grid-forward, cards feel tactile, occasional doodle/illustration, little playful footer.
3. “Technical minimal”
   More mono, slightly denser, feels like a personal wiki. Risk: can feel cold unless you add one warm element.

A cheap trick that works: a “Now” tile
One small tile on the homepage that always says what you’re currently doing (1–3 bullets). It makes the whole site feel alive without needing constant posts.

Two “don’ts” that will save you weeks

* Don’t build a bespoke design system UI. Tokens + a couple of components is enough.
* Don’t let the homepage become a complete inventory. Curate 8–12 tiles max.


