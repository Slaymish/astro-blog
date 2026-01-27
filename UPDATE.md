# Site Style Specification (Hamish) — v1

Goal: personal site with a clean reading experience + a curated homepage grid of mixed-size “cards”. Minimal chrome, lots of whitespace, subtle personality. Not a literal “desk” metaphor.

## Information Architecture

Primary nav (top):
- Hamish (home)
- Projects
- Writing
- About

Key pages:
- `/` Home (hero + card grid)
- `/projects` Projects index (cards)
- `/writing` Writing index (list or cards; reading-first)
- `/writing/<slug>` Post page (book-like reading layout + optional desktop TOC)
- `/about` About (short bio + links + optional “uses”)

## Global Layout

Content width:
- Max content width: 1100–1200px
- Reading width (posts): 720–780px body column
- Side column for desktop TOC: 240–300px
- Gutter/padding: 24px mobile, 32px tablet, 40px desktop

Spacing scale (use consistently):
- 4, 8, 12, 16, 24, 32, 48, 64 px

Border radius:
- Cards: 12px (default)
- Buttons/chips: 10px
- Small UI (toggles): 8px

Border:
- 1px solid with subtle contrast (theme-dependent)

Shadows:
- Prefer none.
- Optional hover shadow: very subtle, short spread (avoid “SaaS card” look).

## Typography

General:
- Use 1 primary sans font across site OR 1 sans + optional serif for headings.
- Avoid more than 2 font families total.

Suggested sizing (approx):
- Body: 16–18px, line-height 1.6–1.8
- Small/meta: 13–14px
- H1: 40–48px desktop, 32–36px mobile
- H2: 24–28px
- H3: 18–20px

Reading page text rules:
- Max line length ~65–75 characters
- Paragraph spacing: 1.0–1.2em
- Headings have generous top spacing (e.g. 2.0em) and smaller bottom spacing (0.6em)

Links:
- Default underlined or underline-on-hover (choose one and keep consistent)
- Link colour uses accent.

## Colour System (CSS Variables)

Define semantic tokens; actual palette can be adjusted later.

Base tokens:
- `--bg`
- `--surface` (card background)
- `--surface-2` (hover/secondary surfaces)
- `--text`
- `--text-muted`
- `--border`
- `--border-strong`
- `--accent` (user-selectable)
- `--accent-contrast` (text/icon on accent)
- `--focus` (use accent or a derived colour)

Light theme defaults (example intent):
- bg near-white
- surface slightly warmer/softer than bg
- muted text clearly readable
- border subtle but visible

Dark theme defaults:
- bg near-black but not pure
- surface slightly lifted from bg
- border low-contrast but readable
- text high contrast without being harsh

Accent colour picker:
- Provide 5 preset accent options (no custom picker needed).
- Store selection in `localStorage` (e.g. key `accent`).
- Provide a small UI in nav bar: a “palette” icon -> popover with 5 colour dots.
- Also store theme mode (`light|dark|system`) in `localStorage` (key `theme`).

Recommended accent presets (agent can choose exact hex):
- Blue
- Green
- Orange
- Pink/Magenta
- Purple

Rules:
- Accent used for: links, primary button, active nav underline, small highlights (e.g. tag outline on hover), focus ring.
- Do NOT use accent as large backgrounds everywhere.

Focus states (accessibility):
- Always visible on keyboard navigation: 2px outline using `--focus`.

## Navigation (Header)

Structure:
- Left: “Hamish” (home link)
- Right: Projects / Writing / About
- Far right: theme toggle + accent picker popover

Styling:
- Compact, minimal, no heavy background.
- Optional: subtle bottom border spanning content width.

Active state:
- Active nav link uses accent (text or underline).
- Keep it subtle (no pill backgrounds unless very faint).

## Buttons & Controls

Primary button:
- Used mainly for Email CTA.
- Background: accent, text: accent-contrast.
- Hover: slightly darker/lighter accent.
- Border: none or 1px accent border.

Secondary button:
- Transparent with border, uses `--border-strong` or accent border.
- Hover: `--surface-2`

Icon buttons (theme + palette):
- Small square, subtle hover background `--surface-2`
- Always has accessible label (aria-label)

## Cards System (Core UI)

