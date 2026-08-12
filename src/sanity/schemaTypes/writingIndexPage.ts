import { defineArrayMember, defineField, defineType } from 'sanity';

export const writingIndexPage = defineType({
  name: 'writingIndexPage',
  title: 'Writing Index Page',
  type: 'document',
  fields: [
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Page title', type: 'string', validation: (rule) => rule.required().max(70) }),
        defineField({ name: 'description', title: 'Meta description', type: 'text', rows: 3, validation: (rule) => rule.required().max(200) })
      ],
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
      name: 'filterLabel',
      title: 'Tag filter label',
      type: 'string',
      validation: (rule) => rule.required().max(40)
    }),
    defineField({
      name: 'emptyMessage',
      title: 'Empty state message',
      type: 'string',
      validation: (rule) => rule.required().max(120)
    })
  ],
  preview: {
    prepare: () => ({ title: 'Writing Index Page' })
  }
});
