import { defineType, defineField } from 'sanity';
import { CODEX_COPY_KEYS } from '../../content/codexUsage';
export const codexUsagePage = defineType({
  name: 'codexUsagePage', title: 'Codex usage page', type: 'document',
  fields: Object.entries(CODEX_COPY_KEYS).map(([name, keys]) => defineField({
    name, title: name, type: 'object', validation: r => r.required(),
    fields: keys.map(key => defineField({ name: key, title: key, type: 'text', rows: 2, validation: r => r.required().max(800) })),
  })),
});
