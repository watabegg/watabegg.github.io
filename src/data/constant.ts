export type NavLink = { name: string; href: string }

export const links = [
	{ name: 'Home', href: '/' },
	{ name: 'About', href: '/about' },
	{ name: 'Product', href: '/product' },
	{ name: 'Blog', href: '/blog' },
	{ name: 'Slide', href: '/slide' },
	{ name: 'Skill Sheet', href: '/skillsheet' },
	{ name: 'Contact', href: '/contact' },
] satisfies NavLink[]
