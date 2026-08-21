import { defineArrayMember, defineField, defineType } from 'sanity';

const artifactTypes = [{ type: 'post' }, { type: 'report' }];

const isIndependent = (document: unknown): boolean =>
  (document as { kind?: string } | undefined)?.kind === 'independent';

/**
 * The four reflection questions an independent project has to answer. They are
 * conditionally rather than unconditionally required: a plain `required()` fires
 * even while the field is hidden, which would block editors saving professional
 * stories. `src/lib/work.ts` enforces the same rule at build time.
 */
function reflectionField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'text',
    rows: 3,
    fieldset: 'reflection',
    hidden: ({ document }) => !isIndependent(document),
    validation: (rule) =>
      rule.max(400).custom((value, context) => {
        if (!isIndependent(context.document)) return true;
        return typeof value === 'string' && value.trim().length > 0
          ? true
          : 'Required for independent projects.';
      })
  });
}

export const workStory = defineType({
  name: 'workStory',
  title: 'Work Story',
  type: 'document',
  fieldsets: [
    {
      name: 'reflection',
      title: 'Reflection (independent projects)',
      options: { collapsible: true, collapsed: false }
    }
  ],
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
      name: 'kind',
      title: 'Kind',
      type: 'string',
      description:
        'Which index this story appears on. Professional shows on /work, independent on /projects. Detail pages live at /work/<slug> either way.',
      options: {
        list: [
          { title: 'Professional', value: 'professional' },
          { title: 'Independent', value: 'independent' }
        ],
        layout: 'radio'
      },
      initialValue: 'professional',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'status',
      title: 'Portfolio status',
      type: 'string',
      description: 'Presentation within an index: lead stories get a full card, support stories a compact row.',
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
      name: 'metric',
      title: 'Index metric',
      type: 'string',
      description:
        'The measured fact shown on the homepage index. Print the number that exists, whether or not it flatters — an unflattering measurement is the point. Distinct from Result, which is prose for the case-study page.',
      validation: (rule) => rule.max(100)
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
    reflectionField('question', 'What was the question?'),
    reflectionField('built', 'What did I build?'),
    reflectionField('learned', 'What did I learn?'),
    reflectionField('differently', 'What would I do differently?'),
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
              { title: 'Sprint Coach release path', value: 'sprint-coach' },
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
    select: { title: 'title', descriptor: 'descriptor', status: 'status', kind: 'kind' },
    prepare({ title, descriptor, status, kind }) {
      return { title, subtitle: `${kind ?? 'professional'} · ${status ?? 'Unclassified'} · ${descriptor ?? ''}` };
    }
  }
});
