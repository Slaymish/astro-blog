import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './src/sanity/schemaTypes';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || '';
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
  name: 'hamish-blog',
  title: 'Hamish Blog',
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: {
    types: schemaTypes
  }
});
