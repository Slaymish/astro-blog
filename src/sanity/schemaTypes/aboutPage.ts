import { defineField, defineType } from 'sanity';

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  fields: [
    defineField({ name: 'seo', title: 'SEO', type: 'seo', validation: (rule) => rule.required() }),
    defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (r) => r.required().max(80) }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 5, validation: (r) => r.required().max(600) }),
    defineField({
      name: 'portraitAlt',
      title: 'Portrait alt text',
      type: 'string',
      validation: (r) => r.required().max(160),
    }),
    defineField({ name: 'largeCopy', title: 'Large copy', type: 'blockContent' }),
    defineField({
      name: 'projects',
      title: 'Projects',
      type: 'array',
      description: 'Exactly two.',
      of: [
        {
          type: 'object',
          name: 'aboutProject',
          fields: [
            defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (r) => r.required().max(80) }),
            defineField({ name: 'body', title: 'Body', type: 'text', rows: 5, validation: (r) => r.required().max(600) }),
            defineField({ name: 'link', title: 'Link', type: 'ctaLink', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'heading', subtitle: 'link.href' } },
        },
      ],
      validation: (r) => r.required().length(2),
    }),
    defineField({
      name: 'background',
      title: 'Background',
      type: 'object',
      validation: (r) => r.required(),
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required().max(60) }),
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (r) => r.required().max(80) }),
        defineField({
          name: 'paragraphs',
          title: 'Paragraphs',
          type: 'array',
          of: [{ type: 'text', rows: 6 }],
          validation: (r) => r.required().min(1),
        }),
        defineField({ name: 'links', title: 'Links', type: 'array', of: [{ type: 'ctaLink' }] }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'About page' }) },
});
