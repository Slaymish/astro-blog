# Theme Customization Guide

Your blog now uses a CSS custom properties (CSS variables) system that makes it incredibly easy to change the entire color palette.

## Quick Theme Changes

### Method 1: Use Pre-built Themes
Open `src/styles/theme.css` and uncomment one of the preset themes at the bottom:

- **Ocean Blue Theme** - Cool blue colors
- **Sunset Orange Theme** - Warm orange colors  
- **Royal Purple Theme** - Rich purple colors

### Method 2: Create Your Own Theme
Edit the color values in `src/styles/theme.css`:

```css
:root {
  --color-primary-300: #your-light-color;
  --color-primary-400: #your-medium-color;
  --color-primary-500: #your-main-color;
  /* etc... */
}
```

## Color Variable Reference

### Primary Colors
- `--color-primary-500` - Your main brand color (used for accents)
- `--color-primary-400` - Medium shade (used for links)
- `--color-primary-300` - Light shade (used for hover states)

### Background Colors
- `--color-bg-primary` - Darkest background
- `--color-bg-secondary` - Main page background  
- `--color-bg-tertiary` - Elevated elements

### Text Colors
- `--color-text-primary` - Main headings (white)
- `--color-text-secondary` - Body text (light gray)
- `--color-text-muted` - Secondary text (medium gray)
- `--color-text-subtle` - Least important text (dark gray)

### Component Colors
- `--color-tag-bg` - Tag background color
- `--color-tag-text` - Tag text color
- `--color-link` - Link color
- `--color-link-hover` - Link hover color

## Examples

### Minimal Monochrome Theme
```css
:root {
  --color-primary-300: #e5e5e5;
  --color-primary-400: #d1d1d1;
  --color-primary-500: #a3a3a3;
  --color-tag-bg: rgba(163, 163, 163, 0.1);
  --color-tag-text: #e5e5e5;
  --color-link: #d1d1d1;
  --color-link-hover: #e5e5e5;
}
```

### Cyberpunk Pink Theme
```css
:root {
  --color-primary-300: #f472b6;
  --color-primary-400: #ec4899;
  --color-primary-500: #db2777;
  --color-tag-bg: rgba(219, 39, 119, 0.1);
  --color-tag-text: #f472b6;
  --color-link: #ec4899;
  --color-link-hover: #f472b6;
}
```

The entire website will update instantly when you change these values!
