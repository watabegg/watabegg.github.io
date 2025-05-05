// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages deployment configuration
  site: 'https://watabegg.github.io',
  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()]
  },
});
