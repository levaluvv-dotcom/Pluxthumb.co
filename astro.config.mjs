// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

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
  vite: {
    plugins: [tailwindcss()],
  },
});
