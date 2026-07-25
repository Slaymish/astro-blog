import { defineArrayMember, defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  description: 'Copy that appears in the header, footer, and contact band on every page.',
  fields: [
    defineField({
      name: 'header',
      title: 'Header',
      type: 'object',
      fields: [
        defineField({
          name: 'navLinks',
          title: 'Navigation links',
          type: 'array',
          of: [defineArrayMember({ type: 'ctaLink' })],
          validation: (rule) => rule.required().min(1)
        }),
        defineField({ name: 'bookingLabel', title: 'Booking button label', type: 'string', validation: (rule) => rule.required().max(30) }),
        defineField({
          name: 'bookingLabelShort',
          title: 'Booking button label (narrow screens)',
          type: 'string',
          validation: (rule) => rule.required().max(16)
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      fields: [
        defineField({ name: 'tagline', title: 'Tagline', type: 'string', validation: (rule) => rule.required().max(120) }),
        defineField({
          name: 'navLinks',
          title: 'Navigation links',
          type: 'array',
          of: [defineArrayMember({ type: 'ctaLink' })],
          validation: (rule) => rule.required().min(1)
        }),
        defineField({
          name: 'profileLinks',
          title: 'Profile links',
          type: 'array',
          of: [defineArrayMember({ type: 'ctaLink' })],
          validation: (rule) => rule.required().min(1)
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'contactBand',
      title: 'Contact band',
      type: 'object',
      fields: [
        defineField({ name: 'availabilityLabel', title: 'Availability label', type: 'string', validation: (rule) => rule.required().max(60) }),
        defineField({
          name: 'defaultHeading',
          title: 'Default heading',
          type: 'string',
          description: 'Used when a page does not supply its own contact band heading.',
          validation: (rule) => rule.required().max(90)
        }),
        defineField({ name: 'bookingLabel', title: 'Booking button label', type: 'string', validation: (rule) => rule.required().max(30) })
      ],
      validation: (rule) => rule.required()
    })
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' })
  }
});
