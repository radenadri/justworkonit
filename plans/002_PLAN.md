# MDX Migration Plan

> Migrate justworkonit from plain Markdown to MDX with interactive features.

---

## Overview

| # | Feature | Solution | New Dependencies |
|---|---------|----------|-----------------|
| 1 | MDX format support | `@mdx-js/rollup` Vite plugin | `@mdx-js/rollup`, `@mdx-js/react` |
| 2 | Interactive checkboxes | Custom MDX component + localStorage | — |
| 3 | Mermaid diagrams | Custom code block + lazy `mermaid` | `mermaid` |
| 4 | Code copy button | Custom `pre` component + Clipboard API | — |

**Total new dependencies**: 3 (`@mdx-js/rollup`, `@mdx-js/react`, `mermaid`)

---

## Phase 1: MDX Pipeline

### 1.1 Install dependencies

```bash
bun add @mdx-js/rollup @mdx-js/react remark-gfm remark-frontmatter rehype-slug
```

Note: `remark-gfm` is already installed (used by react-markdown). `rehype-highlight` will be replaced by a custom code component in Phase 2/4.

### 1.2 Configure Vite plugin

**Update `vite.config.ts`**:

```typescript
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    }),
    react(), // react() MUST come after mdx()
    tailwindcss(),
  ],
  // ...
});
```

### 1.3 Update import.meta.glob

**Update `src/lib/docs.ts`**:

```typescript
// Before: raw string imports
const markdownModules = import.meta.glob<string>("/docs/**/*.md", {
  query: "?raw", import: "default"
});

// After: compiled MDX component imports
const mdxModules = import.meta.glob<{ default: React.ComponentType }>("/docs/**/*.mdx");
```

Key difference:
- `.md?raw` → returns raw string → fed to `<ReactMarkdown>`
- `.mdx` → returns `{ default: MDXComponent }` → rendered as `<MDXComponent />`
- `getCollections()` stays synchronous (reads `Object.keys()`)
- `getDoc()` returns the lazy module loader function instead of raw content

### 1.4 Update types

**Update `src/types.ts`**:

```typescript
import type { ComponentType } from "react";

export interface DocContent extends DocMeta {
  Content: ComponentType; // MDX compiled component (replaces `content: string`)
}
```

### 1.5 Update hooks

**Update `src/hooks/use-docs.ts`**:

`useDoc()` now calls the glob loader, gets the default export (MDX component), and returns it as `Content`.

### 1.6 Replace MarkdownRenderer with MDX rendering

**Update `src/components/markdown-renderer.tsx`** → rename to `mdx-renderer.tsx`:

```tsx
import { MDXProvider } from "@mdx-js/react";
// Custom components for checkboxes, code blocks, mermaid (Phases 2-4)

export function MdxRenderer({ Content }: { Content: ComponentType }) {
  return (
    <MDXProvider components={mdxComponents}>
      <article className="prose prose-lg max-w-none">
        <Content />
      </article>
    </MDXProvider>
  );
}
```

### 1.7 Rename all docs from .md to .mdx

```bash
cd docs
find . -name "*.md" -exec bash -c 'mv "$1" "${1%.md}.mdx"' _ {} \;
```

39 files renamed. Content unchanged — plain markdown is valid MDX.

### 1.8 Update doc-page.tsx

Replace `<MarkdownRenderer content={doc.content} />` with `<MdxRenderer Content={doc.Content} />`.

### 1.9 Update vite-env.d.ts

```typescript
declare module '*.mdx' {
  import type { ComponentType } from 'react';
  const component: ComponentType;
  export default component;
}
```

---

## Phase 2: Code Copy Button

### 2.1 Create CodeBlock component

**New file: `src/components/code-block.tsx`**

```tsx
import { useState, useRef } from "react";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
}

export function CodeBlock({ children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 border border-neutral-300 bg-white px-2 py-1
                   font-mono text-xs opacity-0 transition-opacity group-hover:opacity-100
                   hover:bg-neutral-100"
        aria-label="Copy code"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
```

