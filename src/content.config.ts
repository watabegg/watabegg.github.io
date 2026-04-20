import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const productsCollection = defineCollection({
	loader: glob({
		pattern: '**/[^_]*.{md,mdx}',
		base: './src/content/products',
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		publishDate: z.date(),
		tags: z.array(z.string()).default([]),
		imageUrl: z.string().optional(),
		draft: z.boolean().default(false),
		includeInSkillsheet: z.boolean().default(true),
		skillsheet: z
			.object({
				period: z.string(),
				summary: z.string(),
				responsibilities: z.array(z.string()).optional(),
				techStack: z.array(z.string()).optional(),
				deliverables: z
					.array(z.object({ label: z.string(), url: z.string() }))
					.optional(),
			})
			.optional(),
	}),
})

const blogCollection = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
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
