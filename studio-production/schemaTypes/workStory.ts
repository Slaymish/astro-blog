import { defineArrayMember, defineField, defineType } from 'sanity';

const artifactTypes = [{ type: 'project' }, { type: 'post' }, { type: 'report' }];

export const workStory = defineType({
  name: 'workStory',
  title: 'Work Story',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(80)
    }),
    defineField({
      name: 'descriptor',
      title: 'Plain-language descriptor',
      type: 'string',
      description: 'A literal noun phrase such as “Client portfolio website”.',
      validation: (rule) => rule.required().max(60)
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
      title: 'Portfolio status',
      type: 'string',
      options: {
        list: [
          { title: 'Lead', value: 'lead' },
          { title: 'Support', value: 'support' }
        ],
        layout: 'radio'
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      validation: (rule) => rule.required().integer().positive()
    }),
    defineField({
      name: 'service',
      title: 'Primary service',
      type: 'string',
      options: {
        list: [
          { title: 'AI automation', value: 'ai-automation' },
          { title: 'Websites and digital products', value: 'digital-products' },
          { title: 'Solution architecture and technical direction', value: 'technical-direction' }
        ]
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'date',
      title: 'Story date',
      type: 'date',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'summary',
      title: 'Glance summary',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required().max(180)
    }),
    defineField({
      name: 'problem',
      title: 'Problem',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(240)
    }),
    defineField({
      name: 'role',
      title: 'Hamish’s role',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required().max(180)
    }),
    defineField({
      name: 'timeframe',
      title: 'Timeframe',
      type: 'string',
      validation: (rule) => rule.max(60)
    }),
    defineField({
      name: 'interventions',
      title: 'Key interventions',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) => rule.required().max(120)
        })
      ],
      validation: (rule) => rule.required().min(1).max(3).unique()
    }),
    defineField({
      name: 'result',
      title: 'Result or learning',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(280)
    }),
    defineField({
      name: 'graphic',
      title: 'Editorial graphic',
      type: 'object',
      fields: [
        defineField({
          name: 'kind',
          title: 'Composition',
          type: 'string',
          options: {
            list: [
              { title: 'BrontëHF publishing path', value: 'brontehf' },
              { title: 'You Inc ledger flow', value: 'you-inc' },
              { title: 'GPUShare trust boundary', value: 'gpu-share' },
              { title: 'HealthAgent data pipeline', value: 'health-agent' },
              { title: 'Home Lab recovery architecture', value: 'home-lab' },
              { title: 'Wildfire Spark experiment', value: 'wildfire' }
            ]
          },
          validation: (rule) => rule.required()
        }),
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'text',
          rows: 3,
          validation: (rule) => rule.required().max(240)
        })
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'primaryArtifact',
      title: 'Primary source artifact',
      type: 'reference',
      to: artifactTypes
    }),
    defineField({
      name: 'supportingArtifacts',
      title: 'Supporting artifacts',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: artifactTypes })],
      validation: (rule) => rule.unique()
    }),
    defineField({
      name: 'body',
      title: 'Case study body',
      type: 'blockContent',
      validation: (rule) => rule.required()
    })
  ],
  orderings: [
    {
      title: 'Portfolio order',
      name: 'portfolioOrder',
      by: [{ field: 'order', direction: 'asc' }]
    }
  ],
  preview: {
    select: { title: 'title', descriptor: 'descriptor', status: 'status' },
    prepare({ title, descriptor, status }) {
      return { title, subtitle: `${status ?? 'Unclassified'} · ${descriptor ?? ''}` };
    }
  }
});
