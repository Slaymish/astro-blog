# Studio Visual Style Guide

## Typography

### Font Families
```css
Body Text (Essays):  Serif (Iowan Old Style, Palatino, URW Palladio)
UI Elements:         Sans-serif (System UI stack)
Code/Technical:      Monospace (Cascadia Code, Source Code Pro, Menlo)
```

### Type Scale (Literary)
```
Base:   18px (1.125rem) - Essay body text
Small:  14px (0.875rem) - Metadata, captions
Large:  20px (1.25rem)  - Pull quotes
2XL:    24px (1.5rem)   - Section headings
4XL:    36px (2.25rem)  - Essay titles
5XL:    48px (3rem)     - Landing page title
```

### Line Heights
```
Tight:    1.25  - Headings
Snug:     1.375 - Sub-headings
Normal:   1.5   - UI elements
Relaxed:  1.625 - Essay body (primary)
Loose:    1.75  - Pull quotes
```

## Color Palettes

### Noir (Default)
```
Background Primary:   #0a0a0a (pure dark)
Background Secondary: #121212
Text Primary:         #e8e8e8 (off-white)
Text Secondary:       #b8b8b8
Text Muted:           #888888
Accent:               #d4d4d4
Border:               #2a2a2a

Use for: Philosophy, logic, abstract concepts
```

### Sepia
```
Background Primary:   #1a1612 (warm brown-black)
Background Secondary: #221f1a
Text Primary:         #e8dcc8 (cream)
Text Secondary:       #c8bca8
Accent:               #d4c4a8 (sand)

Use for: History, memory, retrospective essays
```

### Forest
```
Background Primary:   #0d120f (deep green-black)
Background Secondary: #141a16
Text Primary:         #d8e8dd (pale green)
Text Secondary:       #b8c8bd
Accent:               #a8d8b8 (mint)

Use for: Systems, ecology, interconnection
```

### Ocean
```
Background Primary:   #0a0e12 (deep blue-black)
Background Secondary: #12161a
Text Primary:         #d8e4e8 (ice blue)
Text Secondary:       #b8c4c8
Accent:               #a8c4d8 (sky blue)

Use for: Flow, depth, contemplation
```

### Ember
```
Background Primary:   #120a08 (deep red-black)
Background Secondary: #1a1210
Text Primary:         #e8d8d4 (warm white)
Text Secondary:       #c8b8b4
Accent:               #d8a8a4 (rose)

Use for: Energy, urgency, counterarguments
```

## Spacing Scale

```
1:  4px   - Inline padding
2:  8px   - Small gaps
3:  12px  - Form elements
4:  16px  - Default spacing
6:  24px  - Section spacing
8:  32px  - Large gaps
12: 48px  - Major sections
16: 64px  - Page margins
24: 96px  - Dramatic spacing
```

## Motion

### Duration
```
Fast:     150ms - Micro-interactions (hover states)
Normal:   300ms - Standard transitions
Slow:     500ms - Deliberate animations
Slower:   800ms - Dramatic reveals
Slowest:  1200ms - Full-page transitions
```

### Easing Curves
```
Linear:     linear                              - Looping animations
In:         cubic-bezier(0.4, 0, 1, 1)         - Disappearing elements
Out:        cubic-bezier(0, 0, 0.2, 1)         - Appearing elements (default)
In-Out:     cubic-bezier(0.4, 0, 0.2, 1)       - State changes
Elastic:    cubic-bezier(0.68, -0.55, 0.27, 1.55) - Playful emphasis
Smooth:     cubic-bezier(0.25, 0.46, 0.45, 0.94)  - Natural flow
```

### Motion Profiles

**Subtle (Default)**
- Duration: 300ms
- Easing: Ease-out
- Use for: Most interactions

**Moderate**
- Duration: 500ms
- Easing: Smooth
- Use for: Essays with more visual emphasis

**Expressive**
- Duration: 800ms
- Easing: Elastic
- Use for: Playful or conceptually-important motion

## Component Anatomy

### Margin Notes
```
Position:     Right margin (desktop), Inline (mobile)
Trigger:      † symbol, accent color
Appearance:   Fade in + slide from left (desktop)
Typography:   Sans-serif, 14px, normal line-height
Background:   Secondary background with accent border
```

### Footnotes
```
Trigger:      [Number], monospace, accent color
Appearance:   Expand inline with smooth height transition
Typography:   Sans-serif, 14px, normal line-height
Background:   Secondary background with accent border
Interaction:  Click to toggle, auto-close others
```

### Pull Quotes
```
Typography:   Serif italic, 20-24px, snug line-height
Background:   Gradient from secondary to transparent
Decoration:   Large opening quote mark (center aligned)
Spacing:      Generous vertical margins (48px)
Effect:       Subtle hover effect
```

### Audio Player
```
Position:     Fixed bottom-right
Shape:        Pill (rounded 100px)
Elements:     Play/pause button, label, visualizer bars
Typography:   Sans-serif, 12px uppercase
Background:   Secondary with border and backdrop blur
Visualizer:   3 bars, pulsing animation when playing
```

