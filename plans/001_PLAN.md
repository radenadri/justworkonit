# Implementation Plan: Documentation Viewer

> A markdown documentation viewer for the justworkonit workspace

---

## 1. Overview

Build a docs-style web app (similar to Docusaurus/GitBook) that renders all markdown files from `docs/` grouped by collection, with sidebar navigation, in-page table of contents, and the Minimalist Monochrome design system.

### Architecture

```
Browser Request → Bun.serve() → API routes serve markdown JSON
                              → SPA fallback serves index.html
                              → React Router handles client routing
                              → react-markdown renders content
```

### Data Flow

```
docs/*.md (disk)
  ↓ Bun reads at startup + watches for changes
API /api/docs → collection index (names, slugs, page counts)
API /api/docs/:collection → page list for collection
API /api/docs/:collection/:slug → single page markdown content + metadata
  ↓ fetch() from React
  ↓ react-markdown + rehype-highlight renders HTML
  ↓ Displayed in Article/Prose layout
```

---

## 2. URL Routing Scheme

| URL Pattern | View | Description |
|---|---|---|
| `/` | Home | Grid of collections with page counts |
| `/:collection` | Collection | Redirects to first page in collection |
| `/:collection/:slug` | Page | Full markdown page with sidebar + TOC |

### Collection Slugs

| Directory | Slug | Display Name |
|---|---|---|
| `blind75/` | `blind75` | Blind 75 |
| `focus-wp/` | `focus-wp` | Focus WordPress |
| `furnicraft-odoo/` | `furnicraft-odoo` | Furnicraft Odoo |
| `furnicraft-woo/` | `furnicraft-woo` | Furnicraft WooCommerce |

### Page Slugs

Derived from filename:
- `00-overview.md` → `00-overview`
- `01 Contains Duplicate.md` → `01-contains-duplicate`

---

## 3. Dependencies

### Production

| Package | Purpose |
|---|---|
| `react-router-dom` | Client-side routing |
| `react-markdown` | Markdown → React rendering |
| `remark-gfm` | GitHub Flavored Markdown (tables, strikethrough) |
| `rehype-highlight` | Syntax highlighting for code blocks |
| `rehype-slug` | Add IDs to headings (for TOC anchoring) |

### Development

| Package | Purpose |
|---|---|
| `tailwindcss` | Utility CSS framework |
| `@tailwindcss/typography` | Prose styling for rendered markdown |
| `postcss` | CSS processing |
| `autoprefixer` | Vendor prefixes |

### shadcn/ui Components

Install after Tailwind setup:

| Component | Purpose |
|---|---|
| `button` | Navigation, actions |
| `scroll-area` | Sidebar scrolling |
| `sheet` | Mobile sidebar drawer |
| `separator` | Visual dividers |
| `skeleton` | Loading states |
| `badge` | Collection labels, page counts |
| `input` | Search (future) |
| `collapsible` | Sidebar section collapse |

### Fonts

- Google Sans Bold (headings)
- Google Sans Regular (body)
- JetBrains Mono (code) — via Google Fonts CDN

---

## 4. File Structure

```
justworkonit/
├── docs/                          # UNCHANGED — source markdown files
├── src/
│   ├── index.ts                   # Bun server — extended with docs API
│   ├── index.html                 # SPA shell — updated with fonts + Tailwind
│   ├── index.css                  # Global styles — rewritten for Minimalist Monochrome
│   ├── frontend.tsx               # React DOM entry — keep HMR logic
│   ├── App.tsx                    # Root — React Router setup
│   ├── lib/
│   │   └── utils.ts               # cn() utility + helpers
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── badge.tsx
│   │   │   └── collapsible.tsx
│   │   ├── layout/
│   │   │   ├── root-layout.tsx    # App shell — header + sidebar + content
│   │   │   ├── header.tsx         # Top bar — logo/title + mobile menu trigger
│   │   │   ├── sidebar.tsx        # Desktop sidebar — collection nav
│   │   │   └── mobile-nav.tsx     # Mobile Sheet sidebar
│   │   ├── docs/
│   │   │   ├── doc-content.tsx    # Markdown renderer wrapper
│   │   │   ├── table-of-contents.tsx  # Right-side TOC from headings
│   │   │   ├── page-navigation.tsx    # Prev/Next page links
│   │   │   └── collection-card.tsx    # Home page collection card
│   │   └── markdown/
│   │       └── markdown-renderer.tsx  # react-markdown config + custom components
│   ├── hooks/
│   │   ├── use-docs.ts            # Fetch collection index
│   │   ├── use-doc-page.ts        # Fetch single page content
│   │   └── use-toc.ts             # Extract TOC from markdown headings
│   ├── pages/
│   │   ├── home.tsx               # Landing — collection grid
│   │   └── doc-page.tsx           # Document view — sidebar + content + TOC
│   └── types/
│       └── docs.ts                # TypeScript interfaces
├── tailwind.config.ts             # Tailwind config — Minimalist Monochrome tokens
├── postcss.config.js              # PostCSS with Tailwind + autoprefixer
├── components.json                # shadcn/ui config
├── prompt.xml                     # UNCHANGED — design reference
├── package.json                   # Updated with new deps
└── tsconfig.json                  # UNCHANGED
```

