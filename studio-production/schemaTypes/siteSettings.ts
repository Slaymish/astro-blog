import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  description: 'Copy for the contact band that closes the work pages. The header and footer are written in their components.',
  fields: [
    defineField({
      name: 'contactBand',
      title: 'Contact band',
      type: 'object',
      fields: [
        defineField({
          name: 'label',
          title: 'Band label',
          type: 'string',
          description: 'The small uppercase line above the heading. Not an availability badge.',
          validation: (rule) => rule.required().max(60)
        }),
        defineField({
          name: 'defaultHeading',
          title: 'Default heading',
          type: 'string',
          description: 'Used when a page does not supply its own contact band heading.',
          validation: (rule) => rule.required().max(90)
        }),
        defineField({
          name: 'contactLabel',
          title: 'Contact link label',
          type: 'string',
          description: 'Shown on every page except the ones that opt into the booking button.',
          validation: (rule) => rule.required().max(30)
        }),
        defineField({
          name: 'bookingLabel',
          title: 'Booking button label',
          type: 'string',
          description: 'Only rendered where the band is given booking={true}: /work and /contact.',
          validation: (rule) => rule.required().max(30)
        })
      ],
      validation: (rule) => rule.required()
    })
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' })
  }
});
