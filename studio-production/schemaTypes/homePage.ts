import { defineField, defineType } from 'sanity';

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
      name: 'fold',
      title: 'Fold',
      type: 'object',
      description:
        'The name, and three annotations hung off it on leader lines. There is deliberately no eyebrow, headline and lede stack: the annotations are the subtitle, and they carry a place, a count and a link rather than restating the name. The middle annotation is counted from the work stories at build time rather than authored here, so it cannot drift out of date.',
      fields: [
        defineField({
          name: 'name',
          title: 'Name',
          type: 'string',
          description: 'Set at display scale. Also the origin of the fold data bus, so it cannot be empty.',
          validation: (rule) => rule.required().max(40)
        }),
        defineField({
          name: 'position',
          title: 'Position',
          type: 'string',
          description:
            'The first annotation: where Hamish is and since when. A fragment, not a sentence — the fold has no room for prose.',
          validation: (rule) => rule.required().max(60)
        }),
        defineField({
          name: 'sourceLink',
          title: 'Source link',
          type: 'ctaLink',
          description: 'The third annotation, and the only element on the static page in the action colour.',
          validation: (rule) => rule.required()
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'indexSection',
      title: 'Index tail links',
      type: 'object',
      description: 'The two links that close the dated index.',
      fields: [
        defineField({ name: 'projectsLink', title: 'Projects link', type: 'ctaLink', validation: (rule) => rule.required() }),
        defineField({ name: 'writingLink', title: 'Writing link', type: 'ctaLink', validation: (rule) => rule.required() })
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