Card base:
- Background: `--surface`
- Border: 1px `--border`
- Radius: 12px
- Padding: 16–20px (size-dependent)
- Layout: title, one-line description, optional meta/tags/links

Card hover:
- Background to `--surface-2` OR border to `--border-strong`
- Optional lift: translateY(-1px) with short duration
- Optional subtle shadow only on hover

Card types:
1) Project card
   - Title
   - 1-line blurb (8–14 words)
   - Tags (2–4)
   - Link area: “View” or arrow icon

2) Writing card
   - Title
   - Date + reading time (optional)
   - 1-line hook

3) Hobby/info card (not necessarily clickable)
   - Title (e.g. “Bouldering”, “Piano”)
   - 2–3 bullet lines labelled “Currently / Next / Notes” (no fluffy adjectives)
   - Optional tiny glyph icon

4) Featured/anchor card (large)
   - Used for “Personal Dashboard” on home
   - Can include small internal links: HealthAgent, FinanceAgent, Read update

Tags/chips:
- Small text, muted background or outline
- Do not dominate visual hierarchy

## Homepage

Hero:
- Small masthead, not a banner
- Elements:
  - Name
  - One sentence tagline (what you build / care about)
  - CTAs: Email (primary), Projects/Writing (secondary links)

Grid:
- Use a responsive grid with mixed spans.
- Define only 3 card sizes (small/medium/large) to keep it intentional.
- Desktop example:
  - 12-column grid
  - Large card spans 6–7 columns, medium 4–5, small 3–4
- Mobile:
  - 1 column stacked, keep ordering sensible (anchor first)

Home tile priorities:
- Large anchor: “Personal Dashboard (Health + Finance)”
- Medium: key projects (ESP32 Lighting Controller, Metlink Departures Display, Bedroom Layout Designer)
- Small: Wikirouter, Piano Improvisation Helper, 2–3 writings, 2 hobby cards

## Projects Index Page (`/projects`)

- Grid of project cards (mostly uniform medium size)
- Optional tag filter row at top:
  - Filter buttons are chips (not a complex UI)
  - Filtering is instant, no page reload required

Each project entry should support:
- Title
- 1-line description
- Tags
- Link(s): Repo and/or Demo and/or Write-up

## Writing Index Page (`/writing`)

Prefer reading-first:
- List layout with strong typography, not overly “cardy”.
- Each row:
  - Title
  - Date
  - 1-line hook
- Optional pinned/featured section for “On the Ordinary Absurd”.

## Post Page (`/writing/<slug>`)

Layout:
- Main column: 720–780px
- Desktop TOC on right:
  - Sticky within viewport
  - Collapsible on smaller screens (or hidden)
- Header:
  - Title
  - Date / reading time
- Footer:
  - Links: back to Writing, edit on GitHub (optional), related posts (optional)

Content styling:
- Headings have clear hierarchy
- Code blocks:
  - Monospace font
  - Soft background, subtle border
  - Horizontal scroll if needed
- Blockquotes:
  - Left border, muted background
- Images:
  - Rounded corners, max width fits column, caption styling (muted small text)

## About Page (`/about`)

- Short bio (not a CV)
- Links (GitHub, email, etc.)
- Optional “Now” section
- Optional “Uses” section (brief)

## Micro-interactions

Keep subtle:
- Card hover lift/border change
- Nav underline transition
- Accent picker popover open/close
- Optional small footer doodle that animates on hover (one only)

Animation rules:
- Duration: 120–180ms
- Easing: ease-out
- Respect `prefers-reduced-motion` (disable transforms/animations)

## Implementation Notes (for the agent)

- Use CSS variables for theming + accent.
- Store `theme` and `accent` in localStorage.
- Theme modes:
  - system (default)
  - light
  - dark
- Accent presets are constants; applying them sets `--accent`.
- Ensure accessible contrast for text on accent buttons.
- Ensure keyboard focus outlines are visible.
- Do not introduce a heavy “theme customiser” page; keep controls in header only.

## Deliverables

1) Implement global tokens + light/dark themes + 5-accent picker.
2) Implement nav bar with theme + accent controls.
3) Implement card component system + sizes.
4) Implement home hero + mixed-span responsive grid.
5) Implement projects index and writing index.
6) Implement post template with desktop sticky TOC.
7) Ensure mobile layout is clean and simple.