### 2.2 Register as MDX component

```typescript
const mdxComponents = {
  pre: CodeBlock,
  // ... other overrides
};
```

Design: Monochrome button, no border-radius, appears on hover, black text on white bg.

---

## Phase 3: Interactive Checkboxes with localStorage

### 3.1 Create CheckboxTracker component

**New file: `src/components/checkbox-tracker.tsx`**

```tsx
import { useCallback } from "react";
import { useCheckboxStorage } from "@/hooks/use-checkbox-storage";

interface CheckboxTrackerProps {
  checked?: boolean;
  children?: React.ReactNode;
  // index injected by MDX component override
  index: number;
  docKey: string; // "collection/slug"
}

export function CheckboxTracker({ checked: defaultChecked, children, index, docKey }: CheckboxTrackerProps) {
  const storageKey = `checkbox:${docKey}:${index}`;
  const [isChecked, setChecked] = useCheckboxStorage(storageKey, defaultChecked ?? false);

  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => setChecked(!isChecked)}
        className="mt-1.5 h-4 w-4 cursor-pointer accent-black"
      />
      <span className={isChecked ? "line-through opacity-60" : ""}>
        {children}
      </span>
    </label>
  );
}
```

### 3.2 Create useCheckboxStorage hook

**New file: `src/hooks/use-checkbox-storage.ts`**

```typescript
import { useState, useCallback } from "react";

export function useCheckboxStorage(key: string, defaultValue: boolean): [boolean, (val: boolean) => void] {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setAndPersist = useCallback((newValue: boolean) => {
    setValue(newValue);
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch {
      // localStorage full or unavailable — silent fail
    }
  }, [key]);

  return [value, setAndPersist];
}
```

### 3.3 Register as MDX component override

The tricky part: MDX renders `- [x] item` as `<li><input type="checkbox" checked disabled /> item</li>`. We need to intercept the `input` element inside `li` and replace with `CheckboxTracker`.

Strategy: Override the `li` component. If it contains a checkbox input as first child, wrap with `CheckboxTracker`. Use a React context to pass the `docKey` (collection/slug) and track checkbox index via a counter ref.

```typescript
// In MDX component overrides
const mdxComponents = {
  li: ({ children, ...props }) => {
    // Detect GFM task list items
    // If first child is input[type=checkbox], render CheckboxTracker
    // Otherwise render normal <li>
  },
};
```

### 3.4 Progress context

**New file: `src/components/progress-context.tsx`**

Provides `docKey` to all checkbox components and tracks checkbox index counter:

```tsx
const ProgressContext = createContext<{ docKey: string; getNextIndex: () => number }>(...);
```

Wrap `<MdxRenderer>` with this provider in `doc-page.tsx`.

---

## Phase 4: Mermaid Diagram Rendering

### 4.1 Install mermaid

```bash
bun add mermaid
```

### 4.2 Create MermaidDiagram component

**New file: `src/components/mermaid-diagram.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";

// Lazy-load mermaid to avoid 1MB in initial bundle
let mermaidPromise: Promise<typeof import("mermaid")> | null = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(m => {
      m.default.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          // Monochrome theme
          primaryColor: "#ffffff",
          primaryBorderColor: "#000000",
          primaryTextColor: "#000000",
          lineColor: "#000000",
          secondaryColor: "#f5f5f5",
          tertiaryColor: "#e5e5e5",
          noteBkgColor: "#f5f5f5",
          noteTextColor: "#000000",
          noteBorderColor: "#000000",
          fontFamily: '"Google Sans", "Segoe UI", Roboto, sans-serif',
        },
      });
      return m;
    });
  }
  return mermaidPromise;
}

export function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMermaid().then(async (m) => {
      if (cancelled) return;
      try {
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await m.default.render(id, code);
        if (!cancelled) setSvg(svg);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Mermaid render error");
      }
    });
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <pre className="border border-red-300 bg-red-50 p-4 text-sm">
        <code>Mermaid error: {error}</code>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-6 flex justify-center border border-neutral-200 bg-white p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
```

