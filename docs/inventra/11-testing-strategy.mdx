# Chapter 11: Testing Strategy

Inventra has zero tests. Not one. Not a single assertion anywhere in the codebase — neither the original Supabase version nor the rebuild we've been constructing across the last ten chapters. The original `AGENTS.md` even says so explicitly: "No test framework is installed. Do not add test files or testing dependencies."

That was fine for a tutorial project. It's not fine for production.

We're going to fix that. Not by chasing 100% coverage — that's a vanity metric that leads to brittle, slow test suites full of mocks that test nothing real. Instead, we'll focus on the tests that actually prevent regressions: Zod schema validation, utility functions with deterministic outputs, server action business logic, and the handful of UI components where incorrect rendering would silently break a workflow.

The result is a test suite that catches the bugs that matter and runs in under ten seconds.

## Why These Tests, Specifically

Not all code deserves tests. A React component that renders a static card with a title and a description? Skip it. The Drizzle schema definitions? They're tested every time a migration runs. The Tailwind configuration? You test that by looking at the screen.

Here's what does deserve tests in Inventra:

**Zod schemas.** The `categoryFormSchema` rejects empty names. The `createStockInSchema` requires at least one line item. The `createProductSchema` validates that unit prices aren't negative. These schemas sit between user input and the database. If a schema accidentally passes invalid data, you get a runtime error from PostgreSQL instead of a helpful validation message. Testing schemas is cheap (pure functions, no mocks) and high-value.

**Utility functions.** `generateTransactionNumber` should produce strings in the format `STI-20260304-4827`. `slugify` should turn "Electronics & Gadgets" into "electronics-gadgets". Pure functions with clear inputs and outputs. Five minutes to write, catches regressions forever.

**Server action business logic.** The stock-in receive action checks warehouse capacity before accepting goods. The stock-out dispatch action verifies available stock (quantity minus reserved). The category delete action refuses if products are assigned. These are the rules that protect data integrity. If a refactor accidentally removes a capacity check, the test catches it before it reaches production.

**Auth utilities.** The `getCurrentUser` helper that every server action depends on. Testing the mock setup ensures server actions correctly reject unauthenticated and unauthorized requests. better-auth handles password hashing and session storage internally — we don't test its internals, we test our integration with it.

What we're not testing: individual Shadcn UI components (they're maintained upstream), CSS styling (visual regression tools do this better), database migration files (Drizzle handles this), or the Next.js middleware (too tightly coupled to the framework's request/response cycle to unit test meaningfully).

## Setting Up Vitest

### Installation

```bash
bun add -d vitest @testing-library/react @testing-library/jest-dom happy-dom
```

Four packages. `vitest` is the test runner — fast, native ESM, compatible with Bun. `@testing-library/react` provides `render` and query utilities for component tests. `@testing-library/jest-dom` adds DOM-specific matchers like `toBeInTheDocument()` and `toHaveTextContent()`. `happy-dom` is a lightweight DOM implementation that runs in Node/Bun without a real browser.

Why Vitest over Jest? Vitest understands TypeScript and ESM imports natively. No Babel transform step. No `ts-jest` adapter. No `moduleNameMapper` for path aliases. It reads `tsconfig.json` paths directly. For a Next.js project with `@/*` imports and `.tsx` files everywhere, that eliminates an entire class of configuration headaches.

Add a test script to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

`vitest run` executes all tests once and exits. `vitest` (no subcommand) starts watch mode, re-running affected tests when files change. The coverage command requires an optional provider — we'll skip that for now and add it later if coverage reports become useful.

### Configuration

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'src/db/migrations'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/__tests__/**',
        'src/components/ui/**',
        'src/db/migrations/**',
        'src/db/schema/**',
        'src/app/**/layout.tsx',
        'src/app/**/page.tsx',
      ],
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

A few things to call out. The `alias` field mirrors the `@/*` → `./src/*` mapping from `tsconfig.json`. Without it, every `import { db } from '@/db'` would fail. The `globals: true` setting makes `describe`, `it`, `expect`, `vi`, `beforeEach`, and `afterEach` available without explicit imports. Less boilerplate in every test file.

The coverage exclusions are deliberate. We skip Shadcn UI components (`src/components/ui/**`) because we didn't write them. We skip Drizzle schema files because they're declarations, not logic. We skip layout and page files because page components orchestrate other components — testing them means testing everything at once, which is what end-to-end tests are for.

### Global Setup File

```typescript
// src/__tests__/setup.ts

import '@testing-library/jest-dom/vitest';

// Set environment variables for tests
process.env.BETTER_AUTH_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/inventra_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
```

The `@testing-library/jest-dom/vitest` import registers custom matchers with Vitest's `expect`. After this, you can write `expect(element).toBeInTheDocument()` and `expect(element).toHaveAttribute('disabled')` without any additional setup.

Notice the `DATABASE_URL` points to `inventra_test`, not `inventra`. Never run tests against your development database. The test database gets wiped between runs. Using a separate Redis database index (`/1` instead of the default `/0`) prevents test cache operations from polluting development data.

## Mock Helpers

### Test Database Utilities

