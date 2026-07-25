import { defineArrayMember, defineField, defineType } from 'sanity';

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
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
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required().max(90) }),
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 4, validation: (rule) => rule.required().max(400) })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'portrait',
      title: 'Portrait section',
      type: 'object',
      fields: [
        defineField({ name: 'imageAlt', title: 'Portrait alt text', type: 'string', validation: (rule) => rule.required().max(140) }),
        defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required().max(40) }),
        defineField({
          name: 'largeCopy',
          title: 'Large copy',
          type: 'blockContent',
          description: 'Rich text so the employer link stays editable inline.'
        }),
        defineField({ name: 'body', title: 'Supporting paragraph', type: 'text', rows: 4, validation: (rule) => rule.required().max(400) })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'capabilities',
      title: 'Capabilities section',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required().max(40) }),
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required().max(60) }),
        defineField({
          name: 'items',
          title: 'Items',
          type: 'array',
          description: 'Numbering (01, 02, …) is applied automatically in display order.',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required().max(60) }),
                defineField({ name: 'body', title: 'Body', type: 'text', rows: 3, validation: (rule) => rule.required().max(300) })
              ],
              preview: { select: { title: 'title', subtitle: 'body' } }
            })
          ],
          validation: (rule) => rule.required().min(1)
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'background',
      title: 'Background section',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required().max(40) }),
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required().max(90) }),
        defineField({
          name: 'paragraphs',
          title: 'Paragraphs',
          type: 'array',
          of: [defineArrayMember({ type: 'text', validation: (rule) => rule.required().max(500) })],
          validation: (rule) => rule.required().min(1)
        }),
        defineField({
          name: 'links',
          title: 'Links',
          type: 'array',
          of: [defineArrayMember({ type: 'ctaLink' })],
          validation: (rule) => rule.required().min(1)
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'contactHeading',
      title: 'Contact band heading',
      type: 'string',
      validation: (rule) => rule.required().max(90)
    })
  ],
  preview: {
    prepare: () => ({ title: 'About Page' })
  }
});
