import { defineConfig } from 'astro/config';

// Set SITE_URL to the final public domain in Vercel (e.g. https://your-domain).
// Vercel's production hostname is an automatic fallback; no invented canonical URL.
const site = process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
export default defineConfig({ output: 'static', trailingSlash: 'ignore', ...(site ? { site } : {}) });
