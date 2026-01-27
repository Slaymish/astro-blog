How to control the two colours on your website (works when the SVG is **inlined** in the HTML/React tree):

```css
/* Example: drive colours via CSS variables */
.logo {
  --logo-primary: #111827;
  --logo-accent:  #e11d48;
}

.logo .primary { fill: var(--logo-primary); }
.logo .accent  { fill: var(--logo-accent); }
```

Then render it like:

```html
<div class="logo">
  <!-- paste the SVG markup here -->
</div>
```

Quick gotcha: if you use the SVG via `<img src="...">`, your page CSS can’t reach inside it. If you want dynamic colours, inline it (or import it as an inline component in your framework).

