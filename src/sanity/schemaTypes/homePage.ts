import { defineArrayMember, defineField, defineType } from 'sanity';

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
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
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', validation: (rule) => rule.required().max(90) }),
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          description: 'The plain part of the headline. The accent below is appended in the action colour.',
          validation: (rule) => rule.required().max(90)
        }),
        defineField({
          name: 'headlineAccent',
          title: 'Headline accent',
          type: 'string',
          description: 'Rendered in the action colour at the end of the headline.',
          validation: (rule) => rule.required().max(40)
        }),
        defineField({ name: 'lede', title: 'Lede', type: 'text', rows: 3, validation: (rule) => rule.required().max(260) }),
        defineField({ name: 'primaryCta', title: 'Primary call to action', type: 'ctaLink', validation: (rule) => rule.required() }),
        defineField({ name: 'secondaryCta', title: 'Secondary call to action', type: 'ctaLink', validation: (rule) => rule.required() })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'services',
      title: 'Capabilities',
      type: 'array',
      description: 'The three-column list that sits at the foot of the hero.',
      of: [defineArrayMember({ type: 'string', validation: (rule) => rule.required().max(40) })],
      validation: (rule) => rule.required().min(1).max(4).unique()
    }),
    defineField({
      name: 'workSection',
      title: 'Selected work section',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', validation: (rule) => rule.required().max(40) }),
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required().max(60) }),
        defineField({ name: 'link', title: 'Section link', type: 'ctaLink', validation: (rule) => rule.required() })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'approach',
      title: 'Approach section',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required().max(40) }),
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required().max(90) }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 4, validation: (rule) => rule.required().max(400) }),
        defineField({ name: 'link', title: 'Section link', type: 'ctaLink', validation: (rule) => rule.required() })
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
    prepare: () => ({ title: 'Home Page' })
  }
});
