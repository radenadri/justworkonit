# Chapter 3: Architecture Overview

Inventra is a single-page application disguised as a multi-page dashboard. Every route feels like its own page, but the entire system runs on a shared layout shell, a single authentication context, and server actions that bypass the need for API routes entirely. This chapter pulls apart the layers and explains why each decision was made — and where the architecture starts to creak under pressure.

## The Directory Map

Here's the full project structure, stripped down to the directories that matter:

```
inventra/
├── app/
│   ├── (auth)/                    # Route group — no layout nesting
│   │   └── sign-in/
│   │       ├── page.tsx           # 'use client' sign-in page
│   │       └── components/
│   │           └── SignInForm.tsx
│   ├── layout.tsx                 # Root layout (fonts, metadata)
│   ├── globals.css                # Tailwind v4 + design tokens
│   └── dashboard/
│       ├── layout.tsx             # UserProvider wrapper + <html>/<body>
│       ├── page.tsx               # Overview — charts, stats, alerts
│       ├── actions/               # 6 dashboard-level server actions
│       ├── components/            # Shell UI — Sidebar, Header, SearchModal
│       ├── categories/            # Feature module
│       ├── products/              # Feature module
│       ├── stock-in/              # Feature module
│       ├── stock-out/             # Feature module
│       ├── users/                 # Feature module
│       └── warehouses/            # Feature module
├── components/molecules/          # Shared Toast component
├── contexts/                      # UserContext only
├── hooks/                         # useDashboard, useToast
├── lib/supabase/                  # client.ts, server.ts, proxy.ts
├── proxy.ts                       # Middleware — auth redirect logic
└── supabase/                      # Migrations, seeds, config
```

Two things stand out immediately. First, the `app/api/` directory doesn't exist. There are zero API route handlers in the entire project. Second, the `components/molecules/` directory holds exactly one component — `Toast.tsx`. Everything else lives inside feature modules or the dashboard shell. This is aggressive colocation, and it works well at this scale.

## Feature Module Anatomy

The six feature modules (categories, products, stock-in, stock-out, users, warehouses) all follow an identical internal structure. No exceptions. No shortcuts.

```
app/dashboard/[feature]/
├── actions/        # Server Actions — one per file (kebab-case)
├── components/     # Feature-specific UI components (PascalCase)
├── form/           # FeatureForm.tsx + useFeatureForm.ts + form-types.ts
├── hooks/          # useFeature.ts — data-fetching hook
├── lib/            # Utilities (storage-utils.ts, etc.)
├── types/          # Domain types (product.ts, etc.)
├── layout.tsx      # Metadata export only — renders {children}
└── page.tsx        # 'use client' — owns all page-level state
```

This pattern is rigid. Every feature has a `form/` triplet. Every feature has its own `hooks/` with a data-fetching hook. Every feature's `layout.tsx` does nothing except set metadata and pass children through. Consistency like this pays off when the team grows — a developer who's worked on the products module can jump into warehouses and already know where everything lives.

The action counts vary by feature complexity:

| Feature    | Action Files | Key Operations                              |
| ---------- | ------------ | ------------------------------------------- |
| stock-in   | 12           | CRUD, filters, stats, charts, lookups       |
| stock-out  | 10           | CRUD, filters, stats, dispatch reasons      |
| warehouses | 10           | CRUD, filters, stats, utilization, movement |
| products   | 8            | CRUD, stats, distribution, trends           |
| categories | 7            | CRUD, stats, distribution, growth           |
| users      | 6            | CRUD, filters, stats                        |
| dashboard  | 6            | Overview stats, charts, search, activity    |

That's 59 server action files total across 7 directories. The stock-in module alone has 12. This is a lot of files, but each one does exactly one thing and nothing else.

## Server Actions as the Data Layer

This is the most defining architectural decision in Inventra. There are no API routes. No `/api/products/[id]/route.ts`. No GET handlers. No POST handlers. Everything — reads and writes alike — goes through server actions.

Here's the canonical pattern every action follows:

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ProductFormData } from '@/app/dashboard/products/form/product-form.types';

interface CreateProductResult {
  success: boolean;
  message: string;
  productId?: string;
}

