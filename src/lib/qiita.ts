import { z } from 'astro:content'

export type QiitaItem = {
	title: string
	url: string
	createdAt: Date
}

export type QiitaResponse = {
	items: QiitaItem[]
	total: number | null
}

const QiitaItemSchema = z.object({
	title: z.string(),
	url: z.string(),
	created_at: z.string().optional(),
})

const QiitaItemsSchema = z.array(QiitaItemSchema)

export async function fetchQiitaItems(
	username: string | undefined,
	perPage: number = 20,
): Promise<QiitaResponse> {
	if (!username) return { items: [], total: null }
	const safePerPage = Math.max(1, Math.min(perPage, 100))
	const url = `https://qiita.com/api/v2/users/${encodeURIComponent(username)}/items?page=1&per_page=${safePerPage}`
	const headers: Record<string, string> = { Accept: 'application/json' }
	const token = import.meta.env.QIITA_TOKEN as string | undefined
	if (token) headers.Authorization = `Bearer ${token}`

	try {
		const res = await fetch(url, { headers, cache: 'force-cache' })
		if (!res.ok) return { items: [], total: null }
		const totalHeader = res.headers.get('total-count')
		const total = totalHeader ? Number(totalHeader) : null
		const parsed = QiitaItemsSchema.safeParse(await res.json())
		if (!parsed.success)
			return { items: [], total: Number.isFinite(total) ? total : null }
		return {
			items: parsed.data.map((it) => ({
				title: it.title,
				url: it.url,
				createdAt: it.created_at ? new Date(it.created_at) : new Date(),
			})),
			total: Number.isFinite(total) ? total : null,
		}
	} catch {
		return { items: [], total: null }
	}
}