---

## 5. Component Breakdown

### Layout Components

#### `root-layout.tsx`
- App shell with header, sidebar (desktop), and main content area
- Responsive: sidebar visible on `lg:` breakpoint, hidden on mobile
- Props: `children`

#### `header.tsx`
- Fixed top bar with:
  - App title/logo (left) — "JustWorkOnIt" in Playfair Display
  - Mobile menu button (right, visible on `< lg`)
- Style: border-bottom-2 black, white bg

#### `sidebar.tsx`
- Left sidebar (fixed width 280px on desktop)
- Lists all collections as collapsible sections
- Each collection shows its pages as links
- Active page highlighted with black bg, white text (inverted)
- Wrapped in ScrollArea

#### `mobile-nav.tsx`
- Sheet component that slides from left
- Contains same sidebar content
- Triggered by hamburger button in header

### Content Components

#### `doc-content.tsx`
- Wraps markdown-renderer with proper layout
- Handles loading (Skeleton) and error states
- Applies Article/Prose-like styling

#### `markdown-renderer.tsx`
- Configures react-markdown with:
  - remark-gfm (tables, strikethrough)
  - rehype-highlight (code syntax)
  - rehype-slug (heading IDs)
- Custom component overrides matching Minimalist Monochrome:
  - `h1-h6`: Playfair Display, tracking-tight
  - `code/pre`: JetBrains Mono, border-2 black, bg muted
  - `table`: border-2, black header bg
  - `blockquote`: border-left-4 black
  - `a`: underline, black
  - `hr`: h-1 bg-foreground

#### `table-of-contents.tsx`
- Right sidebar (hidden on `< xl`)
- Extracted from markdown headings (h2, h3)
- Scroll-spy to highlight current section
- Click to smooth-scroll to heading

#### `page-navigation.tsx`
- Bottom of page: Previous / Next page links
- Shows page title, not just arrows
- Style: border-2 cards, hover inversion

#### `collection-card.tsx`
- Home page card for each collection
- Shows: collection name, description, page count (Badge)
- Style: border-2 black, hover bg-foreground/text-background inversion
- Links to first page of collection

### Page Components

#### `home.tsx`
- Hero section: oversized title "Documentation" in 6xl-8xl Playfair Display
- Subtitle: "Learning guides & project references"
- Grid of collection cards (1 col mobile, 2 cols desktop)

#### `doc-page.tsx`
- Three-column layout: sidebar | content | TOC
- Fetches page content via use-doc-page hook
- Passes markdown to doc-content
- Shows page-navigation at bottom

---

## 6. Server API Design

### Extend `src/index.ts` with these routes:

#### `GET /api/docs`
Returns all collections with their pages:
```json
{
  "collections": [
    {
      "slug": "blind75",
      "name": "Blind 75",
      "description": "LeetCode algorithm solutions",
      "pageCount": 5,
      "pages": [
        { "slug": "01-contains-duplicate", "title": "Contains Duplicate", "order": 1 },
        { "slug": "02-valid-anagram", "title": "Valid Anagram", "order": 2 }
      ]
    }
  ]
}
```

#### `GET /api/docs/:collection/:slug`
Returns single page content:
```json
{
  "collection": "blind75",
  "slug": "01-contains-duplicate",
  "title": "Contains Duplicate",
  "content": "# Contains Duplicate\n\n...(raw markdown)...",
  "prev": null,
  "next": { "slug": "02-valid-anagram", "title": "Valid Anagram" }
}
```

### File Scanning Logic

On server start:
1. Read `docs/` directory — list subdirectories as collections
2. For each collection, read its `.md` files
3. Parse filename → slug + title + order
4. Cache the index in memory (re-scan on file change in dev)

Filename parsing rules:
- `00-overview.md` → slug: `00-overview`, title: `Overview`, order: 0
- `01 Contains Duplicate.md` → slug: `01-contains-duplicate`, title: `Contains Duplicate`, order: 1
- Strip leading numbers and separators for display title
- Lowercase + hyphenate for slugs

---

## 7. Implementation Steps

### Phase 1: Foundation (Setup)

