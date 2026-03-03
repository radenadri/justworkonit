# Chapter 5: Project Scaffolding

Chapter 4 gave us a complete Drizzle schema. Nine tables, all typed, all indexed, with Zod validation schemas generated from the table definitions. But that schema exists in a vacuum right now. It lives in code blocks inside a book chapter, not inside a running project.

This chapter changes that. We'll create a new project from scratch, install every dependency, write every config file, run the first migration, and verify that PostgreSQL creates the exact tables we designed. By the end, you'll have a working Next.js 16 application connected to a real database, with Shadcn UI initialized, Zod 4 ready, and a Redis client configured. The skeleton that every later chapter builds on.

## Starting with Bun

Bun replaces both Node.js and npm in our stack. It installs packages faster, executes TypeScript natively (no separate `ts-node` needed), and bundles scripts without extra tooling. If you haven't installed Bun yet:

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify the installation:

```bash
bun --version
# 1.2.x or later
```

Bun 1.2 or higher is required. Next.js 16 needs Node.js 20.9+ under the hood, but Bun ships its own compatible runtime, so you don't need a separate Node.js install.

Create the project:

```bash
bun create next-app@latest inventra-rebuild
```

The CLI asks a few questions. Here's what to pick:

- TypeScript? **Yes**
- ESLint? **Yes**
- Tailwind CSS? **Yes**
- `src/` directory? **Yes**
- App Router? **Yes**
- Turbopack? **Yes**
- Import alias? **@/\***

We're using the `src/` directory this time. The original Inventra put everything at the root (`app/`, `lib/`, `hooks/`). That works for smaller projects, but as we add more infrastructure (database clients, Redis clients, validation schemas, test utilities), the root gets cluttered. The `src/` prefix keeps application code separated from config files.

After the CLI finishes:

```bash
cd inventra-rebuild
bun --bun run dev
```

The `--bun` flag tells Next.js to use Bun's runtime instead of falling back to Node.js. You should see the dev server start on `http://localhost:3000` with Turbopack compiling in milliseconds.

Stop the server. We have work to do.

## Project Structure

Delete the boilerplate content that `create-next-app` generates. Remove everything inside `src/app/page.tsx` and replace it with a placeholder. Delete the default CSS except for the Tailwind import. But before we touch files, let's plan the directory structure.

The original Inventra used this layout:

```
app/
├── (auth)/sign-in/
├── dashboard/
│   ├── categories/
│   ├── products/
│   ├── stock-in/
│   ├── stock-out/
│   ├── users/
│   └── warehouses/
├── globals.css
components/
contexts/
hooks/
lib/supabase/
```

Our new structure moves everything under `src/` and adds directories for the new tools:

```
src/
├── app/
│   ├── (auth)/sign-in/
│   ├── dashboard/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── stock-in/
│   │   ├── stock-out/
│   │   ├── users/
│   │   └── warehouses/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── molecules/
│   └── ui/            ← Shadcn UI components land here
├── contexts/
├── db/
│   ├── schema/         ← Drizzle table definitions from Chapter 4
│   ├── migrations/     ← Generated SQL migration files
│   └── index.ts        ← Database client
├── hooks/
├── lib/
│   ├── redis.ts        ← Redis client
│   └── validators/     ← Shared Zod schemas
└── types/              ← Global type definitions
```

Two new top-level directories: `db/` for all database concerns and `lib/` as a general utilities folder. The `components/ui/` directory is where Shadcn will install its components. We keep `components/molecules/` for our own composite components (like the Toast system from the original app).

Create this structure:

```bash
mkdir -p src/db/schema src/db/migrations src/lib/validators src/types src/components/molecules src/contexts src/hooks
```

## Installing Dependencies

Let's install everything at once instead of doing it piecemeal across the chapter. Production dependencies first:

```bash
bun add drizzle-orm pg ioredis zod@^4.0.0
```

That gives us Drizzle ORM for database queries, the `pg` driver for PostgreSQL connections, `ioredis` for Redis, and Zod 4 for validation.

Dev dependencies:

```bash
bun add -d drizzle-kit @types/pg tsx
```

`drizzle-kit` handles migrations and schema introspection. `tsx` is needed for running TypeScript migration scripts. `@types/pg` provides type definitions for the PostgreSQL driver.

We'll also install a few utilities:

```bash
bun add lucide-react better-auth
```

`lucide-react` carries over from the original project for icons. `better-auth` is our authentication library. The original Inventra delegated auth to Supabase. Since we're replacing it with a standalone solution in Chapter 6, better-auth gives us session-based auth with a Drizzle adapter, RBAC via plugins, and zero vendor lock-in—all without writing custom JWT or password hashing code.

Here's what `package.json` should look like after all installs:

```json
{
  "name": "inventra-rebuild",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "better-auth": "^1.2.0",
    "drizzle-orm": "^0.44.0",
    "ioredis": "^5.6.0",
    "lucide-react": "^0.487.0",
    "next": "16.1.1",
    "pg": "^8.16.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/pg": "^8.15.0",
    "drizzle-kit": "^0.31.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "16.1.1",
    "tailwindcss": "^4.1.0",
    "tsx": "^4.19.0",
    "typescript": "^5.8.0"
  }
}
```

Notice the four `db:` scripts. These are thin wrappers around `drizzle-kit` commands:

- `db:generate` reads your schema files and produces SQL migration files
- `db:migrate` runs pending migrations against the database
- `db:push` syncs the schema directly to the database without generating migration files (useful during development)
- `db:studio` opens Drizzle's browser-based database viewer

## TypeScript Configuration

The `create-next-app` scaffold produces a `tsconfig.json` that works, but we need to adjust it for Drizzle and our `src/` directory:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Two changes from the original. The `target` is bumped to `ES2022` (from `ES2017`) because Bun and modern Node both support it, and it enables top-level `await` which Drizzle migration scripts use. The `paths` alias points `@/*` to `./src/*` instead of `./*` since we moved everything under `src/`.

## Environment Variables

Create a `.env.local` file at the project root:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventra

# Redis
REDIS_URL=redis://localhost:6379

# Auth
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars-change-in-production
BETTER_AUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`DATABASE_URL` is the PostgreSQL connection string. If you're using Docker (which Chapter 12 covers in detail), you'd run PostgreSQL and Redis in containers. For local development, install both natively or use Docker Compose with just the services:

```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: inventra
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  pgdata:
```

Run `docker compose -f docker-compose.dev.yml up -d` and both services start in the background.

## Configuring Drizzle

Create `drizzle.config.ts` at the project root (not inside `src/`):

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

The `schema` field points to a barrel file that re-exports all table definitions. The `out` field tells Drizzle where to write generated migration files. `verbose` and `strict` are both enabled. Verbose prints the SQL it generates, so you can inspect what's happening. Strict mode asks for confirmation before running destructive operations like dropping columns.

Now we need the schema barrel file. Copy the schema files from Chapter 4 into `src/db/schema/`. You should have these files:

```
src/db/schema/
├── enums.ts
├── users.ts
├── categories.ts
├── warehouses.ts
├── products.ts
├── product-images.ts
├── product-stocks.ts
├── transactions.ts
├── activity-logs.ts
└── index.ts
```

The `index.ts` barrel file exports everything:

```typescript
export * from './enums';
export * from './users';
export * from './categories';
export * from './warehouses';
export * from './products';
export * from './product-images';
export * from './product-stocks';
export * from './transactions';
export * from './activity-logs';
```

Next, create the database client at `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const db = drizzle(process.env.DATABASE_URL!, { schema });

export default db;
```

That's the entire database client. Drizzle takes the connection string and the schema, and returns a query builder that knows about every table and relation. The `schema` import gives us typed queries with relation support. Without it, you'd need to specify table references manually in every query.

Why not use a connection pool? For Next.js Server Actions running on a single server, the `drizzle()` constructor with a URL string creates a single connection per instance. In production with multiple workers, you'd switch to a pooled connection. Chapter 12 covers that when we set up Docker deployment.

## Running the First Migration

This is the moment of truth. We have a schema defined in TypeScript. Let's turn it into real PostgreSQL tables.

Generate the migration:

```bash
bun run db:generate
```

Drizzle reads every table definition in `src/db/schema/`, diffs it against the current state (which is empty, since this is our first migration), and generates a SQL file in `src/db/migrations/`. The output looks something like:

```
drizzle-kit: Reading schema files...
drizzle-kit: 9 tables found
drizzle-kit: 9 enums found
drizzle-kit: Generated migration: 0000_initial_schema.sql
```

Open the generated SQL file. You'll see CREATE TYPE statements for every enum, CREATE TABLE statements for every table, and CREATE INDEX statements for every index we defined. This is the SQL equivalent of our Drizzle schema. If anything looks wrong, this is where you'd catch it.

Run the migration:

```bash
bun run db:migrate
```

If your PostgreSQL connection is configured correctly, this creates all nine tables. Verify with Drizzle Studio:

```bash
bun run db:studio
```

This opens a browser UI at `https://local.drizzle.studio` where you can see every table, browse rows (empty for now), and run ad-hoc queries. Check that these tables exist:

- `users`
- `categories`
- `warehouses`
- `products`
- `product_images`
- `product_stocks`
- `transactions`
- `activity_logs`

If you see nine tables with the correct columns and constraints, the schema from Chapter 4 is now living in a real database. Close Drizzle Studio with Ctrl+C.