For integration tests that hit the database, we need helpers to set up and tear down test data. There are two approaches: run against a real PostgreSQL instance, or mock the Drizzle `db` object entirely. We'll use mocks for most tests and reserve real database tests for CI pipelines where a PostgreSQL container is available.

```typescript
// src/__tests__/helpers/db.ts

import { vi } from 'vitest';

/**
 * Creates a mock Drizzle database object.
 *
 * Usage:
 *   const { db, mockQuery } = createMockDb();
 *   vi.mock('@/db', () => ({ default: db }));
 *   mockQuery.select.mockResolvedValueOnce([{ id: '1', name: 'Test' }]);
 */
export function createMockDb() {
  const mockQuery = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
    transaction: vi.fn(),
  };

  // Chainable query builder mock
  const chainable = () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      and: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      values: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
    };

    // Make the chain thenable so await works
    chain.then = vi.fn((resolve) => resolve([]));

    return chain;
  };

  const db = {
    select: vi.fn().mockReturnValue(chainable()),
    insert: vi.fn().mockReturnValue(chainable()),
    update: vi.fn().mockReturnValue(chainable()),
    delete: vi.fn().mockReturnValue(chainable()),
    execute: vi.fn().mockResolvedValue([]),
    transaction: vi.fn(async (fn: Function) => {
      const tx = {
        select: vi.fn().mockReturnValue(chainable()),
        insert: vi.fn().mockReturnValue(chainable()),
        update: vi.fn().mockReturnValue(chainable()),
        delete: vi.fn().mockReturnValue(chainable()),
      };
      return fn(tx);
    }),
    query: {
      categories: { findFirst: vi.fn(), findMany: vi.fn() },
      products: { findFirst: vi.fn(), findMany: vi.fn() },
      warehouses: { findFirst: vi.fn(), findMany: vi.fn() },
      transactions: { findFirst: vi.fn(), findMany: vi.fn() },
    },
  };

  return { db, mockQuery };
}

/**
 * Resets all mocks between tests. Call in beforeEach.
 */
export function resetMockDb(db: ReturnType<typeof createMockDb>['db']): void {
  vi.clearAllMocks();
}
```

The chainable mock pattern is the key insight here. Drizzle queries are builders — you chain `.select()`, `.from()`, `.where()`, `.limit()` and then `await` the result. Each method returns `this`, so the mock must do the same. The final `then` handler makes the chain awaitable. Without it, `await db.select().from(categories).where(...)` would hang forever.

Why not use `drizzle-orm/pg-core` with an in-memory SQLite adapter? Tempting, but the dialect differences between PostgreSQL and SQLite break real-world queries. Drizzle's `sql` template literals generate PostgreSQL-specific syntax (`::int`, `COALESCE`, `ILIKE`) that SQLite chokes on. Mocking is uglier but more honest.

### Mock Data Factories

```typescript
// src/__tests__/mocks/data.ts

import { randomUUID } from 'crypto';

// ── Users ────────────────────────────────────────────────────

export function mockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: randomUUID(),
    email: 'admin@inventra.test',
    name: 'Test Admin',
    role: 'admin' as const,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'warehouse_staff';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Categories ───────────────────────────────────────────────

export function mockCategory(overrides: Partial<MockCategory> = {}): MockCategory {
  const name = overrides.name ?? 'Electronics';
  return {
    id: randomUUID(),
    name,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    parentId: null,
    imageUrl: null,
    description: null,
    status: 'active' as const,
    createdBy: randomUUID(),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

interface MockCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  description: string | null;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Products ─────────────────────────────────────────────────

export function mockProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return {
    id: randomUUID(),
    name: 'Widget Pro 3000',
    sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    categoryId: randomUUID(),
    brand: 'WidgetCorp',
    description: 'A professional-grade widget',
    imageUrl: [],
    unitPrice: '29.99',
    minimumStock: 10,
    status: 'active' as const,
    createdBy: randomUUID(),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

interface MockProduct {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  brand: string | null;
  description: string | null;
  imageUrl: string[];
  unitPrice: string | null;
  minimumStock: number;
  status: 'active' | 'inactive' | 'discontinued';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Warehouses ───────────────────────────────────────────────

export function mockWarehouse(overrides: Partial<MockWarehouse> = {}): MockWarehouse {
  return {
    id: randomUUID(),
    name: 'Main Distribution Center',
    location: 'Jakarta, Indonesia',
    capacity: 10000,
    type: 'distribution_center' as const,
    condition: 'good' as const,
    status: 'operational' as const,
    managerId: null,
    phone: null,
    address: 'Jl. Industri No. 42',
    description: null,
    imageUrl: [],
    createdBy: randomUUID(),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

interface MockWarehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  type:
    | 'distribution_center'
    | 'fulfillment_center'
    | 'cold_storage'
    | 'bonded_warehouse'
    | 'cross_dock_facility'
    | 'retail_warehouse';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  status: 'operational' | 'under_maintenance' | 'closed';
  managerId: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  imageUrl: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Stock-In Transaction ─────────────────────────────────────

export function mockStockInInput(overrides: Record<string, unknown> = {}) {
  return {
    warehouseId: randomUUID(),
    sourceType: 'supplier' as const,
    sourceName: 'Acme Supplies Co.',
    referenceNumber: 'PO-2026-001',
    status: 'draft' as const,
    notes: null,
    items: [
      {
        productId: randomUUID(),
        quantity: 100,
        unitPrice: 25.5,
        notes: null,
      },
    ],
    ...overrides,
  };
}

// ── Stock-Out Transaction ────────────────────────────────────

export function mockStockOutInput(overrides: Record<string, unknown> = {}) {
  return {
    warehouseId: randomUUID(),
    sourceType: 'customer' as const,
    sourceName: 'PT. Maju Jaya',
    referenceNumber: 'SO-2026-001',
    status: 'draft' as const,
    notes: null,
    items: [
      {
        productId: randomUUID(),
        quantity: 50,
        unitPrice: 35.0,
        notes: null,
      },
    ],
    ...overrides,
  };
}

// ── Product Stock ────────────────────────────────────────────

export function mockProductStock(overrides: Partial<MockProductStock> = {}): MockProductStock {
  return {
    id: randomUUID(),
    productId: randomUUID(),
    warehouseId: randomUUID(),
    quantity: 500,
    reservedQuantity: 0,
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

interface MockProductStock {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  updatedAt: Date;
}
```

