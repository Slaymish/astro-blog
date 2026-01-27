import { defineField, defineType } from 'sanity';

export const aphorism = defineType({
  name: 'aphorism',
  title: 'Aphorism',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string'
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' }
        ]
      },
      initialValue: 'draft'
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime'
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime'
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }]
    }),
    defineField({
      name: 'text',
      title: 'Display Text',
      type: 'text',
      rows: 2
    }),
    defineField({
      name: 'audio',
      title: 'Audio URL',
      type: 'url'
    }),
    defineField({
      name: 'palette',
      title: 'Palette',
      type: 'string',
      initialValue: 'noir'
    }),
    defineField({
      name: 'motion',
      title: 'Motion',
      type: 'string',
      initialValue: 'subtle'
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent'
    })
  ]
});