## Initializing Shadcn UI

Shadcn UI isn't a traditional dependency. You don't import from a `shadcn` package. Instead, a CLI copies component source files directly into your project. You own the code. You can edit anything.

Initialize it:

```bash
bunx --bun shadcn@latest init
```

The CLI asks configuration questions:

- Style? **New York**
- Base color? **Neutral**
- CSS variables for theming? **Yes**

After initialization, you'll find a `components.json` file at the project root and a `src/components/ui/` directory. The `components.json` file tells the Shadcn CLI where to put components and how to resolve imports:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "utils": "@/lib/utils",
    "components": "@/components",
    "ui": "@/components/ui",
    "hooks": "@/hooks",
    "lib": "@/lib"
  }
}
```

The `rsc: true` flag means components default to React Server Components. Client-side interactivity gets added with `'use client'` only where needed.

Let's install the components we know we'll need. Rather than adding them one at a time across chapters, we'll install the full set now:

```bash
bunx --bun shadcn@latest add button card input label select textarea dialog table badge dropdown-menu separator avatar sheet sidebar tooltip tabs form sonner
```

That's sixteen components. Each one gets copied as a `.tsx` file into `src/components/ui/`. You can open any of them, read the code, and modify it. The `form` component brings in React Hook Form integration, and `sonner` gives us toast notifications (replacing the custom Toast system from the original Inventra).

Why install everything upfront? Two reasons. First, it avoids interrupting the flow of later chapters with installation commands. Second, it lets us verify right now that all components install cleanly and that imports resolve correctly.

Shadcn also creates `src/lib/utils.ts` with a `cn()` utility function:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

This function merges Tailwind classes without conflicts. It's used in every Shadcn component and in our own components too.

## Setting Up Zod 4

Zod is already installed from our earlier `bun add` command. But we need to set up the integration between Drizzle and Zod.

In Chapter 4, we designed Zod schemas that are generated from Drizzle table definitions using `drizzle-zod`. Let's verify that works. Create a file at `src/lib/validators/user.ts`:

```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '@/db/schema';

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const selectUserSchema = createSelectSchema(users);

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

`createInsertSchema` generates a Zod schema that matches the INSERT requirements of the `users` table. Columns with defaults become optional. Required columns stay required. The override object lets us add custom validations on top. `createSelectSchema` generates a schema matching SELECT output, which is useful for validating API responses or cached data.

The `loginSchema` is a standalone Zod schema. It doesn't come from Drizzle because login credentials don't map directly to a table insert. The user submits an email and a plain-text password. The Server Action validates the input, hashes the password, and queries the database. Two different shapes for two different purposes.

We won't create validators for every table right now. Each chapter will add its own as we build the corresponding features.

## Configuring Redis

Create the Redis client at `src/lib/redis.ts`:

```typescript
import Redis from 'ioredis';

const getRedisClient = () => {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL environment variable is not set');
  }
  return new Redis(url);
};

const redis = getRedisClient();

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export default redis;
```

Why not a simpler one-liner like `const redis = new Redis(process.env.REDIS_URL!)`? Because error handling matters. If Redis is down, we want the app to log the error and continue running (with cache misses falling through to database queries), not crash on startup. The error event listener handles transient connection failures. The connect listener confirms the connection is alive.

This client runs in Server Actions and Server Components only. Redis uses a TCP connection, which doesn't work in the browser. Next.js won't bundle this file for the client because we never import it from a `'use client'` component.

A word on when we'll actually use Redis. Chapter 10 covers dashboard caching in detail. We set it up now because installing and configuring infrastructure mid-project is disruptive. Having the client ready means Chapter 10 can focus entirely on caching strategies and invalidation patterns.

## Configuring Next.js

Update `next.config.ts` to match our needs:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'ioredis'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
```

`serverExternalPackages` tells Next.js not to bundle `pg` and `ioredis` into the client-side JavaScript. These are server-only packages that rely on Node.js APIs (TCP sockets). Without this setting, the build would fail when Next.js tries to resolve them for client bundles.

The `images.remotePatterns` configuration carries over from the original Inventra. We're still storing product images in Supabase Storage (for now), so we need to allow image optimization from Supabase URLs.

## ESLint and Prettier

The scaffolded project comes with ESLint 9 flat config. Update `eslint.config.mjs`:

```javascript
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends('next/core-web-vitals', 'next/typescript')];

export default eslintConfig;
```

This matches the original Inventra's ESLint setup. `next/core-web-vitals` enforces performance best practices. `next/typescript` adds TypeScript-specific rules.

For Prettier, create `.prettierrc` at the project root:

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Install the Prettier plugin:

```bash
bun add -d prettier prettier-plugin-tailwindcss
```

Same config as the original. Semicolons, trailing commas, single quotes, 100-character lines, and automatic Tailwind class sorting.

## The Global Stylesheet

Replace the contents of `src/app/globals.css`. We're carrying over the design tokens from the original Inventra but restructuring them for Shadcn's theming system:

```css
@import 'tailwindcss';