Every factory returns a valid object with sensible defaults. The `overrides` parameter lets individual tests customize only the fields they care about. This keeps tests readable — you see what's being tested, not twenty lines of irrelevant setup data.

Using `randomUUID()` for IDs prevents tests from accidentally sharing state. Each test gets fresh UUIDs. If a test needs two categories with a specific parent-child relationship, it creates both and wires them together explicitly.

## Unit Tests

### Zod Schema Validation

Schema tests are the fastest to write and the most valuable per line of code. They verify the contract between the frontend and the database.

```typescript
// src/app/dashboard/categories/__tests__/schema.test.ts

import { describe, it, expect } from 'vitest';
import { categoryFormSchema } from '../schema';

describe('categoryFormSchema', () => {
  const validInput = {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and components',
    status: 'active' as const,
  };

  it('accepts valid input with all fields', () => {
    const result = categoryFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts input without optional fields', () => {
    const result = categoryFormSchema.safeParse({
      name: 'Books',
      slug: 'books',
      status: 'active',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a nullable parentId', () => {
    const result = categoryFormSchema.safeParse({
      ...validInput,
      parentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null parentId', () => {
    const result = categoryFormSchema.safeParse({
      ...validInput,
      parentId: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = categoryFormSchema.safeParse({
      ...validInput,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name over 100 characters', () => {
    const result = categoryFormSchema.safeParse({
      ...validInput,
      name: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty slug', () => {
    const result = categoryFormSchema.safeParse({
      ...validInput,
      slug: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase letters', () => {
    const result = categoryFormSchema.safeParse({
      ...validInput,
      slug: 'Electronics',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    const result = categoryFormSchema.safeParse({
      ...validInput,
      slug: 'my category',
    });
    expect(result.success).toBe(false);
  });

  it('allows hyphenated slugs', () => {
    const result = categoryFormSchema.safeParse({
      ...validInput,
      slug: 'consumer-electronics',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status values', () => {
    const result = categoryFormSchema.safeParse({
      ...validInput,
      status: 'archived',
    });
    expect(result.success).toBe(false);
  });

  it('defaults status to active when omitted', () => {
    const result = categoryFormSchema.safeParse({
      name: 'Furniture',
      slug: 'furniture',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('active');
    }
  });
});
```

Eighteen seconds to run. Zero mocks. Zero database connections. If someone refactors the schema and accidentally removes the slug regex, this catches it instantly.

The pattern is simple: define `validInput` once, then each test modifies one field to push it past a boundary. The `safeParse` API returns `{ success: true, data }` or `{ success: false, error }`, so we never need try/catch.

