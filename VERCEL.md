# Deploying to Vercel

## Prerequisites

- A [Vercel](https://vercel.com) account
- [Vercel CLI](https://vercel.com/docs/cli) installed (optional)

## Option 1: Git Integration (Recommended)

1. Push your repo to GitHub/GitLab/Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure build settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `bun run build` |
| Output Directory | `dist` |
| Install Command | `bun install` |

5. Click **Deploy**

Vercel auto-deploys on every push to `main`.

## Option 2: Vercel CLI

```bash
# Install CLI
bun add -g vercel

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

## SPA Routing

The included `vercel.json` handles client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

All routes (e.g., `/furnicraft-odoo/01-overview`) are rewritten to `index.html` where React Router handles them.

## Architecture

This is a **pure static site** — no server, no API, no SSR.

```
MDX files (docs/*.mdx)
  → Compiled to React components at build time by @mdx-js/rollup
  → Bundled into JS chunks by Vite
  → Served as static files from dist/
```

Build output: `dist/` directory with HTML + JS + CSS. No runtime dependencies.

## Environment Variables

None required. Everything is bundled at build time.

## Alternative Hosts

The same `dist/` output works on any static host:

**Netlify**: Add `_redirects` file:
```
/* /index.html 200
```

**GitHub Pages**: Use a `404.html` that redirects to `index.html`.

**Cloudflare Pages**: Set build command to `bun run build`, output to `dist`.
