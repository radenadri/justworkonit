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

## Phase 8: Static Deployment ✅

- [x] 8.1 Rewrite src/lib/docs.ts — replace fs/promises with import.meta.glob(?raw)
- [x] 8.2 Rewrite src/hooks/use-docs.ts — replace fetch() with direct module imports
- [x] 8.3 Update vite.config.ts — remove /api proxy
- [x] 8.4 Update package.json — remove dev:server/start, simplify dev to Vite-only
- [x] 8.5 Create src/vite-env.d.ts — TypeScript .md?raw module declarations
- [x] 8.6 Create vercel.json — SPA rewrite rules
- [x] 8.7 Delete src/server/index.ts — remove Bun API server
- [x] 8.8 Verify build passes (600 modules → 44 chunks, 3.47s)

## Phase 9: MDX Migration ✅

- [x] 9.1 Install MDX dependencies (`bun add @mdx-js/rollup @mdx-js/react remark-frontmatter rehype-slug`)
- [x] 9.2 Configure @mdx-js/rollup as Vite plugin (vite.config.ts — mdx() before react())
- [x] 9.3 Update import.meta.glob in src/lib/docs.ts — change from `.md?raw` string imports to `.mdx` component imports
- [x] 9.4 Update src/types.ts — replace `content: string` with `Content: ComponentType`
- [x] 9.5 Update src/hooks/use-docs.ts — return MDX component instead of raw string
- [x] 9.6 Create src/components/mdx-renderer.tsx — MDXProvider wrapper with custom component map
- [x] 9.7 Update src/pages/doc-page.tsx — use `<MdxRenderer Content={doc.Content} />`
- [x] 9.8 Update src/vite-env.d.ts — add `.mdx` module declaration
- [x] 9.9 Rename all 39 docs from .md to .mdx (`docs/**/*.md` → `docs/**/*.mdx`)
- [x] 9.10 Verify MDX pipeline builds and renders existing content correctly

## Phase 10: Code Copy Button ✅

- [x] 10.1 Create src/components/code-block.tsx — `<pre>` wrapper with copy button (monochrome, no border-radius)
- [x] 10.2 Register `pre: CodeBlock` in MDX component map
- [x] 10.3 Verify copy button appears on hover, copies text to clipboard, shows "Copied!" feedback

## Phase 11: Interactive Checkboxes ✅

- [x] 11.1 Create src/hooks/use-checkbox-storage.ts — localStorage read/write hook with key scoping
- [x] 11.2 Create src/components/checkbox-tracker.tsx — interactive checkbox with localStorage persistence
- [x] 11.3 Create src/components/progress-context.tsx — provides docKey + checkbox index counter
- [x] 11.4 Override `li` component in MDX map — detect GFM task list items, render CheckboxTracker
- [x] 11.5 Wrap MdxRenderer with ProgressProvider in doc-page.tsx
- [x] 11.6 Verify checkboxes are clickable, state persists across page refreshes and navigation

## Phase 12: Mermaid Diagrams ✅

- [x] 12.1 Install mermaid (`bun add mermaid`)
- [x] 12.2 Create src/components/mermaid-diagram.tsx — lazy-loaded mermaid renderer with monochrome theme
- [x] 12.3 Create code router in MDX component map — detect `language-mermaid`, route to MermaidDiagram vs normal code
- [x] 12.4 Verify mermaid diagrams render with monochrome colors (black/white/gray only)

## Phase 13: MDX Cleanup & Verification ✅

- [x] 13.1 Remove deprecated dependencies (`bun remove react-markdown rehype-highlight rehype-raw`)
- [x] 13.2 Remove old hljs monochrome theme CSS from index.css (replaced by custom code component)
- [x] 13.3 Delete src/components/markdown-renderer.tsx (replaced by mdx-renderer.tsx)
- [x] 13.4 Update README.md — reflect MDX stack, new features (copy, checkboxes, mermaid)
- [x] 13.5 Create VERCEL.md — static MDX deployment guide
- [x] 13.6 Verify production build passes with all features (3,771 modules → 94 chunks, 17.37s, zero errors)
- [x] 13.7 Visual testing — verify all 4 features work in browser

## Phase 14: JS + DSA Learning Path (Docs) ⏳

> Add new docs collection: `docs/js-dsa/` (beginner JS + data structures & algorithms). One small real-life study case per chapter; exercises are hint-only (no full solutions). All content in Indonesian, written as `.mdx`.

- [x] 14.1 Create skeleton files for `docs/js-dsa/` (00..11)
- [x] 14.2 Write `00-overview.mdx` (course guide + ToC)
- [x] 14.3 Write `01-js-fundamentals-for-dsa.mdx`
- [x] 14.4 Write `02-big-o-and-tradeoffs.mdx`
- [x] 14.5 Write `03-arrays-and-strings.mdx`
- [x] 14.6 Write `04-hash-map-and-set.mdx`
- [x] 14.7 Write `05-stack-and-queue.mdx`
- [x] 14.8 Write `06-recursion-and-backtracking-basics.mdx`
- [x] 14.9 Write `07-sorting-searching-basics.mdx`
- [x] 14.10 Write `08-algorithm-patterns-1.mdx`
- [x] 14.11 Write `09-trees-basics.mdx`
- [x] 14.12 Write `10-graphs-basics.mdx`
- [x] 14.13 Write `11-dp-intro.mdx`
- [x] 14.14 Final pass: consistency + navigation + build verification
- [ ] 14.15 Commit docs (if git is allowed in this environment)

## Phase 15: JS-DSA Refactor (Templates + Mermaid) ⏳

> Refactor `docs/js-dsa/` by adding a central chapter `12-code-templates.mdx` for reusable JS templates, and adding 1 Mermaid visualization + template links in chapters 01..11 (no new `##` headings).

- [x] 15.1 Create `docs/js-dsa/12-code-templates.mdx`
- [x] 15.2 Update `docs/js-dsa/00-overview.mdx` ToC to include chapter 12
- [x] 15.3 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 01
- [x] 15.4 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 02
- [x] 15.5 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 03
- [x] 15.6 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 04
- [x] 15.7 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 05
- [x] 15.8 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 06
- [x] 15.9 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 07
- [x] 15.10 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 08
- [x] 15.11 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 09
- [x] 15.12 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 10
- [x] 15.13 Add `### Template terkait` + `### Visualisasi (Mermaid)` to chapter 11
- [x] 15.14 Final pass: consistency + build verification
- [ ] 15.15 Commit docs (if git is allowed)

---

## How to Run

```bash
# Start Vite dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```
