import { defineField, defineType } from 'sanity';

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'datetime',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'homeTileSize',
      title: 'Home Tile Size',
      type: 'string',
      description: 'Controls the project tile size on the home page.',
      options: {
        list: [
          { title: 'Square (1x1)', value: 'square' },
          { title: 'Wide (2x1)', value: 'wide' }
        ],
        layout: 'radio'
      },
      initialValue: 'square'
    }),
    defineField({
      name: 'technologies',
      title: 'Technologies',
      type: 'array',
      of: [{ type: 'string' }]
    }),
    defineField({
      name: 'link',
      title: 'Live Link',
      type: 'url'
    }),
    defineField({
      name: 'github',
      title: 'GitHub',
      type: 'url'
    }),
    defineField({
      name: 'relatedPost',
      title: 'Related Blog Post',
      type: 'reference',
      to: [{ type: 'post' }],
      description:
        'Link this project to its blog post. When set, the project card will link directly to the post instead of the project page.'
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true }
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent'
    })
  ]
});
