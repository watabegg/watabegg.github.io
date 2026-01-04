import { getCollection, type CollectionEntry } from 'astro:content';
import { buildBlogOgSvg } from '../../../lib/og/blog';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

type Props = {
  entry: CollectionEntry<'blog'>;
};

export async function GET({ props }: { props: Props }) {
  const svg = buildBlogOgSvg(props.entry);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
