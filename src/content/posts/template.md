---
title: "Your Blog Post Title"
description: "A brief description of your post for SEO and previews"
pubDate: 2024-01-15
tags: ["javascript", "web-development", "tutorial"]
featured: false
draft: false
author: "Your Name"
image: "/images/posts/your-post-image.jpg"
imageAlt: "Description of your image for accessibility"
---

# Your Blog Post Title

This is a template for creating blog posts in your Astro blog. Follow this format to ensure proper parsing and database upload.

## Frontmatter Fields

The frontmatter (between the `---` lines) supports these fields:

- **title**: Required. The main title of your post
- **description**: Optional. SEO description and preview text
- **pubDate**: Required. Publication date in YYYY-MM-DD format
- **tags**: Optional. Array of tags for categorization
- **featured**: Optional. Boolean to mark as featured post
- **draft**: Optional. Set to true to exclude from builds
- **author**: Optional. Author name
- **image**: Optional. Featured image path (relative to public/)
- **imageAlt**: Optional. Alt text for featured image

## Content Guidelines

### Headers
Use standard markdown headers:

```markdown
# H1 - Main title (avoid, use frontmatter title instead)
## H2 - Section headers
### H3 - Subsection headers
```

### Links
Internal links (to other pages):
```markdown
[Link text](/path/to/page)
[About page](/about)
```

External links:
```markdown
[External site](https://example.com)
```

### Images
Images should be placed in `/public/images/posts/` directory:

```markdown
![Alt text](/images/posts/my-image.jpg)
```

For images with captions:
```markdown
![Alt text](/images/posts/my-image.jpg)
*Caption: This is an image caption*
```

### Code Blocks
Inline code: `const variable = 'value'`

Code blocks with syntax highlighting:
```javascript
function example() {
  console.log('Hello, world!');
  return true;
}
```

```css
.my-class {
  color: #333;
  font-size: 16px;
}
```

### Lists
Unordered lists:
- Item one
- Item two
  - Nested item
  - Another nested item

Ordered lists:
1. First item
2. Second item
3. Third item

### Blockquotes
> This is a blockquote. Use it for important notes or quotes from other sources.

### Tables
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | More data |
| Row 2    | Data     | More data |

## Special Markdown Features

### Callouts (if supported)
> **Note:** This is an informational note.

> **Warning:** This is a warning message.

> **Tip:** This is a helpful tip.

### Math (if MathJax/KaTeX is enabled)
Inline math: $E = mc^2$

Block math:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## Best Practices

1. Keep filenames lowercase with hyphens: `my-awesome-post.md`
2. Use descriptive alt text for all images
3. Include relevant tags for discoverability
4. Write compelling descriptions for SEO
5. Use consistent date format: YYYY-MM-DD
6. Test all links before publishing
7. Optimize images before adding them to `/public/images/posts/`

## Example File Structure
```
src/content/posts/
├── template.md (this file)
├── my-first-post.md
├── javascript-tips.md
└── web-performance.md

public/images/posts/
├── my-first-post-hero.jpg
├── javascript-tips-example.png
└── web-performance-chart.svg
```

---

