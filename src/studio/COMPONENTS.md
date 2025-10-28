# Studio Components Reference

Complete documentation for all Studio interactive components.

## MarginNote

Side notes that appear in the margin on large screens, inline on mobile.

### Usage

```jsx
import MarginNote from '../../studio/components/MarginNote.astro';

This is a sentence<MarginNote>This appears in the margin</MarginNote>.
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | auto-generated | Optional custom ID for the note |

### Behavior

- **Desktop (>1024px):** Appears in right margin on hover
- **Mobile (≤1024px):** Appears inline below the reference
- **Accessibility:** Uses `role="note"` and `aria-describedby`

---

## Footnote

Inline-expanding footnotes that preserve reading flow.

### Usage

```jsx
import Footnote from '../../studio/components/Footnote.astro';

Important point<Footnote number={1}>Additional context here</Footnote>.
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | auto-generated | Optional custom ID |
| `number` | `number` | `†` | Footnote reference number or symbol |

### Behavior

- Click to expand/collapse
- Auto-closes other footnotes
- Click outside to close
- Smooth animation (respects reduced-motion)
- **Requires JavaScript:** ~2 KB

---

## PullQuote

Visually prominent quote or callout.

### Usage

```jsx
import PullQuote from '../../studio/components/PullQuote.astro';

<PullQuote align="center" size="large">
  Your emphasized quote here
</PullQuote>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `'left' \| 'center' \| 'right'` | `'center'` | Text alignment |
| `size` | `'normal' \| 'large'` | `'normal'` | Font size variant |

### Behavior

- Pure CSS, no JavaScript
- Gradient background effect
- Decorative quotation marks (center alignment only)
- Hover effect (respects reduced-motion)

---

## AudioPlayer

Ambient audio player, muted by default with visible toggle.

### Usage

```jsx
import AudioPlayer from '../../studio/components/AudioPlayer.astro';

<AudioPlayer src="/audio/ambient.mp3" title="Essay ambience" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | **required** | Path to audio file |
| `title` | `string` | `'Ambient audio'` | Accessible label |

### Behavior

- Fixed position (bottom-right corner)
- Loops when playing
- Visual equalizer bars when active
- `preload="none"` for performance
- **Requires JavaScript:** ~1.5 KB

### Best Practices

- Use for ambient/atmospheric audio only
- Keep files under 5MB
- Provide MP3 format for compatibility
- Consider audio length (10+ minutes recommended for essays)

---

## InteractiveBlock

Wrapper for custom interactive visualizations.

### Usage

```jsx
import InteractiveBlock from '../../studio/components/InteractiveBlock.astro';

<InteractiveBlock type="bordered" caption="Optional caption">
  Your custom content here
</InteractiveBlock>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'default' \| 'bordered' \| 'centered'` | `'default'` | Visual style variant |
| `caption` | `string` | `undefined` | Optional figure caption |

### Behavior

- Pure CSS container
- Min-height: 200px
- Fully responsive

### Type Variants

**default:** Minimal padding, no border  
**bordered:** Background + border, more padding  
**centered:** Flexbox centered content

### Use Cases

- Custom SVG diagrams
- Interactive Canvas elements
- Embedded visualizations
- Code playgrounds
- Any content that needs isolation from prose flow

---

## Combining Components

You can nest and combine components:

```jsx
<InteractiveBlock type="bordered" caption="Interactive demonstration">
  <div>
    <p>Content here<MarginNote>Side note about the interaction</MarginNote></p>
    <Footnote number={1}>Technical details</Footnote>
  </div>
</InteractiveBlock>
```

---

## Styling Custom Content

All Studio components respect the design system tokens:

```css
/* Available in component slots */
var(--studio-text-primary)
var(--studio-bg-secondary)
var(--studio-accent)
var(--studio-space-4)
var(--studio-duration-normal)
/* ...and many more */
```

See `src/studio/design.css` for the complete token list.

---

## Performance Notes

- **MarginNote:** Pure CSS (no JS)
- **PullQuote:** Pure CSS (no JS)
- **InteractiveBlock:** Pure CSS (no JS)
- **Footnote:** ~2 KB JS (loaded per essay page)
- **AudioPlayer:** ~1.5 KB JS (only when audio specified)

Total JavaScript for a full-featured essay: **~3.5 KB minified**

Landing page (`/studio`) ships **zero JavaScript**.

---

## Accessibility Checklist

All components include:

✅ Semantic HTML  
✅ ARIA labels where needed  
✅ Keyboard navigation support  
✅ Focus indicators (high contrast)  
✅ Reduced-motion respect  
✅ Screen reader compatibility  

---

## Creating Custom Components

To create a new Studio component:

1. Create file in `src/studio/components/YourComponent.astro`
2. Use Studio design tokens (`--studio-*`)
3. Add to CSS layer if needed: `@layer studio { ... }`
4. Include accessibility attributes
5. Test with keyboard and screen reader
6. Add reduced-motion alternative

Example skeleton:

```astro
---
interface Props {
  // your props
}

const { } = Astro.props;
---

<div class="studio-your-component">
  <slot />
</div>

<style>
  @layer studio {
    .studio-your-component {
      /* Use design tokens */
      color: var(--studio-text-primary);
      padding: var(--studio-space-4);
    }
    
    @media (prefers-reduced-motion: reduce) {
      /* Reduced motion alternative */
    }
  }
</style>
```

---

## Troubleshooting

**Components not importing?**
- Check file path (relative from your MDX file)
- Ensure `.astro` extension is included

**Styles not applying?**
- Verify StudioLayout wraps your page
- Check palette prop is set correctly

**JavaScript not working?**
- Ensure Astro is building client scripts
- Check browser console for errors
- Verify script tags have proper type

**Animation issues?**
- Test with reduced-motion off
- Check CSS transition properties
- Verify design tokens are loaded

---

**Questions?** See `STUDIO-SETUP.md` for full setup documentation.
