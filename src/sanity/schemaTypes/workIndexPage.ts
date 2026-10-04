import { defineField, defineType } from 'sanity';

export const workIndexPage = defineType({
  name: 'workIndexPage',
  title: 'Work index page',
  type: 'document',
  fields: [
    defineField({ name: 'seo', title: 'SEO', type: 'seo', validation: (r) => r.required() }),
    defineField({
      name: 'combined',
      title: 'Combined Work & Writing index',
      type: 'object',
      description: 'Optional overrides for the combined index. Existing work and writing page copy supplies defaults until this is populated.',
      fields: [
        defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
        defineField({
          name: 'hero', title: 'Hero', type: 'object', fields: [
            defineField({ name: 'headlineLines', title: 'Headline lines', type: 'array', of: [{ type: 'string' }], validation: (r) => r.required().min(1) }),
            defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3, validation: (r) => r.required().max(300) }),
          ],
        }),
        ...[
          ['navigationLabel', 'Navigation label'], ['typeFilterLabel', 'View filter label'],
          ['allLabel', 'All label'], ['workLabel', 'Work label'], ['writingLabel', 'Writing label'],
          ['tagFilterLabel', 'Tag filter label'], ['resetLabel', 'Reset filters label'],
          ['resultsLabel', 'Result count noun'],
        ].map(([name, title]) => defineField({ name: name!, title: title!, type: 'string', validation: (r) => r.max(60) })),
        defineField({ name: 'emptyMessage', title: 'Empty state message', type: 'text', rows: 2, validation: (r) => r.max(160) }),
      ],
    }),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      validation: (r) => r.required(),
      fields: [
        defineField({
          name: 'headlineLines',
          title: 'Headline lines',
          type: 'array',
          of: [{ type: 'string' }],
          validation: (r) => r.required().min(1),
        }),
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3, validation: (r) => r.required().max(280) }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Work index page' }) },
});
