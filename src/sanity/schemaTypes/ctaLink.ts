import { defineField, defineType } from 'sanity';

export const ctaLink = defineType({
  name: 'ctaLink',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required().max(60)
    }),
    defineField({
      name: 'href',
      title: 'Destination',
      type: 'string',
      description: 'A site path such as “/work”, a full URL, or a “mailto:” address.',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'external',
      title: 'Opens in a new tab',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'ariaLabel',
      title: 'Accessible label',
      type: 'string',
      description: 'Optional. Use when the visible label alone would not make the destination clear.',
      validation: (rule) => rule.max(120)
    })
  ],
  preview: {
    select: { title: 'label', subtitle: 'href' }
  }
});
