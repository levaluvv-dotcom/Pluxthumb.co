// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// GitHub Pages: https://levaluvv-dotcom.github.io/Pluxthumb.co/
// При подключении своего домена: site → 'https://<домен>', base убрать, добавить public/CNAME.
export default defineConfig({
  site: 'https://levaluvv-dotcom.github.io',
  base: '/Pluxthumb.co',
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
