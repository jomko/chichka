# CHICHKA — editorial portfolio

Astro static portfolio for **Marichka Chichkova**, independent Ukrainian artist and cultural manager. English default, full Ukrainian alternative.

## Run locally

```bash
npm install
npm run dev
npm run build
```

Deploy with Vercel's Astro preset or any static host: build command `npm run build`, output `dist`.

## Routes

- EN: `/`, `/projects/`, `/projects/:slug/`, `/about/`, `/contact/`
- UA: `/uk/`, `/uk/projects/`, `/uk/projects/:slug/`, `/uk/about/`, `/uk/contact/`

## Editing content

Projects are in `src/data/projects.js`. One data entry creates two localized project pages. Update descriptions, roles, dates, links and images there. CSS is in `src/styles/global.css`.

## Photographs

Existing six archive photos remain at the repository root and are referenced directly in this first migration. **Before production**, move them into `public/` (or into the Astro image pipeline) and verify each photograph belongs to its assigned project, crop and photo credit. Photo assignments at this stage are **editorial placeholders**: the images were not visually reviewed, so do not imply they document a particular project.

## Editorial status

Texts are based on Marichka's 2019–2025 CVs and public material. Copy is provisional; verify roles, time ranges (including NGO founding date), authorship, original artist credits, project photos and external links with Marichka. No unverified claims about ticket sales, prizes, visitor numbers, partners or funders.

## Migration notes

The previous single-page HTML prototype was replaced by Astro source. A copy is retained as `legacy/index.html` for reference. No CMS or heavy client-side JS.
