# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-11

## OVERVIEW

Bun + React 19 development workspace combining a fullstack SPA scaffold with multi-project documentation and an AI design system prompt (prompt.xml).

## STRUCTURE

```
justworkonit/
├── src/              # Bun server + React 19 SPA (fullstack)
│   ├── index.ts      # Bun.serve() entry — route-based API + SPA fallback
│   ├── frontend.tsx   # React DOM hydration w/ HMR persistence
│   ├── App.tsx        # Root component
│   ├── APITester.tsx  # Interactive API testing widget
│   ├── index.html     # SPA shell
│   └── index.css      # Dark theme, Bun branding, animated watermark
├── docs/             # Multi-project documentation collections
│   ├── furnicraft-odoo/   # Odoo 16 CE ERP implementation (15 files)
│   ├── furnicraft-woo/    # WordPress + WooCommerce e-commerce (11 files)
│   ├── focus-wp/          # Headless WordPress CMS setup (8 files)
│   └── blind75/           # LeetCode algorithm solutions (5 files)
├── prompt.xml        # AI system prompt — Minimalist Monochrome design system
├── bunfig.toml       # Bun config — BUN_PUBLIC_* env exposure
└── package.json      # bun-react-template v0.1.0
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API routes | `src/index.ts` | Route-based handler pattern in `Bun.serve()` |
| Modify React UI | `src/App.tsx` | Default export, imports APITester |
| Change theming/styles | `src/index.css` | Dark theme, animated logo watermark |
| Add React entry logic | `src/frontend.tsx` | HMR data persistence pattern |
| Find design system rules | `prompt.xml` | Minimalist Monochrome — Next.js 16 target |
| Project documentation | `docs/` | See `docs/AGENTS.md` for details |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `Bun.serve()` | Server | `src/index.ts` | Fullstack entry point — routes + static |
| `App` | Component | `src/App.tsx` | Root React component (default export) |
| `APITester` | Component | `src/APITester.tsx` | Named export — interactive fetch UI |
| `hydrateRoot` | Entry | `src/frontend.tsx` | Client-side mount with HMR |

## CONVENTIONS

- **Runtime**: Bun exclusively — no Node.js, no npm
- **Module format**: ESM (`"type": "module"`)
- **Path aliases**: `@/*` → `./src/*` (tsconfig)
- **TypeScript**: Strict mode, `noUncheckedIndexedAccess`, `noImplicitOverride`
- **React**: JSX transform via `react-jsx` (no manual imports)
- **HMR**: `import.meta.hot` for dev hot reload — preserves React root across reloads
- **Env vars**: Only `BUN_PUBLIC_*` prefixed vars exposed to client (bunfig.toml)

## ANTI-PATTERNS (THIS PROJECT)

- **DO NOT** use `npm`, `yarn`, or `pnpm` — Bun only
- **DO NOT** add `react` imports in JSX files — automatic JSX transform handles it
- **DO NOT** add border-radius, shadows, or accent colors — violates Minimalist Monochrome (prompt.xml)
- **DO NOT** confuse prompt.xml target (Next.js 16 + shadcn) with current src/ stack (Bun + React SPA) — they are separate concerns

## UNIQUE STYLES

### prompt.xml Design System (Minimalist Monochrome)
Applies to Next.js projects built with this workspace's AI prompt:
- Colors: `#FFFFFF` bg, `#000000` fg, `#F5F5F5` muted, `#E5E5E5` border
- Typography: Playfair Display (display), Source Serif 4 (body), JetBrains Mono (code)
- All corners: sharp 90° — `rounded-none` everywhere
- Animations: ≤100ms transitions, instant preferred
- Borders: hairline (1px gray) to ultra (8px black)
- Buttons: uppercase, `tracking-widest`, no rounded corners
- Inputs: bottom-border only

### src/ SPA Theme
- Dark background: `#242424`
- Bun brand accent: `#fbf0df`
- Inter font family
- 30s animated background watermark (Bun logo)

## COMMANDS

```bash
bun install          # Install dependencies
bun dev              # Dev server with HMR (--hot)
bun start            # Production server (NODE_ENV=production)
bun build ./src/index.html --outdir=dist --sourcemap --target=browser --minify  # Build for browser
```

## NOTES

- `prompt.xml` defines an AI persona for a **different** stack (Next.js 16 + shadcn/ui + Tailwind). The current `src/` is a basic Bun + React scaffold. These coexist intentionally — prompt.xml is a design system reference, not config for this app.
- The `docs/` directory contains documentation for **external projects** (Furnicraft ERP, Furnicraft e-commerce, Focus reading platform, algorithm practice). See `docs/AGENTS.md`.
- Package name is still the template default (`bun-react-template`). Rename if shipping.
