import { defineArrayMember, defineField, defineType } from 'sanity';

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact Page',
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
      name: 'channels',
      title: 'Ways to get in touch',
      type: 'array',
      description: 'Each row is a label, a short note, and the link itself.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required().max(30) }),
            defineField({ name: 'note', title: 'Note', type: 'string', validation: (rule) => rule.required().max(120) }),
            defineField({ name: 'link', title: 'Link', type: 'ctaLink', validation: (rule) => rule.required() })
          ]
        })
      ],
      validation: (rule) => rule.required().min(1)
    }),
    defineField({
      name: 'availabilityNote',
      title: 'Availability note',
      type: 'text',
      rows: 3,
      description: 'The one place on the site that talks about taking on work.',
      validation: (rule) => rule.required().max(300)
    })
  ],
  preview: {
    prepare: () => ({ title: 'Contact Page' })
  }
});
