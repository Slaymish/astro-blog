import { defineField, defineType } from 'sanity';

export const workIndexPage = defineType({
  name: 'workIndexPage',
  title: 'Work index page',
  type: 'document',
  fields: [
    defineField({ name: 'seo', title: 'SEO', type: 'seo', validation: (r) => r.required() }),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      validation: (r) => r.required(),
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', validation: (r) => r.required().max(60) }),
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
