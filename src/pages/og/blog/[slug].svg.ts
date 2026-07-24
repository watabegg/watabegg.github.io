import { type CollectionEntry, getCollection } from 'astro:content'
import { getPublicIdentity } from '@/identity/load'
import { buildBlogOgSvg } from '@/lib/og/blog'

export async function getStaticPaths() {
	const posts = await getCollection('blog')
	return posts.map((entry) => ({
		params: { slug: entry.id },
		props: { entry },
	}))
}

type Props = {
	entry: CollectionEntry<'blog'>
}

export async function GET({ props }: { props: Props }) {
	const { profile } = getPublicIdentity()
	const svg = buildBlogOgSvg(props.entry, profile.site.brand)

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	})
}
