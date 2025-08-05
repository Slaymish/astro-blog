import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
  }),
});

const reports = defineCollection({
  type: 'content',  // Changed from 'data' to 'content'
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    pdfPath: z.string(), // relative path to PDF file
  }),
});

export const collections = {
  blog,
  reports,
};
