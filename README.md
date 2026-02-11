# justworkonit

A minimalist documentation viewer for browsing markdown-based learning guides. Built with Bun + React 19 + Vite.

## Overview

Personal docs site that renders 39 markdown files grouped into 4 collections:

| Collection | Topic | Docs |
|------------|-------|------|
| **blind75** | LeetCode Blind 75 solutions | 5 |
| **focus-wp** | Focus WordPress setup guides | 8 |
| **furnicraft-odoo** | Furnicraft Odoo 16 CE implementation | 14 |
| **furnicraft-woo** | Furnicraft WooCommerce setup | 11 |

## Quick Start

```bash
# Install dependencies
bun install

# Start dev server (API + Vite)
bun run dev

# Build for production
bun run build
```

Dev runs two processes in parallel:
- **Bun API server** at `http://localhost:3000` — reads `docs/*.md` files
- **Vite dev server** at `http://localhost:5173` — proxies `/api/*` to Bun

## Architecture

```
justworkonit/
├── docs/                        # Markdown source files (39 files)
│   ├── blind75-*.md
│   ├── focus-wp-*.md
│   ├── furnicraft-odoo-*.md
│   └── furnicraft-woo-*.md
├── src/
│   ├── server/index.ts          # Bun.serve() API — /api/docs, /api/docs/:collection/:slug
│   ├── pages/
│   │   ├── home.tsx             # Collection cards grid
│   │   └── doc-page.tsx         # Markdown viewer with breadcrumbs + prev/next
│   ├── components/
│   │   ├── markdown-renderer.tsx    # react-markdown + GFM + syntax highlighting
│   │   ├── table-of-contents.tsx    # Scroll-spy heading nav
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── sidebar.tsx          # Collapsible collection navigation
│   │       ├── mobile-nav.tsx       # Drawer for mobile
│   │       └── docs-layout.tsx      # Three-column shell
│   ├── hooks/
│   │   ├── use-docs.ts             # useCollections, useDoc data hooks
│   │   └── use-keyboard-nav.ts     # ←/→ arrow key page navigation
│   ├── lib/
│   │   ├── docs.ts                 # Server-side docs reader (fs)
│   │   └── utils.ts                # cn() utility
│   ├── types.ts                    # DocMeta, Collection, DocContent
│   ├── App.tsx                     # Router: / and /:collection/:slug
│   ├── main.tsx                    # React 19 entry
│   └── index.css                   # Tailwind v4 + monochrome design tokens
├── index.html                   # Vite entry
├── vite.config.ts               # Vite + React + /api proxy
├── prompt.xml                   # Design system spec (Minimalist Monochrome)
├── PLAN.md                      # Implementation plan
└── TASKS.md                     # Task tracking
```

## Design

**Minimalist Monochrome** — strictly black, white, and grays. No colors, no border-radius, no shadows.

- **Headings**: Google Sans Bold
- **Body**: Google Sans Regular
- **Code**: JetBrains Mono

See `prompt.xml` for the full design specification.

## API Endpoints

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/docs` | All collections with doc metadata |
| GET | `/api/docs/:collection/:slug` | Single doc content + frontmatter |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` | Previous doc in collection |
| `→` | Next doc in collection |

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: React 19 + React Router 7
- **Build**: Vite 7
- **Styling**: Tailwind CSS v4
- **Markdown**: react-markdown + remark-gfm + rehype-highlight
