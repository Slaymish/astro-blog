import { defineField, defineType } from 'sanity';

export const report = defineType({
  name: 'report',
  title: 'Report',
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
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (r) => r.required().max(300),
    }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'pdfFile',
      title: 'PDF',
      type: 'file',
      options: { accept: '.pdf' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'body', title: 'Body', type: 'blockContent' }),
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
  preview: { select: { title: 'title', subtitle: 'description' } },
});
