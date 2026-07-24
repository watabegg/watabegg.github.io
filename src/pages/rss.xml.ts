import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { getPublicIdentity } from '@/identity/load'

export async function GET() {
	const posts = await getCollection('blog')
	const { profile } = getPublicIdentity()
	const site = profile.site.url

	const items = posts
		.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
		.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishDate,
			link: `/blog/${post.id}`,
		}))

	return rss({
		title: `${profile.site.brand} Blog`,
		description: `${profile.site.brand}のブログ記事を配信するRSSフィード`,
		site,
		items,
		customData: '<language>ja-JP</language>',
	})
}