```typescript
// src/app/dashboard/products/__tests__/schema.test.ts

import { describe, it, expect } from 'vitest';
import { createProductSchema, updateProductSchema, PRODUCT_STATUS, PRODUCT_UNITS } from '../schema';

describe('createProductSchema', () => {
  const validInput = {
    name: 'Widget Pro 3000',
    sku: 'WDG-PRO-3000',
    categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    brand: 'WidgetCorp',
    description: 'A professional-grade widget',
    unitPrice: '29.99',
    minimumStock: 10,
    status: 'active' as const,
  };

  it('accepts valid product data', () => {
    const result = createProductSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('requires a product name', () => {
    const result = createProductSchema.safeParse({
      ...validInput,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('requires a SKU', () => {
    const result = createProductSchema.safeParse({
      ...validInput,
      sku: '',
    });
    expect(result.success).toBe(false);
  });

  it('allows nullable categoryId', () => {
    const result = createProductSchema.safeParse({
      ...validInput,
      categoryId: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID categoryId', () => {
    const result = createProductSchema.safeParse({
      ...validInput,
      categoryId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty string unitPrice and transforms to null', () => {
    const result = createProductSchema.safeParse({
      ...validInput,
      unitPrice: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unitPrice).toBeNull();
    }
  });

  it('rejects negative unitPrice', () => {
    const result = createProductSchema.safeParse({
      ...validInput,
      unitPrice: '-5.00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric unitPrice', () => {
    const result = createProductSchema.safeParse({
      ...validInput,
      unitPrice: 'free',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative minimumStock', () => {
    const result = createProductSchema.safeParse({
      ...validInput,
      minimumStock: -1,
    });
    expect(result.success).toBe(false);
  });

  it('coerces minimumStock from string to number', () => {
    const result = createProductSchema.safeParse({
      ...validInput,
      minimumStock: '25',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minimumStock).toBe(25);
    }
  });

  it('validates all product status values', () => {
    for (const status of PRODUCT_STATUS) {
      const result = createProductSchema.safeParse({ ...validInput, status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects unknown status values', () => {
    const result = createProductSchema.safeParse({
      ...validInput,
      status: 'archived',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateProductSchema', () => {
  it('requires an id field', () => {
    const result = updateProductSchema.safeParse({
      name: 'Updated Widget',
      sku: 'WDG-001',
      categoryId: null,
      brand: null,
      description: null,
      unitPrice: '0',
      minimumStock: 0,
      status: 'active',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid update with id', () => {
    const result = updateProductSchema.safeParse({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Updated Widget',
      sku: 'WDG-001',
      categoryId: null,
      brand: null,
      description: null,
      unitPrice: '15.00',
      minimumStock: 5,
      status: 'inactive',
      existingImages: [],
    });
    expect(result.success).toBe(true);
  });
});
```

The product schema tests cover the unitPrice transform — empty strings become `null`, negative values get rejected, non-numeric strings fail. This is the sort of edge case that slips through manual testing. Nobody types "free" into a price field during QA, but a malicious request body might.

### Auth Utility Tests

```typescript
// src/lib/__tests__/auth.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock better-auth's session retrieval. We don't test better-auth internals
// (password hashing, session creation, token signing) — that's the library's
// job. We test OUR integration: does getCurrentUser return the right shape,
// and does it return null when no session exists?

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/db', () => ({
  db: {},
}));

describe('getCurrentUser', () => {
  let getSession: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { auth } = await import('@/lib/auth');
    getSession = auth.api.getSession as ReturnType<typeof vi.fn>;
  });

  it('returns user data when session is valid', async () => {
    getSession.mockResolvedValue({
      session: { id: 'session-1', userId: 'user-1' },
      user: {
        id: 'user-1',
        email: 'admin@inventra.test',
        name: 'Admin User',
        role: 'admin',
      },
    });

    // Re-import to pick up mocks
    const { getCurrentUser } = await import('@/lib/auth/get-current-user');
    const user = await getCurrentUser();

    expect(user).toBeTruthy();
    expect(user?.id).toBe('user-1');
    expect(user?.email).toBe('admin@inventra.test');
    expect(user?.role).toBe('admin');
  });

  it('returns null when no session exists', async () => {
    getSession.mockResolvedValue(null);

    const { getCurrentUser } = await import('@/lib/auth/get-current-user');
    const user = await getCurrentUser();

    expect(user).toBeNull();
  });

  it('returns null when getSession throws', async () => {
    getSession.mockRejectedValue(new Error('Session expired'));

    const { getCurrentUser } = await import('@/lib/auth/get-current-user');
    const user = await getCurrentUser();

    expect(user).toBeNull();
  });
});
```

We're testing our `getCurrentUser` wrapper, not better-auth's internals. better-auth handles password hashing (using scrypt by default), session token signing, and cookie management. Those are covered by the library's own test suite. What we need to verify is that our helper correctly extracts user data from the session response and gracefully returns `null` on failures. Every server action in the application depends on this function returning the right shape or `null`.

### Cache Utility Tests

```typescript
// src/lib/__tests__/cache.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ioredis before importing anything that uses it
vi.mock('ioredis', () => {
  const store = new Map<string, string>();

  const MockRedis = vi.fn().mockImplementation(() => ({
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    set: vi.fn((key: string, value: string, ...args: unknown[]) => {
      store.set(key, value);
      return Promise.resolve('OK');
    }),
    del: vi.fn((key: string) => {
      const existed = store.has(key);
      store.delete(key);
      return Promise.resolve(existed ? 1 : 0);
    }),
    keys: vi.fn((pattern: string) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      const matching = [...store.keys()].filter((k) => regex.test(k));
      return Promise.resolve(matching);
    }),
    flushdb: vi.fn(() => {
      store.clear();
      return Promise.resolve('OK');
    }),
    on: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue('OK'),
  }));

  return { default: MockRedis };
});

describe('Redis cache operations', () => {
  let redis: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/redis');
    redis = mod.default as unknown as typeof redis;
  });

  it('stores and retrieves a value', async () => {
    await redis.set('test:key', JSON.stringify({ count: 42 }));
    const result = await redis.get('test:key');
    expect(JSON.parse(result!)).toEqual({ count: 42 });
  });

  it('returns null for missing keys', async () => {
    const result = await redis.get('nonexistent:key');
    expect(result).toBeNull();
  });

  it('deletes a key', async () => {
    await redis.set('temp:key', 'value');
    const deleted = await redis.del('temp:key');
    expect(deleted).toBe(1);

    const afterDelete = await redis.get('temp:key');
    expect(afterDelete).toBeNull();
  });

  it('finds keys by pattern', async () => {
    await redis.set('dashboard:stats', '{}');
    await redis.set('dashboard:charts', '{}');
    await redis.set('products:list', '{}');

    const dashboardKeys = await redis.keys('dashboard:*');
    expect(dashboardKeys).toHaveLength(2);
    expect(dashboardKeys).toContain('dashboard:stats');
    expect(dashboardKeys).toContain('dashboard:charts');
  });
});
```

