import { defineArrayMember, defineField, defineType } from 'sanity';

export const cvPage = defineType({
  name: 'cvPage',
  title: 'CV Page',
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
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', validation: (rule) => rule.required().max(40) }),
        defineField({
          name: 'headlineLines',
          title: 'Headline lines',
          type: 'array',
          description: 'Each entry renders on its own line.',
          of: [defineArrayMember({ type: 'string', validation: (rule) => rule.required().max(40) })],
          validation: (rule) => rule.required().min(1).max(3)
        }),
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 4, validation: (rule) => rule.required().max(400) }),
        defineField({
          name: 'actions',
          title: 'Actions',
          type: 'array',
          of: [defineArrayMember({ type: 'ctaLink' })],
          validation: (rule) => rule.required().min(1).max(3)
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'facts',
      title: 'Professional summary',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required().max(40) }),
            defineField({ name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required().max(120) })
          ],
          preview: { select: { title: 'value', subtitle: 'label' } }
        })
      ],
      validation: (rule) => rule.required().min(1)
    }),
    defineField({
      name: 'academic',
      title: 'Academic CV section',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', validation: (rule) => rule.required().max(40) }),
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required().max(60) }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 4, validation: (rule) => rule.required().max(400) }),
        defineField({ name: 'downloadCta', title: 'Download link', type: 'ctaLink', validation: (rule) => rule.required() }),
        defineField({ name: 'requestCta', title: 'Request link', type: 'ctaLink', validation: (rule) => rule.required() })
      ],
      validation: (rule) => rule.required()
    })
  ],
  preview: {
    prepare: () => ({ title: 'CV Page' })
  }
});
