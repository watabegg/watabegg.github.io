import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
	const posts = await getCollection('blog')
	const site = context.site ?? 'https://watabegg.github.io'

	const items = posts
		.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
		.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishDate,
			link: `/blog/${post.id}`,
		}))

	return rss({
		title: 'watabegg Blog',
		description: 'watabeggのローカルブログ記事を配信するRSSフィード',
		site,
		items,
		customData: '<language>ja-JP</language>',
	})
}
