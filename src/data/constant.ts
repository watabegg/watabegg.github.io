import {
  House,
  Info,
  Package,
  SquarePen,
  MessageCircle,
  LayoutPanelTop,
  FileBadge,
  type AstroComponent,
} from '@lucide/astro';

export type NavLink = { name: string; href: string; icon: AstroComponent };

export const links = [
  { name: 'Home', href: '/', icon: House },
  { name: 'About', href: '/about', icon: Info },
  { name: 'Product', href: '/product', icon: Package },
  { name: 'Blog', href: '/blog', icon: SquarePen },
  { name: 'Slide', href: '/slide', icon: LayoutPanelTop },
  { name: 'Skill Sheet', href: '/skillsheet', icon: FileBadge },
  { name: 'Contact', href: '/contact', icon: MessageCircle },
] satisfies NavLink[];
