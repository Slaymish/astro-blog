import { defineField, defineType } from 'sanity';

const KINDS = [
  { title: 'Client', value: 'professional' },
  { title: 'Independent', value: 'independent' },
  { title: 'Research', value: 'research' },
] as const;

export const workStory = defineType({
  name: 'workStory',
  title: 'Work story',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required().max(80) }),
    defineField({
      name: 'descriptor',
      title: 'Descriptor',
      type: 'string',
      description: 'What the thing is, in a few words. Shown beside the title.',
      validation: (r) => r.required().max(60),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: { list: [...KINDS], layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'order', title: 'Order', type: 'number', validation: (r) => r.required().integer() }),
    defineField({ name: 'date', title: 'Date', type: 'date', validation: (r) => r.required() }),
    defineField({ name: 'timeframe', title: 'Timeframe', type: 'string', validation: (r) => r.max(60) }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 2,
      description: 'One sentence, used in lists.',
      validation: (r) => r.required().max(180),
    }),
    defineField({
      name: 'introduction',
      title: 'Introduction',
      type: 'text',
      rows: 3,
      description: 'The opening of the case study, and its meta description.',
      validation: (r) => r.required().max(320),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'text',
      rows: 2,
      validation: (r) => r.required().max(180),
    }),
    defineField({ name: 'body', title: 'Narrative', type: 'blockContent', validation: (r) => r.required() }),
    defineField({
      name: 'resultHeading',
      title: 'Result heading',
      type: 'string',
      description: 'Defaults to Outcome.',
      validation: (r) => r.max(40),
    }),
    defineField({ name: 'result', title: 'Result', type: 'text', rows: 3, validation: (r) => r.required().max(280) }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'workLink',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required().max(30) }),
            defineField({
              name: 'href',
              title: 'Destination',
              type: 'string',
              description: 'A full URL, or a site path such as “/writing”.',
              validation: (r) => r.required(),
            }),
            defineField({ name: 'external', title: 'Opens in a new tab', type: 'boolean', initialValue: false }),
          ],
          preview: { select: { title: 'label', subtitle: 'href' } },
        },
      ],
    }),
    defineField({
      name: 'cover',
      title: 'Cover',
      type: 'object',
      fields: [
        defineField({
          name: 'kind',
          title: 'Kind',
          type: 'string',
          options: {
            list: [
              { title: 'Image', value: 'image' },
              { title: 'Figure', value: 'figure' },
            ],
            layout: 'radio',
          },
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'text',
          rows: 3,
          description: 'Describes the cover for a reader who cannot see it. Required for both kinds.',
          validation: (r) => r.required().max(240),
        }),
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: { hotspot: true },
          hidden: ({ parent }) => parent?.kind !== 'image',
        }),
        defineField({
          name: 'figure',
          title: 'Figure',
          type: 'object',
          hidden: ({ parent }) => parent?.kind !== 'figure',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.max(40) }),
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.max(60) }),
            defineField({
              name: 'facts',
              title: 'Facts',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'fact',
                  fields: [
                    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required().max(40) }),
                    defineField({ name: 'value', title: 'Value', type: 'string', validation: (r) => r.required().max(40) }),
                    defineField({ name: 'note', title: 'Note', type: 'string', validation: (r) => r.max(80) }),
                  ],
                  preview: { select: { title: 'value', subtitle: 'label' } },
                },
              ],
              validation: (r) => r.min(1).max(5),
            }),
            defineField({ name: 'footnote', title: 'Footnote', type: 'text', rows: 2, validation: (r) => r.max(160) }),
          ],
        }),
      ],
      validation: (r) =>
        r.required().custom((cover) => {
          const value = cover as
            | { kind?: string; image?: unknown; figure?: { title?: string; facts?: unknown[] } }
            | undefined;
          if (!value?.kind) return 'Pick a cover kind';
          if (value.kind === 'image' && !value.image) return 'An image cover needs an image';
          if (value.kind === 'figure') {
            if (!value.figure?.title) return 'A figure cover needs a title';
            if (!value.figure?.facts?.length) return 'A figure cover needs at least one fact';
          }
          return true;
        }),
    }),
    defineField({
      name: 'evidence',
      title: 'Evidence',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'evidenceItem',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              validation: (r) => r.required(),
            }),
            defineField({ name: 'alt', title: 'Alt text', type: 'text', rows: 3, validation: (r) => r.required().max(240) }),
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.max(40) }),
            defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (r) => r.max(80) }),
            defineField({ name: 'caption', title: 'Caption', type: 'text', rows: 3, validation: (r) => r.max(240) }),
          ],
          preview: { select: { title: 'heading', subtitle: 'label', media: 'image' } },
        },
      ],
    }),
    defineField({
      name: 'artifacts',
      title: 'From this project',
      type: 'array',
      description: 'Posts and reports that came out of this work.',
      of: [{ type: 'reference', to: [{ type: 'post' }, { type: 'report' }] }],
      validation: (r) => r.unique(),
    }),
    defineField({
      name: 'related',
      title: 'Related',
      type: 'array',
      description: 'Up to three.',
      of: [{ type: 'reference', to: [{ type: 'workStory' }, { type: 'post' }, { type: 'report' }] }],
      validation: (r) => r.max(3).unique(),
    }),
  ],
  orderings: [{ name: 'orderAsc', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', kind: 'kind', descriptor: 'descriptor' },
    prepare: ({ title, kind, descriptor }) => ({
      title,
      subtitle: [kind, descriptor].filter(Boolean).join(' · '),
    }),
  },
});
