import type { CollectionEntry } from 'astro:content'

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const COLOR_PRIMARY = '#008033'
const COLOR_PRIMARY_DEEP = '#006828'
const COLOR_BASE = '#f8f8f8'
const COLOR_BASE_SOFT = '#f2f2f2'
const COLOR_TEXT = '#18181b'
const COLOR_TEXT_MUTED = '#4b5563'

const escapeXml = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')

const splitTitle = (
	title: string,
	maxLineLength = 18,
	maxLines = 2,
): string[] => {
	const chars = Array.from(title)
	const lines: string[] = []
	let current = ''
	let consumed = 0

	for (const char of chars) {
		if (lines.length >= maxLines) break
		if (current.length >= maxLineLength) {
			lines.push(current)
			current = ''
		}
		if (lines.length >= maxLines) break
		current += char
		consumed += 1
	}

	if (current && lines.length < maxLines) {
		lines.push(current)
	}

	if (consumed < chars.length && lines.length > 0) {
		const lastIndex = lines.length - 1
		const trimmed = lines[lastIndex].slice(0, Math.max(1, maxLineLength - 1))
		lines[lastIndex] = `${trimmed}…`
	}

	return lines
}

const clampText = (value: string, maxLength: number) => {
	if (value.length <= maxLength) return value
	return `${value.slice(0, Math.max(1, maxLength - 1))}…`
}

export function buildBlogOgSvg(
	entry: CollectionEntry<'blog'>,
	brand: string,
): string {
	const title = entry.data.title
	const dateLabel = entry.data.publishDate.toLocaleDateString('ja-JP', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	const lines = splitTitle(title)
	const dateLineText = clampText(dateLabel, 56)

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="panel" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${COLOR_PRIMARY_DEEP}" stop-opacity="0.98" />
      <stop offset="100%" stop-color="${COLOR_PRIMARY}" stop-opacity="0.85" />
    </linearGradient>
    <linearGradient id="panel-soft" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${COLOR_PRIMARY}" stop-opacity="0.45" />
      <stop offset="100%" stop-color="${COLOR_PRIMARY}" stop-opacity="0.18" />
    </linearGradient>
    <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#0b1320" flood-opacity="0.18" />
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0b1320" flood-opacity="0.12" />
    </filter>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${COLOR_BASE}" />
  <rect x="0" y="0" width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${COLOR_BASE_SOFT}" opacity="0.6" />

  <g transform="skewY(-7)">
    <rect x="-200" y="-190" width="1000" height="520" rx="40" fill="url(#panel)" />
  </g>
  <g transform="skewY(-7)">
    <rect x="420" y="300" width="980" height="460" rx="44" fill="url(#panel-soft)" />
  </g>

  <rect x="40" y="60" width="1120" height="510" rx="26" fill="#ffffff" stroke="#e5e7eb" filter="url(#card-shadow)" />

  ${lines
		.map((line, index) => {
			const y = 200 + index * 88
			return `<text x="110" y="${y}" font-family="'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif" font-size="64" font-weight="700" fill="${COLOR_TEXT}">${escapeXml(line)}</text>`
		})
		.join('')}

  <text x="110" y="500" font-family="'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif" font-size="30" font-weight="700" fill="${COLOR_PRIMARY}" letter-spacing="1">${escapeXml(brand)} / blog</text>

  <text x="940" y="500" font-family="'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif" font-size="23" fill="${COLOR_TEXT_MUTED}">${escapeXml(dateLineText)}</text>
</svg>`
}
