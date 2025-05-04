import { defineCollection, z } from 'astro:content';

const productsCollection = defineCollection({
  type: 'content', // 'content' for Markdown/MDX files
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(), // Expect a Date object (Astro parses YYYY-MM-DD)
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().optional(), // Optional image for the card
  }),
});

// Define the blog collection schema (similar to products)
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(), // Short description for list view
    publishDate: z.date(), // Expect a Date object
    author: z.string().default('watabegg'), // Default author
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().optional(), // Optional image for the post
  }),
});

// Export all collections
export const collections = {
  'products': productsCollection,
  'blog': blogCollection,
};