### 4.3 Integrate into code block routing

Update `CodeBlock` component to detect `language-mermaid` class and route to `MermaidDiagram`:

```tsx
// In the code component override
const mdxComponents = {
  code: ({ className, children, ...props }) => {
    if (className === "language-mermaid") {
      return <MermaidDiagram code={String(children).trim()} />;
    }
    // Normal code rendering with syntax highlighting
    return <code className={className} {...props}>{children}</code>;
  },
  pre: CodeBlock,
};
```

---

## Phase 5: Integration & Verification

### 5.1 Final mdxComponents map

```typescript
const mdxComponents = {
  pre: CodeBlock,           // Code copy button (Phase 2)
  code: CodeRouter,         // Routes mermaid vs normal code (Phase 4)
  li: TaskListItem,         // Interactive checkboxes (Phase 3)
  // Standard typography keeps existing prose styles
};
```

### 5.2 Remove deprecated dependencies

```bash
bun remove react-markdown remark-gfm rehype-highlight rehype-raw rehype-slug
```

These are replaced by `@mdx-js/rollup` + `@mdx-js/react` which handle compilation directly.

Note: Keep `remark-gfm` — it's used by the MDX Vite plugin.

### 5.3 Build verification

```bash
bun run build
```

Expected:
- 39 `.mdx` files compiled to React components (lazy chunks)
- `mermaid` lazy-loaded (not in main bundle)
- No TypeScript errors

### 5.4 Files summary

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `src/components/code-block.tsx` | Copy button on code blocks |
| **Create** | `src/components/mermaid-diagram.tsx` | Mermaid.js renderer (lazy) |
| **Create** | `src/components/checkbox-tracker.tsx` | Interactive checkbox + localStorage |
| **Create** | `src/components/progress-context.tsx` | Doc key context for checkbox scoping |
| **Create** | `src/hooks/use-checkbox-storage.ts` | localStorage read/write hook |
| **Rewrite** | `src/components/markdown-renderer.tsx` → `mdx-renderer.tsx` | MDXProvider + component map |
| **Rewrite** | `src/lib/docs.ts` | Glob `.mdx`, return Content component |
| **Update** | `src/hooks/use-docs.ts` | Return `Content` component instead of string |
| **Update** | `src/pages/doc-page.tsx` | Use `<MdxRenderer Content={...} />` |
| **Update** | `src/types.ts` | `content: string` → `Content: ComponentType` |
| **Update** | `vite.config.ts` | Add `mdx()` plugin |
| **Update** | `src/vite-env.d.ts` | Add `.mdx` module declaration |
| **Update** | `package.json` | New deps, remove unused |
| **Rename** | `docs/**/*.md` → `docs/**/*.mdx` | 39 files |
| **Delete** | — | Nothing deleted, `markdown-renderer.tsx` renamed |

---

## Risk Areas

| Risk | Mitigation |
|------|------------|
| MDX compilation errors on existing .md content | Plain markdown is valid MDX — rename is safe |
| Mermaid.js bundle size (~1MB) | Lazy-loaded on first diagram encounter |
| localStorage quota | Silent catch, max ~5MB (39 docs × checkboxes = negligible) |
| Checkbox index stability | Index-based keying. If doc content changes, checkboxes may shift. Alternative: hash checkbox label text for stable keys |
| React 19 compatibility with @mdx-js/react | @mdx-js/react v3+ supports React 19 |

---

## Execution Order

```
Phase 1 (MDX Pipeline)     ← Foundation, must go first
  ↓
Phase 2 (Code Copy)        ← Independent, simplest
  ↓
Phase 3 (Checkboxes)       ← Needs Phase 1 for MDX component override
  ↓
Phase 4 (Mermaid)          ← Needs Phase 2 CodeBlock routing
  ↓
Phase 5 (Integration)      ← Final verification
```