export async function createProduct(
  productData: ProductFormData,
  images: File[],
): Promise<CreateProductResult> {
  try {
    const supabase = await createClient();

    // 1. Auth check — always first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: 'Authentication required' };
    }

    // 2. Input validation
    if (!productData.name || !productData.sku) {
      return { success: false, message: 'Missing required fields' };
    }

    // 3. Business logic + Supabase query
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        /* ... */
      })
      .select('id')
      .single();

    if (insertError) {
      return { success: false, message: insertError.message };
    }

    // 4. Cache invalidation
    revalidatePath('/dashboard/products');

    // 5. Return discriminated union
    return { success: true, message: 'Product created', productId: product.id };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
```

Five steps. Always in the same order. Auth, validate, execute, revalidate, return. The return type is a discriminated union — `success: boolean` with either a `data`/`message` payload or an `error`/`message` string. The caller checks `result.success` and branches accordingly.

This works. But I want to be honest about the tradeoffs.

**What works well:** Type safety flows end-to-end. The client calls `createProduct()` and gets back a typed result. No JSON parsing, no status code checking, no request/response boilerplate. Server actions also get automatic code-splitting — the server code never ships to the client bundle.

**What doesn't work well:** Server actions can't be called from external clients. There's no REST API, no GraphQL endpoint, no webhook receiver. If Inventra ever needs a mobile app or a third-party integration, the entire data layer has to be duplicated. The body size limit is already bumped to 25MB in `next.config.ts` to handle multi-image uploads — that's a hint that server actions weren't designed for heavy file transfer.

## Data Flow

Every user interaction follows the same path through the system:

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│                                                              │
│  User clicks "Create Product"                                │
│       │                                                      │
│       ▼                                                      │
│  Page Component (products/page.tsx)                           │
│  ┌─ 'use client'                                             │
│  ├─ useState: modal visibility, loading, error               │
│  ├─ useProducts(): fetches product list                      │
│  └─ calls createProduct() server action                      │
│       │                                                      │
└───────┼──────────────────────────────────────────────────────┘
        │  Network boundary (automatic serialization)
┌───────┼──────────────────────────────────────────────────────┐
│       ▼                                                      │
│  Server Action (products/actions/create-product.ts)          │
│  ┌─ 'use server'                                             │
│  ├─ createClient() → server-side Supabase (cookie auth)      │
│  ├─ supabase.auth.getUser() → verify session                 │
│  ├─ supabase.from('products').insert(...)                     │
│  ├─ supabase.storage.upload() (images)                       │
│  └─ revalidatePath('/dashboard/products')                    │
│       │                                                      │
│  PostgreSQL (with Row Level Security)                        │
│                                                              │
│  Returns: { success: true, productId: '...' }                │
└───────┼──────────────────────────────────────────────────────┘
        │
┌───────┼──────────────────────────────────────────────────────┐
│       ▼                                                      │
│  Page Component receives result                              │
│  ├─ if success: showToast('Product created')                 │
│  ├─ close modal                                              │
│  ├─ refresh() → re-fetch product list                        │
│  └─ re-render with updated data                              │
└──────────────────────────────────────────────────────────────┘
```

Notice that the client manually calls `refresh()` after a mutation. Even though `revalidatePath` runs on the server, the client hooks use `useState` + `useEffect` for data fetching. The revalidation clears the server cache, but the client still needs to re-fetch to get new data into its local state. This is a gap — and one where a library like TanStack Query or SWR would add real value.

## State Management

Inventra runs without external state libraries. Zero. No Redux, no Zustand, no Jotai. State is managed through three mechanisms.

**React Context.** A single `UserContext` wraps the entire dashboard layout. It holds the user profile (id, display_name, role, email, image_url) and a loading flag. The `UserProvider` fetches the profile on mount using the browser Supabase client:

```typescript
const fetchUserProfile = useCallback(async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, role, email, image_url')
      .eq('id', user.id)
      .single();
    if (profile) setUserProfile(profile as UserProfile);
  }
}, [supabase]);
```

This is the only context in the app. One context, one provider, one `useUser()` hook.

**Local `useState`.** Each page component owns its state. The products page alone has over a dozen `useState` calls: modal visibility, filter state, pagination, loading flags, stats data, chart data, the product being edited, the product being deleted, and the deletion error message. This is a lot of state in one component, and the products page file stretches to 468 lines.

