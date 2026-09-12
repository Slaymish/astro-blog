import { defineField, defineType } from 'sanity';

const line = (name: string, title: string, max: number) =>
  defineField({ name, title, type: 'string', validation: (r) => r.required().max(max) });

const message = (name: string, title: string, max: number) =>
  defineField({ name, title, type: 'text', rows: 3, validation: (r) => r.required().max(max) });

export const readingPage = defineType({
  name: 'readingPage',
  title: 'Reading page',
  type: 'document',
  fields: [
    defineField({ name: 'seo', title: 'SEO', type: 'seo', validation: (r) => r.required() }),
    line('headline', 'Headline', 40),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'object',
      validation: (r) => r.required(),
      fields: [
        defineField({ name: 'text', title: 'Text', type: 'text', rows: 2, validation: (r) => r.required().max(200) }),
        line('attribution', 'Attribution', 60),
      ],
    }),
    defineField({
      name: 'groups',
      title: 'Group headings',
      type: 'object',
      validation: (r) => r.required(),
      fields: [line('reading', 'Reading now', 40), line('toRead', 'Next', 40), line('read', 'Read', 40)],
    }),
    defineField({
      name: 'recommend',
      title: 'Recommendation form',
      type: 'object',
      validation: (r) => r.required(),
      fields: [
        message('lead', 'Lead', 200),
        line('placeholder', 'Input placeholder', 80),
        line('button', 'Button label', 40),
        message('empty', 'Empty title message', 200),
        message('sending', 'Sending message', 200),
        message('error', 'Error message', 300),
        message('limited', 'Rate limited message', 300),
        message('success', 'Success message', 400),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Reading page' }) },
});
