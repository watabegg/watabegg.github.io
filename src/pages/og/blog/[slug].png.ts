import { getCollection, type CollectionEntry } from 'astro:content';
import { Resvg } from '@resvg/resvg-js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
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
  const fontPath = resolve(process.cwd(), 'src/assets/fonts/NotoSansJP-Bold.ttf');
  const hasFont = existsSync(fontPath);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    font: {
      loadSystemFonts: !hasFont,
      fontFiles: hasFont ? [fontPath] : [],
      defaultFontFamily: hasFont ? 'Noto Sans JP' : 'sans-serif',
      sansSerifFamily: hasFont ? 'Noto Sans JP' : 'sans-serif',
    },
  });
  const pngBuffer = resvg.render().asPng();
  const pngBody = pngBuffer.buffer.slice(
    pngBuffer.byteOffset,
    pngBuffer.byteOffset + pngBuffer.byteLength
  ) as ArrayBuffer;

  return new Response(pngBody, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
