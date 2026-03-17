// @ts-check

import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	// GitHub Pages deployment configuration
	site: 'https://watabegg.github.io',
	integrations: [sitemap()],

	vite: {
		plugins: [tailwindcss()],
	},
})
