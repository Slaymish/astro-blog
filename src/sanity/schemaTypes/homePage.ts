import { defineArrayMember, defineField, defineType } from 'sanity';

/** A titled section header with its own "see all" link. Used three times on the homepage. */
function indexSection(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', validation: (rule) => rule.required().max(40) }),
      defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required().max(60) }),
      defineField({ name: 'link', title: 'Section link', type: 'ctaLink', validation: (rule) => rule.required() })
    ],
    validation: (rule) => rule.required()
  });
}

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
          description:
            'Rendered in the action colour at the end of the headline. This element is also the origin of the homepage data bus, so it cannot be left empty.',
          validation: (rule) => rule.required().max(40)
        }),
        defineField({ name: 'lede', title: 'Lede', type: 'text', rows: 3, validation: (rule) => rule.required().max(260) }),
        defineField({
          name: 'links',
          title: 'Hero links',
          type: 'array',
          description: 'Plain links, not buttons. The homepage deliberately has no booking call to action.',
          of: [defineArrayMember({ type: 'ctaLink' })],
          validation: (rule) => rule.required().min(2).max(4)
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'interests',
      title: 'What I am interested in',
      type: 'object',
      description: 'Areas of investigation, not claims of expertise. Keep the copy off the language of a skills grid.',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required().max(40) }),
        defineField({ name: 'statement', title: 'Statement', type: 'text', rows: 4, validation: (rule) => rule.required().max(400) }),
        defineField({
          name: 'items',
          title: 'Areas',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required().max(30) }),
                defineField({ name: 'body', title: 'Body', type: 'string', validation: (rule) => rule.required().max(90) })
              ]
            })
          ],
          validation: (rule) => rule.required().min(2).max(4)
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'currently',
      title: 'Currently',
      type: 'object',
      description: 'The honest present-tense statement of where Hamish actually is. Do not dress this up.',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required().max(40) }),
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required().max(90) }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 4, validation: (rule) => rule.required().max(400) }),
        defineField({ name: 'link', title: 'Section link', type: 'ctaLink', validation: (rule) => rule.required() })
      ],
      validation: (rule) => rule.required()
    }),
    indexSection('projectsSection', 'Projects section'),
    indexSection('workSection', 'Work section'),
    indexSection('writingSection', 'Writing section'),
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