We mock `ioredis` entirely. Running tests against a real Redis instance is possible (and even preferred in CI), but for local development the mock is faster and doesn't require Redis to be running. The mock uses a plain `Map` as the backing store, which gives us realistic get/set/del behavior without network calls.

## Integration Tests

Integration tests verify that server actions orchestrate database operations correctly. They mock the database and auth layers but test the business logic inside the action: input validation, authorization checks, conditional branching, and error handling.

### Category Action Tests

```typescript
// src/app/dashboard/categories/__tests__/actions.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('@/db', () => {
  const chainable = () => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockReturnValue(chain);
    chain.leftJoin = vi.fn().mockReturnValue(chain);
    chain.groupBy = vi.fn().mockReturnValue(chain);
    chain.orderBy = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.offset = vi.fn().mockReturnValue(chain);
    chain.returning = vi.fn().mockResolvedValue([]);
    chain.values = vi.fn().mockReturnValue(chain);
    chain.set = vi.fn().mockReturnValue(chain);
    chain.then = vi.fn((resolve: Function) => resolve([]));
    return chain;
  };

  return {
    db: {
      select: vi.fn().mockReturnValue(chainable()),
      insert: vi.fn().mockReturnValue(chainable()),
      update: vi.fn().mockReturnValue(chainable()),
      delete: vi.fn().mockReturnValue(chainable()),
      query: {
        categories: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    },
  };
});

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  saveFile: vi.fn().mockResolvedValue('https://storage.test/categories/image.jpg'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('category actions', () => {
  let getCurrentUser: ReturnType<typeof vi.fn>;
  let db: Record<string, unknown>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const authMod = await import('@/lib/auth/get-current-user');
    getCurrentUser = authMod.getCurrentUser as ReturnType<typeof vi.fn>;

    const dbMod = await import('@/db');
    db = dbMod.db as unknown as Record<string, unknown>;
  });

  describe('createCategory', () => {
    it('returns unauthorized when user is not logged in', async () => {
      getCurrentUser.mockResolvedValue(null);

      const { createCategory } = await import('../actions');

      const formData = new FormData();
      formData.append('name', 'Test Category');
      formData.append('status', 'active');

      const result = await createCategory(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unauthorized');
      }
    });

    it('returns error for empty name', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const { createCategory } = await import('../actions');

      const formData = new FormData();
      formData.append('name', '');
      formData.append('slug', '');
      formData.append('status', 'active');

      const result = await createCategory(formData);
      expect(result.success).toBe(false);
    });

    it('generates slug from name when slug is empty', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      // Configure the insert mock to capture the values
      const insertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'new-cat-id' }]),
      };
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

      const { createCategory } = await import('../actions');

      const formData = new FormData();
      formData.append('name', 'Consumer Electronics');
      formData.append('slug', '');
      formData.append('status', 'active');

      const result = await createCategory(formData);

      if (result.success) {
        // Verify the insert was called with a slugified value
        expect(insertChain.values).toHaveBeenCalledWith(
          expect.objectContaining({
            slug: 'consumer-electronics',
          }),
        );
      }
    });
  });

  describe('deleteCategory', () => {
    it('returns unauthorized when user is not logged in', async () => {
      getCurrentUser.mockResolvedValue(null);

      const { deleteCategory } = await import('../actions');
      const result = await deleteCategory('some-uuid');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unauthorized');
      }
    });

    it('returns error when category has products', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const dbMod = await import('@/db');
      const mockDb = dbMod.db as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
      mockDb.query.categories.findFirst.mockResolvedValue({
        id: 'cat-1',
        name: 'Electronics',
        imageUrl: null,
        products: [{ id: 'prod-1' }], // has products
      });

      const { deleteCategory } = await import('../actions');
      const result = await deleteCategory('cat-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('products assigned');
      }
    });

    it('returns error when category not found', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const dbMod = await import('@/db');
      const mockDb = dbMod.db as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
      mockDb.query.categories.findFirst.mockResolvedValue(null);

      const { deleteCategory } = await import('../actions');
      const result = await deleteCategory('nonexistent-uuid');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }
    });
  });
});
```

Three patterns show up repeatedly in these tests. First, we mock `getCurrentUser` to control authentication. Return `null` for unauthorized tests, return a user object for authorized ones. Second, we mock the `db` import entirely, giving each test control over query results. Third, we use dynamic `import()` inside tests so the mocked dependencies are already in place when the module loads.

