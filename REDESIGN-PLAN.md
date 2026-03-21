# Hamish Website Redesign Plan

**Based on:** Pinterest moodboard analysis (15 pins)
**Current stack:** Astro 5 + Tailwind CSS 4 + Sanity CMS + React components
**Goal:** Shift from bright/pink editorial → warm minimalist with neumorphic depth, deep greens, and bold typography

---

## The Vibe

Minimalist, sophisticated, slightly futuristic — with warm organic undertones. Think premium architecture studio website: deep forest greens, warm sand/beige neutrals, neumorphic UI elements, confident editorial type, and generous breathing room.

---

## Phase 1: Color System Overhaul

### What changes
The current pink accent (#f652a0) and neutral gray palette need to shift to a muted, earthy-meets-cool range anchored by deep forest green.

### File: `src/design-system/tokens.css`

**New accent presets** (replace lines 35–40):
```css
/* Accent color presets (default: forest) */
--accent-forest: #2d6a4f;    /* PRIMARY — deep forest green */
--accent-sage: #74796d;      /* muted sage */
--accent-sand: #b5a28a;      /* warm sand/tan */
--accent-slate: #64748b;     /* cool slate */
--accent-charcoal: #3d3d3d;  /* dark charcoal */
```

**New semantic defaults** (replace lines 42–52):
```css
/* Semantic colors — Light theme */
--bg: #faf9f7;              /* warm off-white (not pure white) */
--surface: #f0ede8;         /* warm light beige */
--surface-2: #e8e4dd;       /* slightly deeper warm */
--text: #1a1a1a;            /* near-black, warm */
--text-muted: #6b6560;      /* warm muted brown-gray */
--border: #d6d0c8;          /* warm border */
--border-strong: #b5afa6;   /* stronger warm border */
--accent: #2d6a4f;          /* forest green */
--accent-contrast: #faf9f7; /* off-white for contrast */
--focus: #2d6a4f;           /* matches accent */
```

**New dark theme** (replace lines 272–298):
```css
.dark {
  --bg: #0c0c0c;              /* deep near-black */
  --surface: #1a1917;         /* warm dark surface */
  --surface-2: #26251f;       /* warm dark elevated */
  --text: #e8e4dd;            /* warm light text */
  --text-muted: #9a948c;      /* warm muted */
  --border: #3d3a34;          /* warm dark border */
  --border-strong: #524e46;   /* stronger dark border */
  --accent: #4ade80;          /* brighter green for dark mode legibility */
  --accent-contrast: #0c0c0c;
  --focus: #4ade80;
}
```

### File: `src/design-system/themes/light.css`

**New brand colors** (replace the primary scale):
```css
--color-primary-50: #f0fdf4;
--color-primary-100: #dcfce7;
--color-primary-200: #bbf7d0;
--color-primary-300: #86efac;
--color-primary-400: #4ade80;
--color-primary-500: #22c55e;
--color-primary-600: #2d6a4f;   /* our forest anchor */
--color-primary-700: #1b4332;
--color-primary-800: #14532d;
--color-primary-900: #052e16;
```

**New background semantics:**
```css
--color-bg-primary: #faf9f7;     /* warm off-white */
--color-bg-secondary: #f5f2ed;   /* warm secondary */
--color-bg-tertiary: #ece8e1;    /* warm tertiary */
--color-bg-inverse: #1a1917;     /* warm inverse */
```

### File: `src/design-system/themes/dark.css`

Update to match the warm dark palette above, with green brand colors adjusted for dark mode visibility.

### File: `src/components/theme/AccentPicker.tsx`

**Replace the color array** (line 5–11):
```tsx
const colors = [
  { name: 'forest', value: '#2d6a4f' },
  { name: 'sage', value: '#74796d' },
  { name: 'sand', value: '#b5a28a' },
  { name: 'slate', value: '#64748b' },
  { name: 'charcoal', value: '#3d3d3d' },
] as const;
```

**Update default** (line 14): Change `'#f652a0'` → `'#2d6a4f'`

### File: `src/styles/globals.css`

Update the `@theme inline` block accent preset mappings (lines 28–32) to reference the new token names.

---

## Phase 2: Typography Refresh

### What changes
The moodboard shows bold, editorial display type used as a design element. Current Playfair Display is on the right track but the moodboard leans more toward strong, geometric modern serifs and clean sans-serifs.

### File: `src/design-system/tokens.css`

**Replace font families** (lines 98–106):
```css
/* Font families */
--font-sans: 'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-serif: 'DM Serif Display', 'Playfair Display', Georgia, serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;

/* Semantic font usage */
--font-body: var(--font-sans);
--font-heading: var(--font-serif);
--font-code: var(--font-mono);
```

> **Why DM Serif Display + DM Sans:** These are a matched pair from Google Fonts. DM Serif Display has the bold, confident editorial weight visible in the moodboard (similar to the "Cut" magazine and "Monterio Modern" typography pins). DM Sans is clean, geometric, and pairs naturally. Both are free. If you prefer to keep Playfair Display, that works too — it's close enough in spirit.

### File: `src/components/layout/Layout.astro`

Update the Google Fonts `<link>` to load DM Sans and DM Serif Display instead of (or alongside) the current fonts.

### File: `src/styles/globals.css`

**Adjust heading styles** (around lines 100–122):
```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 700;           /* bolder — moodboard shows heavy display type */
  line-height: 1.1;           /* tighter — editorial feel */
  letter-spacing: -0.035em;   /* tighter tracking */
  color: var(--text);
}

h1 {
  font-weight: 700;
  font-size: clamp(2.75rem, 6vw, 4.5rem);  /* bigger — statement headings */
  letter-spacing: -0.04em;
  line-height: 1.05;
}
```

---

## Phase 3: Neumorphic UI Components

### What changes
The moodboard strongly features neumorphic / soft-shadow UI (the "I'm futuristic — Neumorphism" pin, the clock/dashboard widget, the soft UI component kit). Current tiles are flat with simple border hover. We need soft depth.

### File: `src/design-system/tokens.css`

**Add neumorphic shadow tokens** (after the existing shadow section):
```css
/* Neumorphic shadows (light theme) */
--shadow-neu: 6px 6px 12px rgba(0, 0, 0, 0.06),
              -6px -6px 12px rgba(255, 255, 255, 0.8);
--shadow-neu-inset: inset 4px 4px 8px rgba(0, 0, 0, 0.06),
                    inset -4px -4px 8px rgba(255, 255, 255, 0.8);
--shadow-neu-hover: 8px 8px 16px rgba(0, 0, 0, 0.08),
                    -8px -8px 16px rgba(255, 255, 255, 0.9);
```

**Dark theme overrides:**
```css
.dark {
  --shadow-neu: 6px 6px 12px rgba(0, 0, 0, 0.25),
                -6px -6px 12px rgba(50, 48, 42, 0.15);
  --shadow-neu-inset: inset 4px 4px 8px rgba(0, 0, 0, 0.25),
                      inset -4px -4px 8px rgba(50, 48, 42, 0.15);
  --shadow-neu-hover: 8px 8px 16px rgba(0, 0, 0, 0.3),
                      -8px -8px 16px rgba(50, 48, 42, 0.2);
}
```

### File: `src/design-system/tokens.css` — tile tokens

**Replace tile styling tokens** (lines 237–247):
```css
--tile-border: none;                        /* remove hard border */
--tile-border-hover: none;
--tile-radius: 1rem;                        /* rounder — 16px */
--tile-padding: 1.75rem;                    /* more breathing room */
--tile-bg: var(--surface);
--tile-bg-hover: var(--surface);            /* same bg, shadow changes */
```

### File: `src/styles/globals.css` — tile component

**Update `.tile` base** (around lines 533–551):
```css
.tile {
  background: var(--tile-bg);
  border: none;
  border-radius: var(--tile-radius);
  padding: var(--tile-padding);
  box-shadow: var(--shadow-neu);            /* neumorphic depth */
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  grid-column: span var(--tile-span, var(--tile-span-square));
  aspect-ratio: var(--tile-aspect, 1 / 1);
  min-height: 0;
  overflow: hidden;
}

.tile:hover {
  box-shadow: var(--shadow-neu-hover);
  transform: translateY(-2px);              /* subtle lift */
  background: var(--tile-bg);
}
```

### File: `src/components/ui/GridTile.astro`

Update the container `div` (line 55) to remove the explicit `bg-[var(--surface)]` and `hover:bg-[var(--surface-2)]` since that's now handled by the `.tile` class with neumorphic shadows. The hover state should feel like a lift, not a color change.

---

## Phase 4: Layout & Spacing Refinements

### What changes
The moodboard shows generous whitespace and gallery-like composition. Current layout is good but can breathe more.

### File: `src/design-system/tokens.css`

**Increase grid gap and padding:**
```css
--grid-gap: 1rem;           /* was 0.75rem — more breathing room */
--tile-padding: 1.75rem;    /* was 1.5rem */
```

**Slightly increase content width for more canvas:**
```css
--content-max-width: 1200px;  /* was 1150px */
```

### File: `src/styles/globals.css`

**Increase body line height slightly:**
```css
body {
  line-height: 1.8;    /* was 1.75 — slightly more open */
}
```

---

## Phase 5: Header & Navigation Refinements

### What changes
Align the header with the moodboard's clean, minimal navigation. The bonsai website pin shows a dark-background nav with minimal links and lots of space.

### File: `src/components/layout/Header.astro`

- Remove the bottom border from the header (line 34: remove `border-b border-[var(--border)]`). Instead, let the header float with no visible separator — cleaner.
- Increase nav padding: `py-4` → `py-6` for more vertical breathing room.
- Consider: make nav links uppercase + letter-spaced for editorial feel:
  ```
  text-xs font-medium uppercase tracking-[0.1em]
  ```

### File: `src/components/layout/Footer.astro`

- Match the warm, muted styling. Ensure footer background uses `var(--surface)` instead of any hard-coded colors.

---

## Phase 6: Scroll Progress Bar

### What changes
Currently the scroll progress bar uses `--accent` (was pink). With the new forest green, this will automatically update. No code change needed, just verify it looks good with the new green.

---

## Phase 7: Button & Interactive Element Styling

### What changes
Buttons should feel neumorphic and tactile, matching the soft UI component kit from the moodboard.

### File: `src/styles/globals.css`

**Add neumorphic button styles:**
```css
.btn-neu {
  background: var(--surface);
  border: none;
  border-radius: var(--radius-md);
  padding: 0.625rem 1.25rem;
  box-shadow: var(--shadow-neu);
  color: var(--text);
  font-weight: 500;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.btn-neu:hover {
  box-shadow: var(--shadow-neu-hover);
  transform: translateY(-1px);
}

.btn-neu:active {
  box-shadow: var(--shadow-neu-inset);
  transform: translateY(0);
}
```

### File: `src/components/theme/AccentPicker.tsx` and `ThemeToggle.tsx`

Update the control buttons to use neumorphic styling: remove explicit borders, add `box-shadow: var(--shadow-neu)` instead. The rounded buttons should feel like softly raised physical controls.

---

## Phase 8: Image & Media Treatment

### What changes
The moodboard features rounded, gallery-style image treatment. Current images have thin borders.

### File: `src/design-system/base.css` (and `globals.css`)

**Update image styles:**
```css
img {
  border: none;                           /* remove the border */
  border-radius: var(--radius-md);        /* 12px — softer corners */
  max-width: 100%;
  height: auto;
  box-shadow: var(--shadow-sm);           /* subtle depth instead of border */
}
```

---

## Migration Checklist

Each phase is independent and can be done incrementally. Recommended order:

1. **Colors** (Phase 1) — biggest visual impact, touches tokens + theme files
2. **Typography** (Phase 2) — second biggest impact, requires font loading change
3. **Neumorphic tiles** (Phase 3) — transforms the homepage grid feel
4. **Spacing** (Phase 4) — quick wins, small token changes
5. **Header/nav** (Phase 5) — editorial nav treatment
6. **Buttons** (Phase 7) — neumorphic interactive elements
7. **Images** (Phase 8) — polish pass
8. **Verify** (Phase 6) — scroll bar and full visual QA

### Files touched (summary)

| File | Phases |
|------|--------|
| `src/design-system/tokens.css` | 1, 3, 4 |
| `src/design-system/themes/light.css` | 1 |
| `src/design-system/themes/dark.css` | 1, 3 |
| `src/design-system/base.css` | 8 |
| `src/styles/globals.css` | 1, 2, 3, 4, 7 |
| `src/components/theme/AccentPicker.tsx` | 1, 7 |
| `src/components/theme/ThemeToggle.tsx` | 7 |
| `src/components/layout/Header.astro` | 5 |
| `src/components/layout/Footer.astro` | 5 |
| `src/components/layout/Layout.astro` | 2 |
| `src/components/ui/GridTile.astro` | 3 |

### What stays the same

- Astro architecture, page routing, Sanity CMS integration
- Component structure (no new components needed)
- Accessibility features (focus styles, skip link, ARIA)
- Responsive breakpoints and grid column system
- All content and markdown styles (they inherit from tokens)
- JetBrains Mono for code blocks
