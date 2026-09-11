import { defineField, defineType } from 'sanity';

/** The title and description every page-copy singleton carries. */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Page title', type: 'string', validation: (r) => r.required().max(70) }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      validation: (r) => r.required().max(200),
    }),
  ],
});
