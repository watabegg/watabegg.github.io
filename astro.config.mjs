// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages deployment configuration
  site: 'https://watabegg.github.io',
  // base: '/', // Optional: Usually not needed for root deployment

  vite: {
    plugins: [tailwindcss()]
  },
});
