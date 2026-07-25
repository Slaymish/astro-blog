import { defineArrayMember, defineField, defineType } from 'sanity';

export const notFoundPage = defineType({
  name: 'notFoundPage',
  title: '404 Page',
  type: 'document',
  fields: [
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Page title', type: 'string', validation: (rule) => rule.required().max(70) }),
        defineField({ name: 'description', title: 'Meta description', type: 'text', rows: 2, validation: (rule) => rule.required().max(200) })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({ name: 'code', title: 'Status code', type: 'string', validation: (rule) => rule.required().max(6) }),
    defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required().max(60) }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 3, validation: (rule) => rule.required().max(240) }),
    defineField({ name: 'homeLabel', title: 'Home button label', type: 'string', validation: (rule) => rule.required().max(40) }),
    defineField({ name: 'backLabel', title: 'Back button label', type: 'string', validation: (rule) => rule.required().max(40) }),
    defineField({ name: 'suggestionsLabel', title: 'Suggestions label', type: 'string', validation: (rule) => rule.required().max(60) }),
    defineField({
      name: 'suggestions',
      title: 'Suggested links',
      type: 'array',
      of: [defineArrayMember({ type: 'ctaLink' })],
      validation: (rule) => rule.required().min(1)
    })
  ],
  preview: {
    prepare: () => ({ title: '404 Page' })
  }
});
