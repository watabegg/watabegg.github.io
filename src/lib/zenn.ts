import { z } from 'astro:content'

export type ZennItem = {
	title: string
	url: string
	createdAt: Date
}

export type ZennResponse = {
	items: ZennItem[]
	total: number | null
}

const ZennArticleSchema = z.object({
	title: z.string(),
	path: z.string().nullable().optional(),
	published_at: z.string().nullable().optional(),
	published_at_utc: z.string().nullable().optional(),
})

const ZennApiSchema = z.object({
	articles: z.array(ZennArticleSchema).optional(),
	total_count: z.number().nullable().optional(),
})

export async function fetchZennItems(
	username: string | undefined,
	perPage: number = 20,
): Promise<ZennResponse> {
	if (!username) return { items: [], total: null }
	const safePerPage = Math.max(1, Math.min(perPage, 100))
	const url = `https://zenn.dev/api/articles?username=${encodeURIComponent(username)}&order=latest&count=${safePerPage}`

	try {
		const res = await fetch(url, { cache: 'force-cache' })
		if (!res.ok) return { items: [], total: null }
		const parsed = ZennApiSchema.safeParse(await res.json())
		if (!parsed.success) return { items: [], total: null }
		const articles = parsed.data.articles ?? []
		return {
			items: articles.map((it) => {
				const createdAt = it.published_at ?? it.published_at_utc
				return {
					title: it.title,
					url: it.path ? `https://zenn.dev${it.path}` : 'https://zenn.dev',
					createdAt: createdAt ? new Date(createdAt) : new Date(),
				}
			}),
			total: Number.isFinite(parsed.data.total_count)
				? (parsed.data.total_count ?? null)
				: null,
		}
	} catch {
		return { items: [], total: null }
	}
}
