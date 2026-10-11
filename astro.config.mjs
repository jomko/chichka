import { defineConfig } from 'astro/config';

// Default production origin for absolute canonical, Open Graph and Twitter URLs.
// SITE_URL can override it for a deliberate alternate deployment.
const site = process.env.SITE_URL || 'https://chichkova.com';
export default defineConfig({ output: 'static', trailingSlash: 'ignore', ...(site ? { site } : {}) });
