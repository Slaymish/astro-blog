import { defineArrayMember, defineField, defineType } from 'sanity';

export const nowPage = defineType({
  name: 'nowPage',
  title: 'Now Page',
  type: 'document',
  fields: [
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', validation: (rule) => rule.required().max(60) }),
        defineField({
          name: 'headlineLines',
          title: 'Headline lines',
          type: 'array',
          description: 'Each entry renders on its own line.',
          of: [defineArrayMember({ type: 'string', validation: (rule) => rule.required().max(40) })],
          validation: (rule) => rule.required().min(1).max(3)
        }),
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 4, validation: (rule) => rule.required().max(300) })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last updated',
      type: 'date',
      description: 'A now page is only worth having if this is true. Refresh it at the close of each Action Plan window.',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'updatedLabel',
      title: 'Last updated label',
      type: 'string',
      description: 'Precedes the date, e.g. "Last updated".',
      validation: (rule) => rule.required().max(40)
    }),
    defineField({
      name: 'entries',
      title: 'Entries',
      type: 'array',
      description: 'Each row is a heading and a paragraph. Building, learning, thinking about, looking for.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required().max(40) }),
            defineField({ name: 'body', title: 'Body', type: 'text', rows: 5, validation: (rule) => rule.required().max(700) }),
            defineField({ name: 'link', title: 'Link', type: 'ctaLink' })
          ],
          preview: { select: { title: 'label', subtitle: 'body' } }
        })
      ],
      validation: (rule) => rule.required().min(1)
    })
  ],
  preview: {
    prepare: () => ({ title: 'Now Page' })
  }
});
