import { defineProfile } from '../src/identity/schema.ts'

export default defineProfile({
	updatedAt: '2026-01-01',
	site: {
		brand: 'example',
		title: 'Example Portfolio',
		description: 'Identity SSoTのサンプルサイト',
		url: 'https://example.com',
	},
	person: {
		name: '山田 太郎',
		nameKana: 'やまだ たろう',
		handle: 'example',
		birthDate: '2000-01-01',
		location: '日本 東京都',
		email: 'hello@example.com',
		website: 'https://example.com',
	},
	socialLinks: [
		{
			name: 'GitHub',
			href: 'https://github.com/example',
			iconId: 'github',
		},
	],
	externalProfiles: {},
	skills: [{ id: 'languages', label: '言語', values: ['TypeScript'] }],
	documents: {
		professionalSummary: 'Webアプリケーション開発に取り組んでいます。',
		selfPromotion: ['課題を整理し、継続的に改善できます。'],
		qualifications: [],
	},
})
