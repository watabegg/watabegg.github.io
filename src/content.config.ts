import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const productsCollection = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './src/content/products' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		publishDate: z.date(),
		tags: z.array(z.string()).default([]),
		imageUrl: z.string().optional(),
		includeInSkillsheet: z.boolean().default(true),
	}),
})

const blogCollection = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		publishDate: z.date(),
		author: z.string().default('watabegg'),
		tags: z.array(z.string()).optional(),
		imageUrl: z.string().optional(),
	}),
})

export const collections = {
	products: productsCollection,
	blog: blogCollection,
}
