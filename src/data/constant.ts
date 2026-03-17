export type NavLink = { name: string; href: string }
export type SocialLink = { name: string; href: string }

export const links = [
	{ name: 'Home', href: '/' },
	{ name: 'About', href: '/about' },
	{ name: 'Product', href: '/product' },
	{ name: 'Blog', href: '/blog' },
	{ name: 'Slide', href: '/slide' },
	{ name: 'Skill Sheet', href: '/skillsheet' },
	{ name: 'Contact', href: '/contact' },
] satisfies NavLink[]

export const socialLinks: SocialLink[] = [
	{ name: 'Twitter', href: 'https://twitter.com/watabegg' },
	{ name: 'GitHub', href: 'https://github.com/watabegg' },
	{ name: 'Instagram', href: 'https://www.instagram.com/watabegg' },
	{ name: 'Gmail', href: 'mailto:watabegg@gmail.com' },
]