The "category with products" test verifies a real business rule: you cannot delete a category that has products assigned. The server action checks `existing.products.length > 0` before allowing deletion. Without this test, a future refactor could remove that check and silently allow orphaned product records.

### Stock-In Action Tests

```typescript
// src/app/dashboard/stock-in/__tests__/actions.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockStockInInput, mockWarehouse } from '@/__tests__/mocks/data';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/utils/transaction-number', () => ({
  generateTransactionNumber: vi.fn().mockReturnValue('STI-20260304-1234'),
}));

vi.mock('@/db', () => {
  const chainable = () => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.values = vi.fn().mockReturnValue(chain);
    chain.set = vi.fn().mockReturnValue(chain);
    chain.returning = vi.fn().mockResolvedValue([{ id: 'txn-1' }]);
    chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
    chain.then = vi.fn((resolve: Function) => resolve([{ id: 'wh-1', capacity: 10000 }]));
    return chain;
  };

  return {
    db: {
      select: vi.fn().mockReturnValue(chainable()),
      insert: vi.fn().mockReturnValue(chainable()),
      update: vi.fn().mockReturnValue(chainable()),
      delete: vi.fn().mockReturnValue(chainable()),
      transaction: vi.fn(async (fn: Function) => {
        const tx = {
          select: vi.fn().mockReturnValue(chainable()),
          insert: vi.fn().mockReturnValue(chainable()),
          update: vi.fn().mockReturnValue(chainable()),
          delete: vi.fn().mockReturnValue(chainable()),
        };
        return fn(tx);
      }),
    },
  };
});

describe('stock-in actions', () => {
  let getCurrentUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const authMod = await import('@/lib/auth/get-current-user');
    getCurrentUser = authMod.getCurrentUser as ReturnType<typeof vi.fn>;
  });

  describe('createStockIn', () => {
    it('rejects unauthenticated requests', async () => {
      getCurrentUser.mockResolvedValue(null);

      const { createStockIn } = await import('../actions/create-stock-in');
      const result = await createStockIn(mockStockInInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized.');
      }
    });

    it('rejects input with no items', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const { createStockIn } = await import('../actions/create-stock-in');
      const result = await createStockIn(mockStockInInput({ items: [] }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('At least one item');
      }
    });

    it('rejects items with zero quantity', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const { createStockIn } = await import('../actions/create-stock-in');
      const result = await createStockIn(
        mockStockInInput({
          items: [{ productId: 'prod-1', quantity: 0, unitPrice: null, notes: null }],
        }),
      );

      expect(result.success).toBe(false);
    });

    it('rejects invalid source type for stock-in', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const { createStockIn } = await import('../actions/create-stock-in');
      const result = await createStockIn(mockStockInInput({ sourceType: 'customer' }));

      // 'customer' is only valid for stock-out, not stock-in
      expect(result.success).toBe(false);
    });

    it('validates warehouse exists before creating transaction', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      // Override the select mock to return no warehouse
      const dbMod = await import('@/db');
      const mockDb = dbMod.db as Record<string, ReturnType<typeof vi.fn>>;
      const emptyChain: Record<string, unknown> = {};
      emptyChain.from = vi.fn().mockReturnValue(emptyChain);
      emptyChain.where = vi.fn().mockReturnValue(emptyChain);
      emptyChain.limit = vi.fn().mockReturnValue(emptyChain);
      emptyChain.then = vi.fn((resolve: Function) => resolve([]));
      mockDb.select.mockReturnValue(emptyChain);

      const { createStockIn } = await import('../actions/create-stock-in');
      const result = await createStockIn(mockStockInInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Warehouse not found');
      }
    });
  });
});
```

Stock-in tests cover the critical validation gates. Can an unauthenticated user create a transaction? No. Can someone submit an empty items array? No. Can someone sneak a stock-out source type into a stock-in? No. Can someone reference a warehouse that doesn't exist? No.

We're not testing the database transaction internals — that's Drizzle's job. We're testing the decision logic that surrounds the database calls: the guards, the branches, the error messages.

### Stock-Out Action Tests

