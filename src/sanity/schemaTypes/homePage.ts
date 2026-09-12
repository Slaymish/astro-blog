import { defineField, defineType } from 'sanity';

const text = (name: string, title: string, max = 120) =>
  defineField({ name, title, type: 'string', validation: (r) => r.required().max(max) });

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  fields: [
    defineField({ name: 'seo', title: 'SEO', type: 'seo', validation: (r) => r.required() }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The page’s h1. The name, not a sentence.',
      validation: (r) => r.required().max(60),
    }),
    text('aboutLabel', 'About link label', 40),
    defineField({
      name: 'featured',
      title: 'Featured work',
      type: 'array',
      description: 'Three to five. Each one renders as a full-width row, in this order.',
      of: [{ type: 'reference', to: [{ type: 'workStory' }] }],
      validation: (r) => r.required().min(3).max(5).unique(),
    }),
    text('moreWorkHeading', 'More work heading', 40),
    text('allWorkLabel', 'All work label', 40),
    text('writingLabel', 'Writing label', 40),
    defineField({
      name: 'writingEntry',
      title: 'Featured writing',
      type: 'reference',
      to: [{ type: 'post' }, { type: 'report' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'writingBlurb',
      title: 'Writing blurb',
      type: 'text',
      rows: 3,
      validation: (r) => r.required().max(280),
    }),
    text('writingLinkLabel', 'Writing link label', 40),
    text('allWritingLabel', 'All writing label', 40),
    text('readingLabel', 'Reading label', 40),
    defineField({
      name: 'readingText',
      title: 'Reading text',
      type: 'text',
      rows: 3,
      validation: (r) => r.required().max(280),
    }),
    text('readingLinkLabel', 'Reading link label', 40),
  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
});
