# Cristiano Pinto – Portfolio

Personal portfolio site: backend developer, selected projects (ML, game dev, Minecraft mods, tooling), and contact.

**Stack:** [Astro](https://astro.build), vanilla CSS, Three.js (background), Swup (page transitions).

## Commands

| Command           | Action                                      |
| -----------------| ------------------------------------------- |
| `npm install`    | Install dependencies                         |
| `npm run dev`    | Start dev server at `http://localhost:4321` |
| `npm run build`  | Build for production to `./dist/`            |
| `npm run preview`| Preview the production build locally         |

## Project structure

- `src/pages/` – Home (`index.astro`), projects list, and project detail pages
- `src/layout/Layout.astro` – Shared layout, meta, and Swup wrapper
- `src/style.css` – Global styles
- `src/main.js` – Three.js scene and canvas background
- `public/` – Static assets (images, PDF resume, favicon)

## Deploy

Build with `npm run build`, then deploy the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages, etc.).
