import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  description: 'Copy for the contact band that closes the work pages, and the default work card button. The header and footer are written in their components.',
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
          name: 'professionalHeading',
          title: 'Client work heading',
          type: 'string',
          description: 'Closes a client case study, where the band offers a booking.',
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
        }),
        defineField({
          name: 'form',
          title: 'Email callback form',
          description: 'Publish all fields to show the email form in each contact band.',
          type: 'object',
          fields: [
            defineField({ name: 'lead', title: 'Introduction', type: 'string', validation: (rule) => rule.required().max(200) }),
            defineField({ name: 'emailLabel', title: 'Email field label', type: 'string', validation: (rule) => rule.required().max(200) }),
            defineField({ name: 'button', title: 'Submit button', type: 'string', validation: (rule) => rule.required().max(200) }),
            defineField({ name: 'sending', title: 'Sending message', type: 'string', validation: (rule) => rule.required().max(200) }),
            defineField({ name: 'success', title: 'Success message', type: 'string', validation: (rule) => rule.required().max(200) }),
            defineField({ name: 'error', title: 'Error message', type: 'string', validation: (rule) => rule.required().max(200) }),
            defineField({ name: 'limited', title: 'Rate limit message', type: 'string', validation: (rule) => rule.required().max(200) })
          ]
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'workCtaLabel',
      title: 'Work card button label',
      type: 'string',
      description: 'The button on a work card and a home page feature, unless the story sets its own CTA label.',
      validation: (rule) => rule.required().max(30)
    })
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' })
  }
});
