// @ts-check

import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import localDocuments from './src/integrations/local-documents.mjs'

const identityDirectory =
	process.env.IDENTITY_SOURCE === 'example' ? 'identity.example' : 'identity'
const identityProfile = (await import(`./${identityDirectory}/profile.ts`))
	.default

// https://astro.build/config
export default defineConfig({
	site: identityProfile.site.url,
	devToolbar: { enabled: false },
	integrations: [localDocuments(), sitemap(), mdx()],

	vite: {
		plugins: [tailwindcss()],
	},
})
