import { defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'publishedAt', title: 'Published', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'updatedAt', title: 'Updated', type: 'datetime' }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'The lede, and the description search engines and the RSS feed use.',
      validation: (r) => r.required().max(240),
    }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (r) =>
            r.custom((value, context) =>
              (context.parent as { asset?: unknown } | undefined)?.asset && !value
                ? 'Alt text is required when a cover image is set'
                : true,
            ),
        }),
      ],
    }),
    defineField({
      name: 'markdownBody',
      title: 'Body',
      type: 'text',
      rows: 30,
      description: 'Markdown. Put {{gpu-calculator}} on its own line to place the GPU cost calculator.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'related',
      title: 'Related',
      type: 'array',
      description: 'Up to three. Left empty, related content falls back to shared tags.',
      of: [{ type: 'reference', to: [{ type: 'post' }, { type: 'report' }] }],
      validation: (r) => r.max(3).unique(),
    }),
  ],
  orderings: [
    { name: 'publishedDesc', title: 'Newest first', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: { select: { title: 'title', subtitle: 'excerpt', media: 'coverImage' } },
});
