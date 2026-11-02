import { defineField, type SortOrdering } from 'sanity';

/** Internal editorial metadata, shared by every portfolio document type. */
export const portfolioValueFields = [
  defineField({
    name: 'valueScore',
    title: 'Portfolio value score',
    type: 'number',
    description: 'Editorial portfolio significance, 0 to 100. Higher means more representative or substantial. This is not measured quality or research performance. Leave unset when unassessed. Hidden ranking controls homepage and work page selection and order; existing work order and curation remain only as legacy fallback.',
    validation: (rule) => rule.integer().min(0).max(100),
  }),
  defineField({
    name: 'valueReason',
    title: 'Portfolio value reason',
    type: 'text',
    rows: 3,
    description: 'Internal editorial rationale. Studio metadata only; never projected into visitor content.',
  }),
];

export const highestValueOrdering: SortOrdering = {
  name: 'valueDesc',
  title: 'Highest portfolio value',
  by: [{ field: 'valueScore', direction: 'desc' }],
};
