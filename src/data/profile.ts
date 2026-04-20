export interface EducationItem {
	period: string
	description: string
}

export interface HeadInfo {
	name: string
	furigana: string
	gender: string
	birthDate: string
	email: string
	address: string
}

export interface SkillCategories {
	languages: string[]
	frameworks: string[]
	libraries: string[]
	os: string[]
	db: string[]
	paas: string[]
	tools: string[]
}

export interface ProfileData {
	head: HeadInfo
	education: EducationItem[]
	skills: SkillCategories
}

export const profile: ProfileData = {
	head: {
		name: '渡辺 大樹',
		furigana: 'わたなべ だいき',
		gender: '男性',
		birthDate: '2003-03-09',
		email: 'watabegg@gmail.com',
		address: '日本 長野県',
	},
	education: [
		{
			period: '2018年04月 - 2021年03月',
			description: '岐阜県立恵那高等学校 普通科: 卒業',
		},
		{
			period: '2021年04月 - 現在',
			description: '信州大学 工学部 電子情報システム工学科: 在学',
		},
		{
			period: '2024年03月 - 2024年11月',
			description: '非公開企業: アルバイト',
		},
		{
			period: '2024年11月 - 現在',
			description: 'ASUNA Frontier株式会社: 業務委託契約',
		},
		{ period: '2025年06月 - 現在', description: 'ラムダ技術部: 業務委託契約' },
		{ period: '2026年03月 - 現在', description: '非公開企業: 業務委託契約' },
		{
			period: '2027年03月 (予定)',
			description: '信州大学 工学部 電子情報システム工学科: 卒業見込',
		},
	],
	skills: {
		languages: ['TypeScript', 'JavaScript', 'Python', 'PHP', 'Ruby'],
		frameworks: [
			'Next.js',
			'React',
			'Astro',
			'Vue.js',
			'Hono',
			'WordPress',
			'Ruby on Rails',
		],
		libraries: [
			'daisyUI',
			'GSAP',
			'Tailwind CSS',
			'Drizzle',
			'shadcn/ui',
		],
		os: ['Linux (Ubuntu)', 'macOS', 'Windows'],
		db: ['PostgreSQL', 'MySQL'],
		paas: ['Vercel', 'Cloudflare', 'AWS'],
		tools: ['Git', 'GitHub', 'Docker', 'Figma'],
	},
}