@theme inline {
  --font-lexend: 'Lexend Deca', sans-serif;

  --color-primary: #165dff;
  --color-primary-hover: #1252d9;
  --color-primary-light: #e8f0ff;

  --color-success: #00b42a;
  --color-warning: #ff7d00;
  --color-danger: #f53f3f;
  --color-info: #3491fa;

  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f7f8fa;
  --color-bg-tertiary: #f2f3f5;

  --color-text-primary: #1d2129;
  --color-text-secondary: #4e5969;
  --color-text-tertiary: #86909c;
  --color-text-quaternary: #c9cdd4;

  --color-border-primary: #e5e6eb;
  --color-border-secondary: #f2f3f5;

  --radius-card: 24px;
  --radius-button: 50px;
  --radius-xl: 16px;
  --radius-lg: 12px;
  --radius-md: 8px;
  --radius-sm: 4px;
}

@layer base {
  * {
    @apply border-border-primary;
  }

  body {
    @apply bg-bg-primary text-text-primary font-lexend antialiased;
  }
}
```

The original Inventra used `#165dff` as its primary blue. We keep that. The radius tokens match the original too: cards with 24px corners, pill-shaped buttons at 50px, and decreasing sizes for other elements. The Lexend Deca font carries over from the dashboard layout.

Shadcn adds its own CSS variables during initialization. We merge ours alongside them. The `@theme inline` block is Tailwind v4's way of registering custom values that utilities can reference. After this, you can write `bg-primary` or `text-text-secondary` or `rounded-card` anywhere in your templates.

## Verifying the Setup

Let's confirm everything works together. Create a simple test page at `src/app/page.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import db from '@/db';
import { users } from '@/db/schema';

export default async function Home() {
  const allUsers = await db.select().from(users).limit(5);

  return (
    <main className="bg-bg-secondary flex min-h-screen items-center justify-center p-8">
      <Card className="rounded-card w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-text-primary">Inventra Setup Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-secondary">Database connected. Found {allUsers.length} users.</p>
          <Button className="rounded-button bg-primary hover:bg-primary-hover w-full">
            Everything Works
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
```

This page does four things at once. It imports a Shadcn Card and Button (verifying component installation). It queries the database through Drizzle (verifying the ORM connection). It uses our custom Tailwind tokens like `bg-bg-secondary`, `rounded-card`, and `bg-primary` (verifying the stylesheet). And it renders as a Server Component with an async database call (verifying that `pg` is excluded from client bundles).

Run the dev server:

```bash
bun --bun run dev
```

Open `http://localhost:3000`. You should see a card centered on a light gray background, with text reading "Database connected. Found 0 users." and a blue pill-shaped button. If any part fails, check the terminal output. Common issues:

- "Cannot find module 'pg'" means `serverExternalPackages` isn't configured
- "Connection refused" means PostgreSQL isn't running on port 5432
- "Relation 'users' does not exist" means the migration hasn't been run
- Component import errors mean Shadcn initialization failed

## What We Built

Let's take stock of where we are. The project has:

- Bun as the runtime and package manager
- Next.js 16 with App Router and Turbopack
- TypeScript 5 in strict mode with ES2022 target
- Drizzle ORM connected to PostgreSQL, with the full schema from Chapter 4 migrated
- Shadcn UI initialized with sixteen components installed and ready
- Zod 4 with Drizzle integration for schema-derived validation
- Redis client configured and waiting for Chapter 10
- Tailwind CSS v4 with custom design tokens matching the original Inventra
- ESLint and Prettier configured to match the original project's code style
- Docker Compose file for local PostgreSQL and Redis

No business logic yet. No auth, no CRUD operations, no dashboard. That's intentional. The scaffolding phase is about getting the foundation right so that every chapter after this can focus on features instead of fighting configuration.

One thing we skipped: Vitest. Testing comes in Chapter 11, after we have actual code worth testing. Installing a test runner for an empty project teaches you nothing. We'll set it up when we need it.

## What Comes Next

The skeleton is standing. Database tables exist. UI components are installed. The dev server runs without errors.

Chapter 6 fills in the first real feature: authentication. We'll set up better-auth with its Drizzle adapter, configure the admin plugin for role-based access, build a sign-in page with Shadcn form components, validate credentials with Zod, and protect routes with Next.js middleware. The original Inventra delegated all of this to Supabase Auth. We're replacing it with a self-hosted solution that gives us full control without writing low-level session or password hashing code.
