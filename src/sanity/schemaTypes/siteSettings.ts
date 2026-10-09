import { defineField, defineType } from 'sanity';

const text = (name: string, title: string, max = 60, description?: string) =>
  defineField({ name, title, type: 'string', description, validation: (rule) => rule.required().max(max) });

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  description:
    'Copy that appears on more than one page: the header, the footer, the contact band, the labels on work stories, posts and reports, and the PDF viewer.',
  fields: [
    defineField({
      name: 'header',
      title: 'Header',
      type: 'object',
      description: 'The Work link takes its label from the Work and Writing index pages.',
      fields: [
        text('readingLabel', 'Reading link label', 30),
        text('aboutLabel', 'About link label', 30),
        text('contactLabel', 'Contact link label', 30, 'Also used in the footer.'),
        text('navigationLabel', 'Navigation name', 40, 'Read out by screen readers, not shown.'),
        text('homeLinkLabel', 'Logo link name', 40, 'Read out by screen readers for the logo, not shown.'),
        text('menuLabel', 'Menu button name', 40, 'Read out by screen readers for the phone menu button.'),
        text('themeToLightLabel', 'Light theme button name', 40, 'Read out while the dark theme is showing.'),
        text('themeToDarkLabel', 'Dark theme button name', 40, 'Read out while the light theme is showing.')
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      fields: [
        text('tagline', 'Tagline', 80),
        text('navigationLabel', 'Navigation name', 40, 'Read out by screen readers, not shown.'),
        text('emailLabel', 'Email link label', 30),
        text('githubLabel', 'GitHub link label', 30),
        text('linkedinLabel', 'LinkedIn link label', 30),
        text('cvLabel', 'CV link label', 30),
        text('rssLabel', 'RSS link label', 30),
        text('privacyLabel', 'Privacy link label', 30),
        text('termsLabel', 'Terms link label', 30)
      ],
      validation: (rule) => rule.required()
    }),
    text('newTabNote', 'New tab note', 60, 'Read out by screen readers after any link that opens a new tab.'),
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
          description: 'Only rendered where the band is given booking={true}: /work and client case studies.',
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
    }),
    defineField({
      name: 'entryLabels',
      title: 'Work story, post and report labels',
      type: 'object',
      fields: [
        text('allWorkLabel', 'Back to work link', 30),
        text('allWritingLabel', 'Back to writing link', 30),
        text('outcomeHeading', 'Default outcome heading', 40, 'Used when a work story does not set its own.'),
        text('artifactsHeading', 'Linked writing heading', 40, 'Above the posts and reports a work story links to.'),
        text('sourceCodeLabel', 'Source code link label', 30, 'Shown on a work card for a link whose kind is Source code.'),
        text('relatedHeading', 'Related heading', 30),
        text('articleLabel', 'Article label', 20),
        text('reportLabel', 'Report label', 20),
        text('readingTimeSuffix', 'Reading time suffix', 20, 'Follows the minute count, as in “6 min read”.'),
        text('pdfSizeSuffix', 'PDF size suffix', 20, 'Follows the size, as in “2.4 MB PDF”.'),
        text('openPdfLabel', 'Open PDF button label', 30)
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'pdfViewer',
      title: 'PDF viewer',
      type: 'object',
      fields: [
        text('previousPage', 'Previous page button'),
        text('nextPage', 'Next page button'),
        text('zoomOut', 'Zoom out button'),
        text('zoomIn', 'Zoom in button'),
        text('resetZoom', 'Reset zoom button'),
        text('fullscreen', 'Fullscreen button'),
        text('loading', 'Loading message', 80),
        text('error', 'Error message', 120),
        text('openDirectly', 'Open directly button', 40)
      ],
      validation: (rule) => rule.required()
    })
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' })
  }
});