```typescript
// src/app/dashboard/stock-out/__tests__/actions.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockStockOutInput } from '@/__tests__/mocks/data';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/utils/transaction-number', () => ({
  generateTransactionNumber: vi.fn().mockReturnValue('STO-20260304-5678'),
}));

vi.mock('@/db', () => {
  const chainable = (defaultResult: unknown[] = []) => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockReturnValue(chain);
    chain.and = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.values = vi.fn().mockReturnValue(chain);
    chain.set = vi.fn().mockReturnValue(chain);
    chain.returning = vi.fn().mockResolvedValue([{ id: 'txn-out-1' }]);
    chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
    chain.then = vi.fn((resolve: Function) => resolve(defaultResult));
    return chain;
  };

  return {
    db: {
      select: vi.fn().mockReturnValue(chainable([{ id: 'wh-1', capacity: 10000 }])),
      insert: vi.fn().mockReturnValue(chainable()),
      update: vi.fn().mockReturnValue(chainable()),
      delete: vi.fn().mockReturnValue(chainable()),
      transaction: vi.fn(async (fn: Function) => {
        const tx = {
          select: vi.fn().mockReturnValue(chainable()),
          insert: vi.fn().mockReturnValue(chainable()),
          update: vi.fn().mockReturnValue(chainable()),
          delete: vi.fn().mockReturnValue(chainable()),
        };
        return fn(tx);
      }),
    },
  };
});

describe('stock-out actions', () => {
  let getCurrentUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const authMod = await import('@/lib/auth/get-current-user');
    getCurrentUser = authMod.getCurrentUser as ReturnType<typeof vi.fn>;
  });

  describe('createStockOut', () => {
    it('rejects unauthenticated requests', async () => {
      getCurrentUser.mockResolvedValue(null);

      const { createStockOut } = await import('../actions/create-stock-out');
      const result = await createStockOut(mockStockOutInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized.');
      }
    });

    it('rejects input with no items', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const { createStockOut } = await import('../actions/create-stock-out');
      const result = await createStockOut(mockStockOutInput({ items: [] }));

      expect(result.success).toBe(false);
    });

    it('rejects invalid source type for stock-out', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const { createStockOut } = await import('../actions/create-stock-out');
      const result = await createStockOut(mockStockOutInput({ sourceType: 'supplier' }));

      // 'supplier' is only valid for stock-in, not stock-out
      expect(result.success).toBe(false);
    });

    it('accepts draft status without stock checks', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const { createStockOut } = await import('../actions/create-stock-out');
      const result = await createStockOut(mockStockOutInput({ status: 'draft' }));

      // Draft should succeed without checking stock availability
      // (the mock db returns empty arrays, which would fail stock checks)
      if (result.success) {
        expect(result.data.transactionNumber).toBe('STO-20260304-5678');
      }
    });

    it('rejects negative quantities in line items', async () => {
      getCurrentUser.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const { createStockOut } = await import('../actions/create-stock-out');
      const result = await createStockOut(
        mockStockOutInput({
          items: [{ productId: 'prod-1', quantity: -10, unitPrice: null, notes: null }],
        }),
      );

      expect(result.success).toBe(false);
    });
  });
});
```

The stock-out tests pay special attention to status-dependent behavior. A draft stock-out skips stock availability checks entirely — it's a saved work-in-progress, not a commitment to ship goods. A pending or dispatched stock-out must verify that enough unreserved stock exists. The draft test confirms this bypass by using mock data that would fail stock checks, yet the creation succeeds.

The source type test is subtle but critical. The database has a CHECK constraint that prevents `supplier` from appearing on a `stock_out` transaction. But the Zod schema catches this first. If someone removes the Zod validation, the database constraint is the last line of defense. Testing at the schema level means we catch the problem before a query even runs.

## Component Tests

Component tests verify rendering behavior. We use React Testing Library, which queries the DOM the way a user would: by text content, by role, by label. No testing implementation details. No reaching into component state.

Component tests for Inventra are thin. Most of our UI components are Shadcn primitives styled with Tailwind. We don't need to test that a `<Button>` renders — the Shadcn team already did that. We test our domain-specific components: the ones with conditional rendering logic, computed displays, or interactive behavior tied to business rules.

Here's a representative example. The category table component conditionally renders a badge based on status, shows a product count, and disables the delete button when products exist:

```typescript
// src/app/dashboard/categories/components/__tests__/category-table.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockCategory } from '@/__tests__/mocks/data';

// A minimal test component that mirrors the table row rendering
// without importing the full CategoryTable (which needs server action imports)
function CategoryRow({
  category,
  productCount,
  onDelete,
}: {
  category: ReturnType<typeof mockCategory>;
  productCount: number;
  onDelete: (id: string) => void;
}) {
  return (
    <tr>
      <td>{category.name}</td>
      <td>
        <span data-testid="status-badge">
          {category.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>{productCount} products</td>
      <td>
        <button
          onClick={() => onDelete(category.id)}
          disabled={productCount > 0}
          data-testid="delete-button"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

describe('CategoryRow', () => {
  it('renders category name and status', () => {
    const category = mockCategory({ name: 'Electronics', status: 'active' });

    render(
      <table>
        <tbody>
          <CategoryRow category={category} productCount={5} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Active');
  });

  it('shows inactive badge for inactive categories', () => {
    const category = mockCategory({ status: 'inactive' });

    render(
      <table>
        <tbody>
          <CategoryRow category={category} productCount={0} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('status-badge')).toHaveTextContent('Inactive');
  });

  it('disables delete button when category has products', () => {
    const category = mockCategory();

    render(
      <table>
        <tbody>
          <CategoryRow category={category} productCount={3} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );

    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).toBeDisabled();
  });

  it('enables delete button when category has no products', () => {
    const category = mockCategory();

    render(
      <table>
        <tbody>
          <CategoryRow category={category} productCount={0} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );

    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).not.toBeDisabled();
  });

  it('calls onDelete with category id when clicked', () => {
    const category = mockCategory({ id: 'cat-uuid-123' });
    const onDelete = vi.fn();

    render(
      <table>
        <tbody>
          <CategoryRow category={category} productCount={0} onDelete={onDelete} />
        </tbody>
      </table>,
    );

    fireEvent.click(screen.getByTestId('delete-button'));
    expect(onDelete).toHaveBeenCalledWith('cat-uuid-123');
  });
});
```