**Custom data-fetching hooks.** Each feature has a `useFeature` hook that wraps a server action call in `useEffect`:

```typescript
export function useProducts(initialFilters?: UseProductsFilters) {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters || { page: 1, limit: 5 });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const result = await getProducts(filters);
    if (result.error) {
      setError(result.error);
    } else {
      setProducts(result.data);
      setTotal(result.total);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, total, loading, error, filters, updateFilters, refresh };
}
```

The hook returns a `refresh` function so the page can manually re-fetch after mutations. This pattern repeats across all six features. It's straightforward. It's also missing error retries, stale data handling, optimistic updates, and deduplication — things that data-fetching libraries handle out of the box.

## Form Architecture

Forms follow a triplet pattern: a UI component, a state hook, and a types file.

```
form/
├── ProductForm.tsx          # Renders inputs, drag-and-drop, previews
├── useProductForm.ts        # Manages form state, validation, file handling
└── product-form.types.ts    # ProductFormData, ProductFormErrors, ProductFormProps
```

The `useProductForm` hook is where the interesting logic lives. It handles auto-generating SKU codes from the product name and brand, validating file types and sizes (PNG/JPG/WEBP, max 2MB), managing drag-and-drop state, creating object URL previews for uploaded images, and cleaning up those URLs on unmount. All of this in 218 lines.

The form types are split into two layers. The `form/product-form.types.ts` file defines `ProductFormData` with string fields for price and stock (for controlled input binding), while the `types/product.ts` file defines `ProductDB` with numeric types matching the database schema. The server action handles the conversion — `parseFloat(productData.price)`, `parseInt(productData.stock)`.

This two-type approach is a pragmatic choice. HTML inputs deal in strings. The database deals in numbers. Keeping them separate avoids constant casting at the component level.

## Authentication

Authentication runs on three layers.

**Middleware.** The `proxy.ts` file at the project root intercepts every request. It creates a Supabase server client with cookies, calls `getUser()`, and applies redirect logic: unauthenticated users go to `/sign-in`, authenticated users at `/sign-in` go to `/dashboard`, and the root `/` redirects based on session state. The matcher excludes static assets and images.

```typescript
// Simplified from proxy.ts
if (!user && !isPublic) {
  url.pathname = '/sign-in';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

if (user && pathname.startsWith('/sign-in')) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

The `next` query parameter preserves the intended destination. After login, the app can redirect back to where the user was trying to go.

**Server-side auth check.** Every server action calls `supabase.auth.getUser()` as its first operation. This is redundant with the middleware check, but intentionally so. Middleware can be bypassed (direct server action calls don't go through middleware). The double-check means a server action will never execute business logic without a valid session.

**Client-side context.** The `UserProvider` fetches the profile independently using the browser Supabase client. This gives components access to the user's role and display name without additional network calls on every render.

## Database Access

There's no ORM. No Prisma, no Drizzle, no Knex. Every database interaction goes through the Supabase client directly.

Two client factories exist:

```typescript
// lib/supabase/server.ts — for server actions and server components
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: /* ... */ } }
  );
}

// lib/supabase/client.ts — for 'use client' components
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );
```

The server client reads cookies from the request to maintain session context. The browser client persists the session in `localStorage` and auto-refreshes expired tokens.

Common query patterns show up repeatedly across actions:

```typescript
// Relation join — fetch product with category name
.select('id, name, sku, category:categories(id, name)')

// Pagination with total count
.select('*', { count: 'exact' })
.range(from, to)
.order('created_at', { ascending: false })

// Full-text-ish search across columns
.or('name.ilike.%query%,sku.ilike.%query%')

// Multi-value filter
.in('status', ['received', 'in_transit'])

// Optional single result
.maybeSingle()
```

Row Level Security (RLS) runs at the PostgreSQL level. The Supabase client passes the user's JWT to the database, and RLS policies enforce access control. This means even if a bug in the application skips a validation check, the database itself rejects unauthorized operations.

## Styling System

Tailwind CSS v4 with PostCSS. No CSS Modules, no styled-components, no CSS-in-JS of any kind.

Design tokens live in `globals.css` as CSS custom properties, then get mapped into Tailwind's theme using the `@theme inline` directive:

```css
:root {
  --background: #ffffff;
  --foreground: #080c1a;
  --primary: #165dff;
  --primary-hover: #0e4bd9;
  --secondary: #6a7686;
  --muted: #eff2f7;
  --border: #f3f4f3;
  --success: #30b22d;
  --error: #ed6b60;
  --warning: #fed71f;
}

