# Tasks: Documentation Viewer

> Status tracking for justworkonit docs viewer implementation

---

## Phase 1: Foundation ✅

- [x] 1.1 Install Tailwind CSS v4 + @tailwindcss/vite + @tailwindcss/typography
- [x] 1.2 Add Vite + @vitejs/plugin-react as build tool (vite.config.ts)
- [x] 1.3 Configure Minimalist Monochrome design tokens in index.css (@theme)
- [x] 1.4 Add Google Fonts (Playfair Display, Source Serif 4, JetBrains Mono)
- [x] 1.5 Create lib/utils.ts (cn() helper with clsx + tailwind-merge)
- [x] 1.6 Create root index.html for Vite
- [x] 1.7 Create src/main.tsx (React 19 entry with BrowserRouter)
- [x] 1.8 Install runtime deps (react-router-dom, react-markdown, remark-gfm, rehype-*)
- [x] 1.9 Install utility deps (clsx, tailwind-merge, class-variance-authority, lucide-react)
- [x] 1.10 Update package.json scripts (dev, dev:server, dev:client, build)

## Phase 2: Server API ✅

- [x] 2.1 Create shared types (src/types.ts — DocMeta, Collection, DocContent)
- [x] 2.2 Implement docs scanner (src/lib/docs.ts — getCollections, getDoc)
- [x] 2.3 Create Bun server (src/server/index.ts — GET /api/docs, /api/docs/:collection/:slug)
- [x] 2.4 Configure Vite proxy (/api → localhost:3000)
- [x] 2.5 Test API endpoints (verified working)

## Phase 3: Core UI ✅

- [x] 3.1 Set up React Router in App.tsx (Routes: /, /:collection/:slug)
- [x] 3.2 Create DocsLayout (header + sidebar + outlet + mobile nav)
- [x] 3.3 Create Header component (logo, nav links, Minimalist Monochrome style)
- [x] 3.4 Create Sidebar with collapsible collection sections + active state
- [x] 3.5 Create MobileNav (drawer overlay with keyboard dismiss)

## Phase 4: Content Rendering ✅

- [x] 4.1 Create MarkdownRenderer (react-markdown + remark-gfm + rehype-highlight/raw/slug)
- [x] 4.2 Create useCollections hook (fetch /api/docs)
- [x] 4.3 Create useDoc hook (fetch /api/docs/:collection/:slug)
- [x] 4.4 Style prose typography in CSS (tables, code blocks, blockquotes, headings)

## Phase 5: Pages ✅

- [x] 5.1 Create HomePage with hero + collection cards (inverted hover)
- [x] 5.2 Create DocPage with breadcrumb + content + prev/next navigation
- [x] 5.3 Create TableOfContents with scroll-spy (IntersectionObserver)
- [x] 5.4 Add loading skeletons and error states

## Phase 6: Polish ✅

- [x] 6.1 Clean up old demo files (APITester, frontend.tsx, logo.svg, react.svg)
- [x] 6.2 Fix CSS import ordering (fonts before tailwind)
- [x] 6.3 Fix DOCS_DIR path resolution (src/lib → project root)
- [x] 6.4 Verify Vite build passes
- [x] 6.5 Verify server API endpoints respond correctly
- [x] 6.6 Visual testing — API + build verified (4 collections, 39 docs, build 2.07s)
- [x] 6.7 Add highlight.js monochrome theme (grayscale-only hljs tokens in index.css)
- [x] 6.8 Add keyboard navigation (←/→ via src/hooks/use-keyboard-nav.ts)
- [x] 6.9 Update README.md with project description, architecture, and usage

## Phase 7: Typography Update ✅

- [x] 7.1 Update prompt.xml — Google Sans Bold (headings), Google Sans Regular (body), keep JetBrains Mono (code)
- [x] 7.2 Update src/index.css — `--font-heading` and `--font-body` to Google Sans with system fallbacks
- [x] 7.3 Replace `font-serif` → `font-heading` in all TSX components (header, sidebar, home, doc-page, mobile-nav)
- [x] 7.4 Update PLAN.md — fonts section and fontFamily tokens

---

## How to Run

```bash
# Start both server + Vite dev in parallel
bun run dev

# Or run separately:
bun run dev:server   # API server on :3000
bun run dev:client   # Vite on :5173

# Build for production
bun run build
```
