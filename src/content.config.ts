import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        technologies: z.array(z.string()).default([]),
        link: z.string().optional(),
        github: z.string().optional(),
        date: z.coerce.date(),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
    })
});

const posts = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        pubDate: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        author: z.string().optional(),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
    })
});

const reports = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/reports' }),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        pubDate: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        author: z.string().optional(),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
        pdfPath: z.string().optional(),
    })
});

export const collections = { projects, posts, reports };