@theme inline {
  --color-primary: var(--primary);
  --color-muted: var(--muted);
  --radius-card: 24px;
  --radius-button: 50px;
}
```

This gives us `bg-primary`, `text-muted`, `rounded-card` as utility classes. The custom radii are generous — 24px for cards, 50px for buttons — giving the UI a distinctly rounded, modern feel.

Fonts load through `next/font/google`. Lexend Deca for the dashboard. Geist and Geist Mono for auth pages. The dashboard layout registers Lexend Deca as `--font-sans` via CSS variable, then applies it through `font-family` on the body.

`prettier-plugin-tailwindcss` auto-sorts class names. This sounds minor, but it eliminates an entire category of code review comments. Nobody argues about class ordering when the formatter handles it.

## Error Handling

Error handling in Inventra is functional but minimal.

Server actions catch errors and return them as strings. The client checks `result.success`, shows a Toast notification on failure, and moves on. There's no retry logic, no error queue, no structured error codes.

```typescript
// Server side
catch (error) {
  return {
    success: false,
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
}

// Client side
const result = await createProduct(formData, images);
if (result.success) {
  showToast('Success', result.message, 'success');
} else {
  showToast('Error', result.message, 'error');
}
```

The Toast component is the only user-facing error mechanism. It auto-dismisses after 3 seconds (configurable via the `useToast` hook). There's no global error boundary, no Sentry integration, no error logging service. Console errors go to `console.error` and nowhere else.

This is fine for an internal warehouse tool. It wouldn't be fine for a customer-facing SaaS product where you need to track error rates, reproduce issues, and page someone at 2 AM when the stock-in process breaks.

## Caching

The caching strategy is minimal by design. Inventra relies entirely on Next.js built-in caching and `revalidatePath` for cache invalidation.

After every mutation — create, update, delete — the server action calls `revalidatePath('/dashboard/products')` (or whichever feature path was modified). This tells Next.js to discard the cached version of that route.

There's no Redis. No in-memory cache. No CDN cache headers. No stale-while-revalidate pattern.

The `revalidatePath` call uses full path revalidation, not tag-based revalidation. This means updating a single product invalidates the cache for the entire products page, including all the stats, charts, and filters. For a warehouse tool with moderate traffic, this is acceptable. For a high-traffic application, you'd want `revalidateTag` with fine-grained cache tags to avoid unnecessary re-fetching.

## What This Architecture Is Good At

**Onboarding speed.** The rigid feature module pattern means a new developer can orient themselves within an hour. Find the feature, open the `actions/` folder, read the hooks, look at the types. Done.

**Type safety.** TypeScript strict mode catches errors at compile time. Discriminated union returns mean the compiler forces you to handle both success and failure cases. The form type split (string-based for inputs, number-based for the database) prevents a common class of runtime bugs.

**Security.** Double auth checks (middleware + server action), RLS at the database level, and server-side-only secrets create a solid security posture for an internal tool.

## Where This Architecture Gets Uncomfortable

**Page components are too heavy.** The products page has 468 lines and over a dozen `useState` calls. This is a code smell. The page is doing too much — it's a controller, a state manager, and a layout coordinator all in one file.

**Manual data fetching is repetitive.** Every feature hook looks the same: `useState` + `useEffect` + `useCallback`, loading/error/data state, manual refresh function. This is the kind of boilerplate that libraries like TanStack Query eliminate entirely.

**No external API surface.** Server actions can't be consumed by anything outside the Next.js app. A mobile app, a CLI tool, a partner integration — all of these would require building a separate API layer from scratch.

**Full-path cache invalidation is coarse.** Updating one product clears the entire product page cache. With tag-based caching, you could invalidate just the modified product while keeping stats and charts cached.

These aren't fatal flaws. They're growth constraints. At 6 features and one team, the architecture works well. At 20 features and five teams, some of these patterns would need to evolve.