### Interactive Blocks
```
Variants:     Default (minimal), Bordered (framed), Centered (flexbox)
Background:   Secondary (bordered only)
Border:       1px solid border color
Min-Height:   200px
Caption:      Sans-serif italic, 14px, muted, centered
```

## Layout

### Container Width
```
Max Width:     720px (essays)
               800px (landing page)
               1200px (with margin notes)
```

### Page Margins
```
Desktop:       64px horizontal, 64px top, 96px bottom
Mobile:        16px horizontal, 48px top, 64px bottom
```

### Content Margins
```
Essay Header:  Bottom: 64px, Border: 1px
Essay Footer:  Top: 64px, Border: 1px
Sections:      64px vertical spacing
Paragraphs:    24px bottom
```

## Header & Navigation

### Studio Header
```
Height:        Auto (padded)
Position:      Sticky top
Background:    Primary with backdrop blur
Border:        1px bottom
Logo:          ◆ (diamond), 24px, rotates 45° on hover
Nav Links:     Sans-serif, 12px uppercase, wide letter-spacing
Exit:          × symbol, 48px, rotates 90° on hover
```

### Footer
```
Border:        1px top
Padding:       32px vertical
Typography:    Sans-serif, 12px uppercase, wide letter-spacing
Links:         Muted color, fade to primary on hover
Separator:     · (middot), border color
```

## Prose Styles

### Headings
```
H1: Sans-serif, 36px, 600 weight, tight line-height, -0.025em tracking
H2: Sans-serif, 24px, 600 weight, snug line-height, -0.025em tracking
H3: Sans-serif, 20px, 600 weight, normal line-height, -0.025em tracking
Margins: Top 48-64px, Bottom 24-32px
```

### Links
```
Color:         Accent
Underline:     1px solid accent-dim
Hover:         Underline becomes full accent color
Focus:         2px outline, 3px offset, accent color
Transition:    300ms ease-out
```

### Blockquotes
```
Border:        3px left, accent-dim
Padding:       24px left
Font Style:    Italic
Color:         Text secondary
Margins:       32px vertical
```

### Code
```
Inline:        Monospace, 14px, tertiary background, 2px padding, 3px radius
Block:         Tertiary background, 16px padding, 4px radius
Pre:           Overflow-x auto, margin 24px vertical
```

### Lists
```
Padding:       32px left
Item Spacing:  8px
Margins:       24px vertical
```

## Animations

### Page Load
```
Landing:       Elements fade in sequentially (100ms stagger)
Essay Header:  Fade in + slide up (slow, 500ms)
Essay Content: Fade in with delay (200ms)
```

### Interactions
```
Hover:         Smooth color transitions (300ms)
Focus:         Immediate outline appearance
Click:         Instant feedback, smooth state change
Scroll:        Passive, no scroll-triggered animations
```

### Reduced Motion
```
All animations: Duration 1ms
All transitions: Duration 1ms
Scroll behavior: Auto (no smooth scroll)
Transforms: None (use opacity only)
```

## Accessibility

### Focus States
```
Outline:       2px solid accent
Offset:        2-3px
Border-radius: 2px (soften corners)
Visibility:    Only on keyboard focus (:focus-visible)
```

### Color Contrast
```
Body Text:     Minimum 7:1 (AAA)
UI Text:       Minimum 4.5:1 (AA)
Large Text:    Minimum 3:1 (AA)
Borders:       Minimum 3:1 (against backgrounds)
```

### Interactive Targets
```
Minimum Size:  44px × 44px (touch targets)
Spacing:       8px minimum between targets
Hover Area:    Equal to or larger than visual element
```

## Breakpoints

```
Desktop:       > 1024px (margin notes appear)
Tablet:        768px - 1024px
Mobile:        < 768px (stack layout, inline notes)
Small Mobile:  < 640px (reduce type scale)
```

## CSS Layer Architecture

```
@layer studio {
  /* All Studio styles isolated here */
  /* No global styles leak in */
  /* No Studio styles leak out */
}
```

---

## Usage Examples

### Minimal Essay
```mdx
---
title: "Simple Thought"
abstract: "A brief exploration"
palette: "noir"
motion: "subtle"
published: 2025-10-28
status: "published"
tags: []
---

## Main Idea

Pure prose. No components needed.
```

### Full-Featured Essay
```mdx
---
title: "Complex Concept"
subtitle: "With many dimensions"
abstract: "Exploring through interaction"
palette: "forest"
motion: "moderate"
audio: "/audio/ambient.mp3"
published: 2025-10-28
status: "published"
tags: ["philosophy", "systems"]
---

import MarginNote from '../../studio/components/MarginNote.astro';
import Footnote from '../../studio/components/Footnote.astro';
import PullQuote from '../../studio/components/PullQuote.astro';
import InteractiveBlock from '../../studio/components/InteractiveBlock.astro';

Complex idea<MarginNote>Side observation</MarginNote> with
context<Footnote number={1}>Deep dive here</Footnote>.

<PullQuote align="center" size="large">
Core insight
</PullQuote>

<InteractiveBlock type="bordered" caption="Visual explanation">
  Custom visualization here
</InteractiveBlock>
```

---

**This style guide is living documentation. Update as the system evolves.**
