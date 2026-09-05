import { defineField, defineType } from 'sanity';

export const book = defineType({
  name: 'book',
  title: 'Book',
  type: 'document',
  fields: [
    defineField({ name: 'note', title: 'My reading note', type: 'text', rows: 4, description: 'What stayed with you, what you questioned, or where you disagreed. Use your own words.' }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Reading', value: 'reading' },
          { title: 'Read', value: 'read' },
          { title: 'To Read', value: 'to-read' }
        ]
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true }
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'url'
    })
  ]
});