| # | Task | Depends On | Files |
|---|---|---|---|
| 1.1 | Install Tailwind CSS + PostCSS + autoprefixer | — | package.json, postcss.config.js, tailwind.config.ts |
| 1.2 | Configure Tailwind with Minimalist Monochrome tokens | 1.1 | tailwind.config.ts, src/index.css |
| 1.3 | Update index.html with Google Fonts (Playfair, Source Serif 4, JetBrains Mono) | — | src/index.html |
| 1.4 | Initialize shadcn/ui (create components.json, lib/utils.ts) | 1.1 | components.json, src/lib/utils.ts |
| 1.5 | Install shadcn components (button, scroll-area, sheet, separator, skeleton, badge, collapsible) | 1.4 | src/components/ui/* |
| 1.6 | Install react-router-dom, react-markdown, remark-gfm, rehype-highlight, rehype-slug | — | package.json |

### Phase 2: Server API

| # | Task | Depends On | Files |
|---|---|---|---|
| 2.1 | Create TypeScript interfaces for docs API | — | src/types/docs.ts |
| 2.2 | Implement docs scanner (read docs/ dir, parse filenames, build index) | 2.1 | src/index.ts |
| 2.3 | Add GET /api/docs endpoint (collection index) | 2.2 | src/index.ts |
| 2.4 | Add GET /api/docs/:collection/:slug endpoint (page content) | 2.2 | src/index.ts |

### Phase 3: Core UI

| # | Task | Depends On | Files |
|---|---|---|---|
| 3.1 | Set up React Router in App.tsx (routes: /, /:collection/:slug) | 1.6 | src/App.tsx |
| 3.2 | Create root-layout with header + sidebar slot + content area | 1.5 | src/components/layout/root-layout.tsx |
| 3.3 | Create header component | 1.5 | src/components/layout/header.tsx |
| 3.4 | Create sidebar with collapsible collection sections | 1.5, 2.3 | src/components/layout/sidebar.tsx |
| 3.5 | Create mobile-nav (Sheet wrapper around sidebar) | 3.4 | src/components/layout/mobile-nav.tsx |

### Phase 4: Content Rendering

| # | Task | Depends On | Files |
|---|---|---|---|
| 4.1 | Create markdown-renderer with custom components + plugins | 1.6 | src/components/markdown/markdown-renderer.tsx |
| 4.2 | Create use-docs hook (fetch /api/docs) | 2.3 | src/hooks/use-docs.ts |
| 4.3 | Create use-doc-page hook (fetch /api/docs/:collection/:slug) | 2.4 | src/hooks/use-doc-page.ts |
| 4.4 | Create use-toc hook (extract headings from markdown) | — | src/hooks/use-toc.ts |
| 4.5 | Create doc-content component (loading + error + rendered markdown) | 4.1, 4.3 | src/components/docs/doc-content.tsx |

### Phase 5: Pages

| # | Task | Depends On | Files |
|---|---|---|---|
| 5.1 | Create home page with collection grid | 4.2 | src/pages/home.tsx |
| 5.2 | Create collection-card component | 1.5 | src/components/docs/collection-card.tsx |
| 5.3 | Create doc-page with three-column layout | 3.2, 4.5, 4.4 | src/pages/doc-page.tsx |
| 5.4 | Create table-of-contents component | 4.4 | src/components/docs/table-of-contents.tsx |
| 5.5 | Create page-navigation (prev/next) | 4.3 | src/components/docs/page-navigation.tsx |

### Phase 6: Polish

| # | Task | Depends On | Files |
|---|---|---|---|
| 6.1 | Add syntax highlighting theme (monochrome — black/white/gray) | 4.1 | src/index.css |
| 6.2 | Style code blocks with JetBrains Mono + Minimalist Monochrome borders | 6.1 | markdown-renderer.tsx |
| 6.3 | Add scroll-spy to table-of-contents | 5.4 | table-of-contents.tsx |
| 6.4 | Add keyboard navigation (arrow keys for prev/next page) | 5.5 | doc-page.tsx |
| 6.5 | Clean up old demo files (APITester, logos) | 5.3 | src/ |
| 6.6 | Update README.md | 6.5 | README.md |

---

## 8. Mobile Responsiveness

| Breakpoint | Layout |
|---|---|
| `< lg` (mobile/tablet) | Header + hamburger → Sheet sidebar. Full-width content. No TOC. |
| `lg` - `xl` (laptop) | Fixed sidebar (280px) + content. No TOC. |
| `> xl` (desktop) | Fixed sidebar (280px) + content + TOC (200px). |

### Mobile-specific:
- Sidebar becomes Sheet (slide from left)
- TOC hidden entirely (or collapsible at top of content)
- Page navigation spans full width
- Typography scales down (hero: 4xl instead of 8xl)

---

## 9. Design System Application

### Tailwind Config Tokens

```
colors:
  background: #FFFFFF
  foreground: #000000
  muted: #F5F5F5
  muted-foreground: #525252
  border: #E5E5E5

fontFamily:
  heading: Google Sans, Segoe UI, Roboto, sans-serif (Bold weight)
  body: Google Sans, Segoe UI, Roboto, sans-serif (Regular weight)
  mono: JetBrains Mono, monospace

borderRadius:
  DEFAULT: 0px (all values)
```

### Key Style Rules
- All components: `rounded-none`
- Sidebar active item: `bg-foreground text-background` (inverted)
- Collection cards: `border-2 border-foreground` + hover inversion
- Code blocks: `border-2 border-foreground bg-muted font-mono`
- Page nav buttons: `border-2` + `hover:bg-foreground hover:text-background`
- No shadows anywhere
- Transitions: `duration-100` maximum

---

## 10. Out of Scope (Future)

- Full-text search across docs
- Dark mode toggle
- Markdown editing
- PDF export
- Multi-language support
