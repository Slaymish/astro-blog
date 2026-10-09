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
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'string',
      description: 'One line under the name that says what Hamish does. Twenty words at most.',
      validation: (r) => r.required().max(160),
    }),
    text('aboutLabel', 'About link label', 40),
    defineField({
      name: 'featured',
      title: 'Featured work',
      type: 'array',
      description: 'Three or five, in this order. The first renders full width as the lead and the rest fill a two-column grid, which an even count would leave with a gap.',
      of: [{ type: 'reference', to: [{ type: 'workStory' }] }],
      validation: (r) =>
        r.required().min(3).max(5).unique()
          .custom((items) => (!items || items.length % 2 === 1 ? true : 'Pick three or five, so the grid under the lead has no gap.')),
    }),
    text('allWorkLabel', 'All work link label', 40),
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
