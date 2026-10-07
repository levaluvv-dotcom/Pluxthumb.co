// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// GitHub Pages со своим доменом (файл public/CNAME): https://pluxthumb.space/
export default defineConfig({
  site: 'https://pluxthumb.space',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', ru: 'ru' } },
      filter: (page) => page.endsWith('/') && !page.includes('404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
