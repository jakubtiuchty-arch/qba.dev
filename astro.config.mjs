// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pageWeight from './src/integrations/page-weight.mjs';

export default defineConfig({
  site: 'https://qba.dev',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      // Strony z noindex nie trafiają do mapy strony.
      filter: (page) => !/\/(kontakt\/(wyslano|blad)|404)\/?$/.test(page),
    }),
    pageWeight(),
  ],
});
