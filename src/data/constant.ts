import { getPublicIdentity } from '@/identity/load'

export type NavLink = { name: string; href: string }
export type SocialIconId = 'twitter' | 'github' | 'instagram' | 'gmail'
export type SocialLink = { name: string; href: string; iconId: SocialIconId }

export const links = [
	{ name: 'Home', href: '/' },
	{ name: 'About', href: '/about' },
	{ name: 'Product', href: '/product' },
	{ name: 'Blog', href: '/blog' },
	{ name: 'Slide', href: '/slide' },
	{ name: 'Contact', href: '/contact' },
] satisfies NavLink[]

export const socialLinks: SocialLink[] = getPublicIdentity().profile.socialLinks