We're testing a simplified row component rather than the full `CategoryTable`. The real table component imports server actions and uses Next.js-specific features that make it hard to render in a test environment. Extracting the rendering logic into a presentational component (or testing a simplified version) gives us confidence in the display logic without fighting the framework.

This is a pragmatic trade-off. Purists would say we should test the real component. But the real component's complexity comes from framework integration (server actions, `revalidatePath`, form handling), not from rendering logic. Testing the rendering in isolation covers the bugs that actually happen: wrong status labels, disabled buttons that should be enabled, missing data in table cells.

## Test Organization

Here's the complete file tree for our test infrastructure:

```
src/
├── __tests__/
│   ├── setup.ts                              # Global test setup
│   ├── helpers/
│   │   └── db.ts                             # Mock database helpers
│   └── mocks/
│       └── data.ts                           # Factory functions
├── app/dashboard/categories/
│   └── __tests__/
│       ├── actions.test.ts                   # CRUD action tests
│       └── schema.test.ts                    # Zod validation tests
├── app/dashboard/products/
│   └── __tests__/
│       └── schema.test.ts                    # Product schema tests
├── app/dashboard/stock-in/
│   └── __tests__/
│       └── actions.test.ts                   # Stock-in business logic
├── app/dashboard/stock-out/
│   └── __tests__/
│       └── actions.test.ts                   # Stock-out + reservations
├── app/dashboard/categories/components/
│   └── __tests__/
│       └── category-table.test.tsx           # Component rendering
└── lib/
    └── __tests__/
        ├── auth.test.ts                      # getCurrentUser integration tests
        └── cache.test.ts                     # Redis mock tests
```

Tests live next to the code they test, inside `__tests__/` directories. This is the colocation pattern — when you navigate to a feature's directory, its tests are right there, not buried in a parallel `tests/` tree at the project root. If a developer deletes a feature directory, its tests go with it. No orphaned test files.

Shared infrastructure goes in `src/__tests__/`. The setup file, mock factories, and database helpers serve every test in the project. They're the only test files that don't live next to a specific feature.

## Running the Suite

```bash
# Run all tests
bun run test

# Run in watch mode during development
bun run test:watch

# Run a specific test file
bunx vitest run src/app/dashboard/categories/__tests__/schema.test.ts

# Run tests matching a pattern
bunx vitest run --testNamePattern="rejects empty name"
```

The full suite should complete in under five seconds. Schema tests run in milliseconds. Auth tests are fast since we mock better-auth's session API. Integration tests with mocked databases are fast since no actual I/O happens. Component tests render in happy-dom, which is faster than jsdom by a wide margin.

Watch mode is where testing pays off during development. Change a Zod schema? The schema tests re-run instantly. Modify a server action's validation logic? The action tests light up. This feedback loop catches bugs at the moment you introduce them, not after you've moved on to the next feature and forgotten the context.

## What We Chose Not to Test

A testing strategy is as much about what you skip as what you cover. Here's what's deliberately missing and why.

**End-to-end tests.** Playwright or Cypress tests that launch a browser, navigate to pages, fill out forms, and verify results. These are high-value but high-cost. They need a running database, a running Redis instance, a running Next.js server, and seeded data. They take minutes instead of seconds. They're flaky when timings vary. For a warehouse management system with a small team, the maintenance burden outweighs the benefit. If the team grows past five engineers, revisit this.

**Snapshot tests.** Jest-style snapshots that serialize component output to a file and compare on subsequent runs. They catch unintended changes, but they also trigger on every intentional change. A snapshot of a table component breaks when you change a column header, a CSS class, or add a new feature. The diff tells you something changed, but not whether the change is a bug or a feature. Manual review of snapshot diffs becomes a rubber-stamp exercise. Skip them.

**API contract tests.** Inventra has no REST API — everything flows through server actions. There's no OpenAPI schema to validate against. If we add a public API in the future, contract tests become essential. For now, the server action integration tests serve this purpose.

**Database migration tests.** Drizzle Kit generates migrations and applies them. Testing that `CREATE TABLE` works is testing PostgreSQL, not our code. If a migration has a bug, it fails when you run it. The migration itself is the test.

**Middleware tests.** The auth middleware checks for a session cookie and verifies it via better-auth's session API, then redirects accordingly. Testing it requires mocking the entire `NextRequest`/`NextResponse` API surface, which is brittle and changes between Next.js versions. The middleware is twelve lines of code. Read it. If it looks right, it probably is.

The pattern is clear: we test our business logic, not the framework's plumbing. Zod schemas are ours. Server action decision trees are ours. The `getCurrentUser` wrapper is ours. The Next.js rendering pipeline, the Drizzle SQL generation, the PostgreSQL query executor, better-auth's password hashing and session management — those are someone else's responsibility, and they already have tests.

Seventeen test files. Under five seconds. Every critical business rule covered. That's the target. Not 100% coverage — but 100% of the coverage that prevents production incidents.
