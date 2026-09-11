import { defineField, defineType } from 'sanity';

const text = (name: string, title: string, max = 120) =>
  defineField({ name, title, type: 'string', validation: (r) => r.required().max(max) });

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  fields: [
    defineField({ name: 'seo', title: 'SEO', type: 'seo', validation: (r) => r.required() }),
    text('eyebrow', 'Eyebrow', 60),
    text('heading', 'Heading', 60),
    defineField({ name: 'lede', title: 'Lede', type: 'text', rows: 2, validation: (r) => r.required().max(200) }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3, validation: (r) => r.required().max(280) }),
    text('aboutLabel', 'About link label', 40),
    defineField({
      name: 'featured',
      title: 'Featured work',
      type: 'array',
      description: 'Exactly three. The first is the lead feature.',
      of: [{ type: 'reference', to: [{ type: 'workStory' }] }],
      validation: (r) => r.required().length(3).unique(),
    }),
    text('leadLinkLabel', 'Lead feature link label', 60),
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
