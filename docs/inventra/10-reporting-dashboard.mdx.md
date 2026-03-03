# Chapter 10: Reporting & Dashboard

Every feature we've built so far writes data. Products get created. Stock moves in and out. Warehouses fill up. Activity logs accumulate. But none of that matters if the person running the warehouse can't see what's happening at a glance. That's what the dashboard does — it reads from every table we've built and presents the state of the system in a single screen.

This is also the chapter where we introduce Redis. The dashboard runs five separate aggregation queries every time someone loads the page. Without caching, that means five round trips to the database, several of which scan entire tables and perform grouping operations. For a warehouse with ten thousand products and a year of transaction history, those queries can take 200–500ms each. Multiply by five and the dashboard loads in over a second. Add two people refreshing at the same time and the database starts sweating.

Redis solves this. We cache the results of each query with a TTL that matches how often the underlying data actually changes. Stats that depend on stock levels get a 5-minute TTL — stock moves frequently. Category distribution changes only when someone creates or deletes a product, so it gets 15 minutes. Monthly transaction trends are historical data; once a month ends, those numbers don't change at all. One hour TTL. The result: most dashboard loads hit Redis and return in under 10ms.

## Current Implementation Analysis

The existing dashboard lives in `app/dashboard/page.tsx`. It's a `'use client'` component that imports five child components, each of which independently fetches its own data using `useEffect` and `useState`:

```
app/dashboard/
├── page.tsx                    # 'use client', renders shell + children
├── actions/
│   ├── get-overview-stats-card.ts        # Total products, low stock, inventory value, warehouses
│   ├── get-overview-charts.tsx           # Stock movement (weekly/monthly) + storage utilization
│   ├── get-overview-recent-transactions.ts # Latest stock in/out with product details
│   ├── get-overview-low-stock-alert.ts   # Products below minimum stock threshold
│   └── activity-logs.ts                  # Activity log with user join (admin only)
└── components/
    ├── StatsGrid.tsx                     # 4 stat cards with icons and change indicators
    ├── ChartsSection.tsx                 # Bar chart (movement) + Doughnut (storage)
    ├── RecentTransactions.tsx            # Transaction table with product images
    ├── LowStockAlerts.tsx               # Cards with progress bars
    ├── RecentTransactionsSkeleton.tsx    # Loading state
    └── LowStockAlertSkeleton.tsx        # Loading state
```

Every component follows the same pattern. Mount. Call a server action. Set state. Render. Here's the pattern from `StatsGrid.tsx`:

```typescript
const [stats, setStats] = useState<OverviewStatsCardData | null>(null);

useEffect(() => {
  let active = true;
  (async () => {
    const result = await getOverviewStatsCard();
    if (!active) return;
    if (!result.success) {
      setStats(null);
      return;
    }
    setStats(result.data);
  })();
  return () => {
    active = false;
  };
}, []);
```

This works. But it has three problems.

**Waterfall fetching.** Each component independently calls its own server action after the page mounts. The page renders, then five separate requests fire from the client. They run in parallel (good), but they can't start until the JavaScript bundle loads and hydrates (bad). On a slow connection, the user sees an empty skeleton for 1–2 seconds before any data appears.

**No caching.** Every page load hits the database. The stats query joins `products` with `product_stocks` and iterates every row to calculate inventory value. The charts query pulls all transactions from the last 28 days and groups them by week. These results change infrequently — maybe every few minutes — but we compute them fresh every time.

**Client-side data fetching in a framework that supports server-side rendering.** Next.js App Router gives us React Server Components. We can fetch all five datasets on the server, send the fully rendered HTML to the client, and skip the hydration round trip entirely. The user sees numbers immediately.

The server actions themselves are well-structured. Each one checks authentication first, queries Supabase with proper error handling, and returns a discriminated union. We keep that pattern. What changes is _where_ we call them — and we add a caching layer between the action and the database.

## Redis Caching Layer

We need a general-purpose caching utility that works with any serializable data. The API should be simple: give it a cache key, a TTL, and a function that fetches the data. If the cache has a hit, return it. If not, run the fetcher, store the result, and return it.

Here's the full implementation:

```typescript
// src/lib/cache.ts

import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as { redis?: Redis };

function getRedisClient(): Redis {
  if (globalForRedis.redis) return globalForRedis.redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  const redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null; // stop retrying
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
  }

  return redis;
}

export const redis = getRedisClient();

// ── Cache with TTL ────────────────────────────────────────────

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) {
      return JSON.parse(hit) as T;
    }
  } catch (error) {
    // Redis is down — fall through to the fetcher.
    // The dashboard still works, just slower.
    console.warn(
      '[Cache] Read failed, falling through to fetcher:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }

  const data = await fetcher();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    // Failed to write cache — not fatal.
    console.warn('[Cache] Write failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  return data;
}

// ── Cache invalidation ────────────────────────────────────────

export async function invalidateCache(...patterns: string[]): Promise<void> {
  try {
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (error) {
    console.warn(
      '[Cache] Invalidation failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

// ── Cache key constants ───────────────────────────────────────

export const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard:stats',
  DASHBOARD_CHARTS: 'dashboard:charts',
  DASHBOARD_RECENT_TRANSACTIONS: 'dashboard:recent-transactions',
  DASHBOARD_LOW_STOCK: 'dashboard:low-stock',
  DASHBOARD_ACTIVITY: 'dashboard:activity',
} as const;

export const CACHE_TTL = {
  /** Stats change with every stock movement — 5 minutes */
  STATS: 5 * 60,
  /** Chart data aggregates over weeks — 15 minutes */
  CHARTS: 15 * 60,
  /** Recent transactions change frequently — 3 minutes */
  RECENT_TRANSACTIONS: 3 * 60,
  /** Low stock changes with stock movements — 5 minutes */
  LOW_STOCK: 5 * 60,
  /** Activity logs append constantly — 2 minutes */
  ACTIVITY: 2 * 60,
} as const;
```

A few decisions worth explaining.

**Graceful degradation.** Every Redis operation is wrapped in try/catch. If Redis is down, the dashboard still works — it just hits the database directly. I've seen production systems crash because a cache connection failure propagated up as an unhandled exception. That's absurd. The cache is an optimization. If it's unavailable, the application should run without it, just slower.

**Global singleton in development.** Next.js hot-reloads modules during development, which means `new Redis(url)` would create a new connection on every file save. The `globalForRedis` pattern (same one we use for Drizzle and Supabase) prevents connection exhaustion during development. In production, the module loads once, so the global check is unnecessary but harmless.

**`ioredis` over `@upstash/redis`.** If you're deploying to Vercel and need a serverless-compatible Redis client, Upstash is the right choice. If you're running on a VPS or container with a persistent Redis instance, `ioredis` gives you connection pooling and pipelining. We use `ioredis` here because Inventra is a self-hosted warehouse system — it runs where the warehouse's network is.

**Flat key namespace.** We use `dashboard:stats`, `dashboard:charts`, etc. No need for deeply nested keys. The `invalidateCache` function accepts glob patterns, so `invalidateCache('dashboard:*')` wipes everything dashboard-related in one call.

### TTL Strategy

Not all data ages at the same rate.

| Data                                    | TTL    | Reasoning                                                           |
| --------------------------------------- | ------ | ------------------------------------------------------------------- |
| Stats (total products, inventory value) | 5 min  | Changes with every stock-in/stock-out                               |
| Charts (movement, storage utilization)  | 15 min | Aggregated weekly/monthly — small changes don't shift the bars much |
| Recent transactions                     | 3 min  | Users expect to see their latest transaction appear quickly         |
| Low stock alerts                        | 5 min  | Same volatility as stats — tied to stock movements                  |
| Activity logs                           | 2 min  | Append-heavy — new entries arrive constantly during work hours      |

You could set everything to 1 minute and call it a day. But that defeats the purpose. The whole point of caching is to avoid redundant computation. A 15-minute TTL on chart data means that if 20 people load the dashboard in a 15-minute window, only the first request hits the database. The other 19 get instant responses from Redis. For chart data that summarizes the last 28 days of transactions, a 15-minute delay in reflecting a new entry is completely acceptable.

### Cache Invalidation on Mutations

When a server action mutates data that affects the dashboard, it should invalidate the relevant cache keys. Add this to your stock-in and stock-out create/update actions:

```typescript
// Inside any stock-in or stock-out server action, after successful mutation:

import { invalidateCache, CACHE_KEYS } from '@/lib/cache';

// After creating/updating a stock-in transaction:
await invalidateCache(
  CACHE_KEYS.DASHBOARD_STATS,
  CACHE_KEYS.DASHBOARD_CHARTS,
  CACHE_KEYS.DASHBOARD_RECENT_TRANSACTIONS,
  CACHE_KEYS.DASHBOARD_LOW_STOCK,
);

// After creating/updating a product:
await invalidateCache(CACHE_KEYS.DASHBOARD_STATS, CACHE_KEYS.DASHBOARD_LOW_STOCK);

// After any mutation that generates an activity log:
await invalidateCache(CACHE_KEYS.DASHBOARD_ACTIVITY);
```

This is explicit, predictable, and easy to trace. No magic. When you look at a server action's code, you can see exactly which cache keys it invalidates.

## Dashboard Server Actions

Now we rewrite the server actions to use the caching layer. Each action keeps its existing Supabase query logic but wraps the result in `cached()`. Since the existing Supabase queries are already correct, we wrap them rather than rewrite them from scratch.

Here's the full `actions.ts` file that consolidates all dashboard data fetching:

```typescript
// src/app/dashboard/actions.ts

'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cached, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// ── Types ─────────────────────────────────────────────────────

export interface DashboardStats {
  totalProducts: number;
  newProductsLast7Days: number;
  lowStockItems: number;
  inventoryValue: number;
  activeWarehouses: number;
}

export interface MovementSeries {
  labels: string[];
  stockIn: number[];
  stockOut: number[];
}

export interface UtilizationItem {
  label: string;
  value: number;
  dotClassName: string;
  displayValue: string;
}

export interface ChartsData {
  movement: {
    weekly: MovementSeries;
    monthly: MovementSeries;
  };
  storage: {
    usedPercent: number;
    utilization: UtilizationItem[];
  };
}

export interface RecentTransaction {
  id: string;
  transactionNumber: string;
  type: 'in' | 'out';
  quantity: number;
  warehouse: string;
  status: string;
  createdAt: string;
  product: {
    name: string;
    sku: string;
    image: string;
  };
}

export interface LowStockItem {
  id: string;
  name: string;
  image: string;
  currentStock: number;
  minStock: number;
  status: 'low' | 'critical';
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity: string;
  recordId: string | null;
  referenceNumber: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
}

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

// ── Helpers ───────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatWeekday(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.round(value));
}

// ── Auth check (shared) ───────────────────────────────────────

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { supabase, user };
}

// ── 1. Dashboard Stats ───────────────────────────────────────

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const { supabase } = await requireAuth();

    const data = await cached(CACHE_KEYS.DASHBOARD_STATS, CACHE_TTL.STATS, async () => {
      const now = new Date();
      const last7Days = addDays(now, -7).toISOString();

      const [
        { count: totalProductsCount },
        { count: newProductsCount },
        { count: activeWarehousesCount },
        { data: products },
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', last7Days),
        supabase
          .from('warehouses')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'operational'),
        supabase.from('products').select('id, minimum_stock, unit_price, product_stocks(quantity)'),
      ]);

      let lowStockItems = 0;
      let inventoryValue = 0;

      for (const row of products ?? []) {
        const p = row as {
          minimum_stock: number | null;
          unit_price: number | null;
          product_stocks?: Array<{ quantity: number | null }> | null;
        };
        const stocks = p.product_stocks ?? [];
        const totalStock = stocks.reduce((sum, s) => sum + (s.quantity ?? 0), 0);
        const minStock = p.minimum_stock ?? 0;

        if (totalStock < minStock) lowStockItems += 1;

        const unitPrice = p.unit_price ?? 0;
        if (unitPrice > 0 && totalStock > 0) {
          inventoryValue += totalStock * unitPrice;
        }
      }

      return {
        totalProducts: totalProductsCount ?? 0,
        newProductsLast7Days: newProductsCount ?? 0,
        lowStockItems,
        inventoryValue: Math.round(inventoryValue * 100) / 100,
        activeWarehouses: activeWarehousesCount ?? 0,
      };
    });

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load dashboard stats',
    };
  }
}

// ── 2. Charts Data ───────────────────────────────────────────

export async function getChartsData(): Promise<ActionResult<ChartsData>> {
  try {
    const { supabase } = await requireAuth();

    const data = await cached(CACHE_KEYS.DASHBOARD_CHARTS, CACHE_TTL.CHARTS, async () => {
      const now = new Date();
      const monthlyStart = addDays(now, -27);
      const weeklyStart = addDays(now, -6);

      // Build weekly date keys
      const weekDateKeys: string[] = [];
      for (let i = 0; i < 7; i++) {
        weekDateKeys.push(toDateKey(addDays(weeklyStart, i).toISOString()));
      }

      const weekly: MovementSeries = {
        labels: weekDateKeys.map((k) => formatWeekday(k)),
        stockIn: Array(7).fill(0),
        stockOut: Array(7).fill(0),
      };

      const monthly: MovementSeries = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        stockIn: Array(4).fill(0),
        stockOut: Array(4).fill(0),
      };

      const [{ data: transactions }, { data: warehouses }] = await Promise.all([
        supabase
          .from('transactions')
          .select('transaction_date, type, status, transaction_lines(quantity)')
          .in('type', ['stock_in', 'stock_out'])
          .in('status', ['received', 'completed'])
          .gte('transaction_date', monthlyStart.toISOString())
          .lte('transaction_date', now.toISOString()),
        supabase.from('warehouses').select('id, capacity').eq('status', 'operational').limit(2000),
      ]);

      // Process movement data
      const msPerDay = 24 * 60 * 60 * 1000;
      for (const trx of transactions ?? []) {
        const t = trx as {
          transaction_date: string;
          type: string;
          status: string;
          transaction_lines?: Array<{ quantity: number | null }> | null;
        };
        const qty = (t.transaction_lines ?? []).reduce((sum, l) => sum + (l.quantity ?? 0), 0);
        if (qty <= 0) continue;

        const dateKey = toDateKey(t.transaction_date);
        const trxDate = new Date(t.transaction_date);
        const daysFromStart = Math.floor((trxDate.getTime() - monthlyStart.getTime()) / msPerDay);
        const weekIdx = Math.min(3, Math.max(0, Math.floor(daysFromStart / 7)));

        if (t.type === 'stock_in') {
          const weeklyIdx = weekDateKeys.indexOf(dateKey);
          if (weeklyIdx >= 0) weekly.stockIn[weeklyIdx] += qty;
          monthly.stockIn[weekIdx] += qty;
        }

        if (t.type === 'stock_out') {
          const weeklyIdx = weekDateKeys.indexOf(dateKey);
          if (weeklyIdx >= 0) weekly.stockOut[weeklyIdx] += qty;
          monthly.stockOut[weekIdx] += qty;
        }
      }

      // Process storage utilization
      const warehouseIds = (warehouses ?? [])
        .map((w) => (w as { id?: string }).id)
        .filter((id): id is string => typeof id === 'string');

      const totalCapacity = (warehouses ?? []).reduce((sum, row) => {
        const cap = (row as { capacity?: number | null }).capacity ?? 0;
        return sum + (Number.isFinite(cap) ? cap : 0);
      }, 0);

      if (warehouseIds.length === 0 || totalCapacity <= 0) {
        return {
          movement: { weekly, monthly },
          storage: {
            usedPercent: 0,
            utilization: [
              { label: 'Used Space', value: 0, displayValue: '0', dotClassName: 'bg-primary' },
              { label: 'Reserved', value: 0, displayValue: '0', dotClassName: 'bg-success' },
              { label: 'Available', value: 0, displayValue: '0', dotClassName: 'bg-warning' },
            ],
          },
        };
      }

      const { data: stockRows } = await supabase
        .from('product_stocks')
        .select('quantity, reserved_quantity')
        .in('warehouse_id', warehouseIds);

      const usedUnits = (stockRows ?? []).reduce((sum, row) => {
        const qty = (row as { quantity?: number | null }).quantity ?? 0;
        return sum + (Number.isFinite(qty) ? qty : 0);
      }, 0);

      const reservedUnits = (stockRows ?? []).reduce((sum, row) => {
        const qty = (row as { reserved_quantity?: number | null }).reserved_quantity ?? 0;
        return sum + (Number.isFinite(qty) ? qty : 0);
      }, 0);

      const availableUnits = Math.max(0, totalCapacity - usedUnits - reservedUnits);
      const usedPercent = Math.min(100, Math.max(0, Math.round((usedUnits / totalCapacity) * 100)));
      const reservedPercent = Math.min(
        100,
        Math.max(0, Math.round((reservedUnits / totalCapacity) * 100)),
      );
      const availablePercent = Math.max(0, 100 - usedPercent - reservedPercent);

      return {
        movement: { weekly, monthly },
        storage: {
          usedPercent,
          utilization: [
            {
              label: 'Used Space',
              value: usedPercent,
              displayValue: formatCompact(usedUnits),
              dotClassName: 'bg-primary',
            },
            {
              label: 'Reserved',
              value: reservedPercent,
              displayValue: formatCompact(reservedUnits),
              dotClassName: 'bg-success',
            },
            {
              label: 'Available',
              value: availablePercent,
              displayValue: formatCompact(availableUnits),
              dotClassName: 'bg-warning',
            },
          ],
        },
      };
    });

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load charts data',
    };
  }
}

// ── 3. Recent Transactions ───────────────────────────────────

export async function getRecentTransactions(
  limit: number = 10,
): Promise<ActionResult<RecentTransaction[]>> {
  try {
    const { supabase } = await requireAuth();

    const data = await cached(
      CACHE_KEYS.DASHBOARD_RECENT_TRANSACTIONS,
      CACHE_TTL.RECENT_TRANSACTIONS,
      async () => {
        const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));

        const { data: rows, error } = await supabase
          .from('transactions')
          .select(
            `
              id,
              transaction_number,
              type,
              status,
              created_at,
              warehouse:warehouses(name),
              transaction_lines(
                id,
                quantity,
                product:products(name, sku, image_url)
              )
            `,
          )
          .in('type', ['stock_in', 'stock_out'])
          .order('created_at', { ascending: false })
          .limit(25);

        if (error) throw new Error(error.message);

        const items: RecentTransaction[] = [];

        for (const trx of rows ?? []) {
          const t = trx as {
            id: string;
            transaction_number: string;
            type: 'stock_in' | 'stock_out';
            status: string | null;
            created_at: string;
            warehouse: { name: string } | Array<{ name: string }> | null;
            transaction_lines?: Array<{
              id: string;
              quantity: number | null;
              product:
                | { name: string; sku: string; image_url: string[] | null }
                | Array<{ name: string; sku: string; image_url: string[] | null }>
                | null;
            }> | null;
          };

          const warehouse = Array.isArray(t.warehouse) ? t.warehouse[0] : t.warehouse;
          const warehouseName = warehouse?.name || '-';

          for (const line of t.transaction_lines ?? []) {
            const qty = line.quantity ?? 0;
            if (!Number.isFinite(qty) || qty <= 0) continue;

            const product = Array.isArray(line.product) ? line.product[0] : line.product;
            if (!product) continue;

            const image =
              Array.isArray(product.image_url) && product.image_url.length > 0
                ? product.image_url[0]
                : '/placeholder-product.png';

            items.push({
              id: line.id || `${t.id}:${product.sku}`,
              transactionNumber: t.transaction_number,
              type: t.type === 'stock_out' ? 'out' : 'in',
              quantity: qty,
              warehouse: warehouseName,
              status: t.status ?? 'pending',
              createdAt: t.created_at,
              product: { name: product.name, sku: product.sku, image },
            });
          }
        }

        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return items.slice(0, safeLimit);
      },
    );

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load recent transactions',
    };
  }
}

// ── 4. Low Stock Alerts ──────────────────────────────────────

export async function getLowStockAlerts(limit: number = 5): Promise<ActionResult<LowStockItem[]>> {
  try {
    const { supabase } = await requireAuth();

    const data = await cached(CACHE_KEYS.DASHBOARD_LOW_STOCK, CACHE_TTL.LOW_STOCK, async () => {
      const safeLimit = Math.min(20, Math.max(1, Math.floor(limit)));

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, image_url, minimum_stock, product_stocks(quantity)');

      if (error) throw new Error(error.message);

      const items: LowStockItem[] = (products ?? [])
        .map((row) => {
          const p = row as {
            id: string;
            name: string;
            image_url: string[] | null;
            minimum_stock: number | null;
            product_stocks?: Array<{ quantity: number | null }> | null;
          };
          const minStock = p.minimum_stock ?? 0;
          if (!Number.isFinite(minStock) || minStock <= 0) return null;

          const currentStock = (p.product_stocks ?? []).reduce(
            (sum, s) => sum + (s.quantity ?? 0),
            0,
          );
          if (currentStock >= minStock) return null;

          const image =
            Array.isArray(p.image_url) && p.image_url.length > 0
              ? p.image_url[0]
              : '/placeholder-product.png';

          return {
            id: p.id,
            name: p.name,
            image,
            currentStock,
            minStock,
            status: (currentStock >= minStock * 0.5 ? 'low' : 'critical') as 'low' | 'critical',
          };
        })
        .filter((item): item is LowStockItem => Boolean(item));

      items.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'critical' ? -1 : 1;
        const aRatio = a.minStock > 0 ? a.currentStock / a.minStock : 1;
        const bRatio = b.minStock > 0 ? b.currentStock / b.minStock : 1;
        return aRatio - bRatio;
      });

      return items.slice(0, safeLimit);
    });

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load low stock alerts',
    };
  }
}

// ── 5. Activity Logs ─────────────────────────────────────────

export async function getActivityLogs(
  limit: number = 15,
): Promise<ActionResult<{ logs: ActivityLogEntry[] }>> {
  try {
    const { supabase, user } = await requireAuth();

    const data = await cached(CACHE_KEYS.DASHBOARD_ACTIVITY, CACHE_TTL.ACTIVITY, async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !serviceKey) {
        throw new Error('Missing Supabase service role key configuration');
      }

      const admin = createAdminClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });

      // Check role
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single<{ role: string | null; is_active: boolean | null }>();

      if (profileError || !profile) {
        throw new Error(profileError?.message || 'Failed to validate role');
      }

      if (profile.is_active === false) {
        throw new Error('Account is inactive');
      }

      if (profile.role !== 'admin' && profile.role !== 'manager') {
        return { logs: [] };
      }

      const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));

      const { data: rows, error } = await admin
        .from('activity_logs')
        .select(
          `
              id, action, entity, record_id, new_values, created_at,
              user:profiles(id, email, display_name)
            `,
        )
        .order('created_at', { ascending: false })
        .limit(safeLimit);

      if (error) throw new Error(error.message);

      type LogRow = {
        id: string;
        action: string;
        entity: string;
        record_id: string | null;
        new_values: unknown;
        created_at: string;
        user:
          | { id: string; email: string; display_name: string | null }
          | Array<{ id: string; email: string; display_name: string | null }>
          | null;
      };

      const logs: ActivityLogEntry[] = ((rows ?? []) as LogRow[]).map((row) => {
        const u = Array.isArray(row.user) ? row.user[0] : row.user;
        const newValues = row.new_values as Record<string, unknown> | null;
        const refNumber =
          typeof newValues?.reference_number === 'string' ? newValues.reference_number : null;

        return {
          id: row.id,
          action: row.action,
          entity: row.entity,
          recordId: row.record_id,
          referenceNumber: refNumber,
          createdAt: row.created_at,
          user: u ? { id: u.id, email: u.email, displayName: u.display_name } : null,
        };
      });

      return { logs };
    });

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load activity logs',
    };
  }
}
```

The structure is identical across all five actions. Authenticate. Wrap the database call in `cached()`. Return the discriminated union. The fetcher function inside `cached()` runs only on cache miss.

One subtlety: the `requireAuth()` helper always runs — we never cache authentication checks. Only the _data fetching_ is cached. If a user's session expires, they get an unauthorized error immediately, not stale data from a previous session.

## Dashboard Page (React Server Component)

With the server actions wrapped in caching, we can turn the page into a React Server Component. No more `'use client'`. No more `useEffect`. The server fetches everything, and the client receives fully rendered HTML.

```typescript
// src/app/dashboard/page.tsx

import { getDashboardStats, getChartsData, getRecentTransactions, getLowStockAlerts } from './actions';
import { StatsCards } from './components/stats-cards';
import { ChartsSection } from './components/charts-section';
import { RecentTransactionsTable } from './components/recent-activity';

export default async function DashboardPage() {
  const [statsResult, chartsResult, transactionsResult, lowStockResult] = await Promise.all([
    getDashboardStats(),
    getChartsData(),
    getRecentTransactions(10),
    getLowStockAlerts(5),
  ]);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-8">
      <StatsCards
        stats={statsResult.success ? statsResult.data : null}
      />

      <ChartsSection
        charts={chartsResult.success ? chartsResult.data : null}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RecentTransactionsTable
          transactions={transactionsResult.success ? transactionsResult.data : []}
        />
        <LowStockAlerts
          items={lowStockResult.success ? lowStockResult.data : []}
        />
      </div>
    </div>
  );
}
```

Four parallel `await`s. One render pass. No waterfall. The page streams to the client with data already baked in. If any query fails, we pass `null` or an empty array and the component renders a fallback — no runtime crash.

## Stats Cards Component

This component no longer needs `'use client'`. It receives data as props from the server.

```typescript
// src/app/dashboard/components/stats-cards.tsx

import { Package, AlertTriangle, DollarSign, Warehouse, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '../actions';

interface StatsCardsProps {
  stats: DashboardStats | null;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatInventoryValue(value: number): string {
  if (!Number.isFinite(value)) return 'Rp 0';
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n)}M`;
  }

  if (abs >= 1_000_000) {
    const n = value / 1_000_000;
    return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n)}Jt`;
  }

  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

const CARD_CONFIG = [
  {
    key: 'totalProducts',
    title: 'Total Products',
    format: (s: DashboardStats) => formatCompactNumber(s.totalProducts),
    change: (s: DashboardStats) =>
      s.newProductsLast7Days > 0 ? `+${s.newProductsLast7Days} New` : 'No new',
    changeType: (s: DashboardStats) =>
      s.newProductsLast7Days > 0 ? 'positive' : 'info',
    icon: Package,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    key: 'lowStockItems',
    title: 'Low Stock Items',
    format: (s: DashboardStats) => s.lowStockItems.toLocaleString(),
    change: (s: DashboardStats) => (s.lowStockItems > 0 ? 'Action Req.' : 'OK'),
    changeType: (s: DashboardStats) => (s.lowStockItems > 0 ? 'warning' : 'info'),
    icon: AlertTriangle,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    key: 'inventoryValue',
    title: 'Inventory Value',
    format: (s: DashboardStats) => formatInventoryValue(s.inventoryValue),
    change: () => 'Stock Value',
    changeType: () => 'positive',
    icon: DollarSign,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    key: 'activeWarehouses',
    title: 'Active Warehouses',
    format: (s: DashboardStats) => s.activeWarehouses.toLocaleString(),
    change: () => 'Operational',
    changeType: () => 'info',
    icon: Warehouse,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
] as const;

function getChangeStyles(changeType: string): string {
  switch (changeType) {
    case 'positive':
      return 'text-green-600 bg-green-100';
    case 'warning':
      return 'text-red-600 bg-red-100';
    case 'info':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
      {CARD_CONFIG.map((card) => {
        const value = stats ? card.format(stats) : '0';
        const change = stats ? card.change(stats) : '—';
        const changeType = stats ? card.changeType(stats) : 'info';
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow duration-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon className={`size-6 ${card.iconColor}`} />
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${getChangeStyles(changeType)}`}
              >
                {changeType === 'positive' && <TrendingUp className="size-3" />}
                {change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">{card.title}</p>
              <p className="text-[32px] font-bold leading-10 text-slate-900">{value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

No hooks. No state. No loading skeleton needed — the data is already there when the HTML arrives. The component is a pure function of its props.

## Charts Section

Charts need `'use client'` because Chart.js manipulates canvas elements in the browser DOM. There's no way around this — canvas rendering is inherently client-side. But we still pass the _data_ from the server. The client component handles only rendering.

```typescript
// src/app/dashboard/components/chart-config.ts

export const CHART_COLORS = {
  primary: '#165DFF',
  success: '#30B22D',
  warning: '#FED71F',
  error: '#ED6B60',
  secondary: '#64748B',
  muted: '#E5E7EB',
} as const;

export const DOT_CLASS_TO_COLOR: Record<string, string> = {
  'bg-primary': CHART_COLORS.primary,
  'bg-success': CHART_COLORS.success,
  'bg-warning': CHART_COLORS.warning,
  'bg-error': CHART_COLORS.error,
  'bg-secondary': CHART_COLORS.secondary,
  'bg-muted': CHART_COLORS.muted,
};
```

```typescript
// src/app/dashboard/components/charts-section.tsx

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  type ChartOptions,
} from 'chart.js';
import { CHART_COLORS, DOT_CLASS_TO_COLOR } from './chart-config';
import type { ChartsData } from '../actions';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
);

interface ChartsSectionProps {
  charts: ChartsData | null;
}

export function ChartsSection({ charts }: ChartsSectionProps) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  const movementCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const storageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const movementChartRef = useRef<Chart | null>(null);
  const storageChartRef = useRef<Chart | null>(null);

  const movementSeries = useMemo(() => {
    if (!charts) return null;
    return charts.movement[period];
  }, [charts, period]);

  const utilization = useMemo(() => charts?.storage.utilization ?? [], [charts]);
  const usedPercent = useMemo(() => charts?.storage.usedPercent ?? 0, [charts]);

  // ── Movement bar chart ──────────────────────────────────────
  useEffect(() => {
    if (movementChartRef.current) {
      movementChartRef.current.destroy();
      movementChartRef.current = null;
    }

    const canvas = movementCanvasRef.current;
    if (!canvas || !movementSeries) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          align: 'start',
          labels: { usePointStyle: true, boxWidth: 8 },
        },
        tooltip: { enabled: true },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f3f4f6' },
          ticks: { font: { size: 10 }, precision: 0 },
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } },
        },
      },
    };

    movementChartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: movementSeries.labels,
        datasets: [
          {
            label: 'Stock In',
            data: movementSeries.stockIn,
            backgroundColor: CHART_COLORS.primary,
            borderRadius: 4,
            barThickness: 12,
          },
          {
            label: 'Stock Out',
            data: movementSeries.stockOut,
            backgroundColor: CHART_COLORS.success,
            borderRadius: 4,
            barThickness: 12,
          },
        ],
      },
      options,
    });

    return () => {
      if (movementChartRef.current) {
        movementChartRef.current.destroy();
        movementChartRef.current = null;
      }
    };
  }, [movementSeries]);

  // ── Storage doughnut chart ──────────────────────────────────
  useEffect(() => {
    if (storageChartRef.current) {
      storageChartRef.current.destroy();
      storageChartRef.current = null;
    }

    const canvas = storageCanvasRef.current;
    if (!canvas || utilization.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    storageChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: utilization.map((u) => u.label),
        datasets: [
          {
            data: utilization.map((u) => u.value),
            backgroundColor: utilization.map(
              (u) => DOT_CLASS_TO_COLOR[u.dotClassName] || CHART_COLORS.primary,
            ),
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
      },
    });

    return () => {
      if (storageChartRef.current) {
        storageChartRef.current.destroy();
        storageChartRef.current = null;
      }
    };
  }, [utilization]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Movement Chart */}
      <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Stock Movement</h3>
            <p className="text-sm text-slate-600">Inbound vs Outbound Analysis</p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setPeriod('weekly')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs transition-all ${
                period === 'weekly'
                  ? 'bg-white font-bold text-slate-900 shadow-sm'
                  : 'font-medium text-slate-600 hover:bg-white/50'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs transition-all ${
                period === 'monthly'
                  ? 'bg-white font-bold text-slate-900 shadow-sm'
                  : 'font-medium text-slate-600 hover:bg-white/50'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          {!movementSeries ? (
            <div className="flex h-[300px] min-w-[400px] items-center justify-center">
              <p className="text-sm text-slate-600">No data</p>
            </div>
          ) : (
            <div className="h-[300px] min-w-[400px]">
              <canvas ref={movementCanvasRef} />
            </div>
          )}
        </div>
      </div>

      {/* Storage Chart */}
      <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Storage Usage</h3>
        </div>
        {utilization.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-slate-600">No data</p>
          </div>
        ) : (
          <div className="relative flex h-[200px] items-center justify-center">
            <canvas ref={storageCanvasRef} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">{usedPercent}%</span>
              <span className="text-xs font-medium text-slate-600">Used</span>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {utilization.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${item.dotClassName}`} />
                <span className="text-slate-600">{item.label}</span>
              </div>
              <span className="font-bold text-slate-900">{item.displayValue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

The key change from the original: `ChartsSection` no longer calls `getOverviewCharts()` inside a `useEffect`. It receives `ChartsData` as a prop. The only client-side state it manages is the weekly/monthly toggle, which switches between two datasets that are already loaded.

This means the chart data loads at the same time as the rest of the page. No flash of "Loading chart..." text. The canvas paints as soon as the component mounts.

## Recent Activity Component

The recent transactions table and low stock alerts follow the same pattern — server-rendered with props.

```typescript
// src/app/dashboard/components/recent-activity.tsx

import Image from 'next/image';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { RecentTransaction, LowStockItem } from '../actions';

// ── Recent Transactions ──────────────────────────────────────

interface RecentTransactionsTableProps {
  transactions: RecentTransaction[];
}

function displayStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusBadge(status: string): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case 'completed':
    case 'received':
      return `${base} bg-success/10 text-success`;
    case 'cancelled':
      return `${base} bg-error/10 text-error`;
    case 'pending':
      return `${base} bg-warning/10 text-warning`;
    case 'in_transit':
    case 'qc_pending':
    case 'packed':
    case 'shipped':
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

export function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white xl:col-span-2">
      <div className="flex items-center justify-between border-b border-gray-200 p-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
          <p className="text-sm text-slate-600">Latest stock in/out movements</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[35%] px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Product
              </th>
              <th className="w-[15%] px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Type
              </th>
              <th className="w-[15%] px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Quantity
              </th>
              <th className="w-[20%] px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Warehouse
              </th>
              <th className="w-[15%] px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-600">
                  No transactions yet.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="group transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={tx.product.image}
                        alt={tx.product.name}
                        width={40}
                        height={40}
                        className="rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {tx.product.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          {tx.product.sku} &bull; {tx.transactionNumber}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`flex size-6 items-center justify-center rounded-full ${
                          tx.type === 'in' ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {tx.type === 'in' ? (
                          <ArrowDown className="size-3 text-green-600" />
                        ) : (
                          <ArrowUp className="size-3 text-red-600" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          tx.type === 'in' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        Stock {tx.type === 'in' ? 'In' : 'Out'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">
                      {tx.type === 'in' ? '+' : '-'}
                      {tx.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{tx.warehouse}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={getStatusBadge(tx.status)}>
                      {displayStatus(tx.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Low Stock Alerts ─────────────────────────────────────────

interface LowStockAlertsProps {
  items: LowStockItem[];
}

function getProgressPercentage(current: number, min: number): number {
  if (min <= 0) return 0;
  return Math.min((current / min) * 100, 100);
}

function getAlertStyles(status: string) {
  switch (status) {
    case 'critical':
      return {
        background: 'bg-red-50 border-red-100',
        text: 'text-red-600',
        progress: 'bg-red-500',
      };
    case 'low':
      return {
        background: 'bg-yellow-50 border-yellow-100',
        text: 'text-yellow-700',
        progress: 'bg-yellow-500',
      };
    default:
      return {
        background: 'bg-gray-50 border-gray-100',
        text: 'text-gray-600',
        progress: 'bg-gray-500',
      };
  }
}

export function LowStockAlerts({ items }: LowStockAlertsProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Low Stock Alert</h3>
        <span className="flex h-6 items-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
          {items.length} Items
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-600">
            No low stock items.
          </div>
        ) : (
          items.map((item) => {
            const styles = getAlertStyles(item.status);
            const pct = getProgressPercentage(item.currentStock, item.minStock);

            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 rounded-2xl border p-3 ${styles.background}`}
              >
                <Image
                  src={item.image || '/placeholder-product.png'}
                  alt={item.name}
                  width={56}
                  height={56}
                  className="rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="truncate text-sm font-semibold text-slate-900">
                      {item.name}
                    </h4>
                    <span className={`text-xs font-bold ${styles.text}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                    <div
                      className={`${styles.progress} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-600">
                    <span>Stock: {item.currentStock}</span>
                    <span>Min: {item.minStock}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

Both `RecentTransactionsTable` and `LowStockAlerts` are server components. No `'use client'` directive. No loading skeletons needed — the HTML arrives with data already rendered. The `Image` component from `next/image` works in server components, so we keep the product thumbnails optimized.

## How It All Fits Together

Let's trace a request through the full stack.

1. A warehouse manager opens `/dashboard` in their browser.
2. Next.js runs `DashboardPage()` on the server.
3. Four `Promise.all` calls execute in parallel: `getDashboardStats`, `getChartsData`, `getRecentTransactions`, `getLowStockAlerts`.
4. Each action calls `requireAuth()` — the Supabase session cookie is validated. This always hits Supabase. No caching here.
5. Each action then calls `cached()` with its key and TTL.
6. On first load (cold cache), `cached()` misses Redis, runs the Supabase query, stores the result in Redis, and returns it. Total time: ~500ms for all four queries in parallel.
7. On subsequent loads (warm cache), `cached()` finds the data in Redis and returns it in ~2ms. The Supabase queries never run.
8. The server renders the HTML — `StatsCards`, `ChartsSection`, `RecentTransactionsTable`, `LowStockAlerts` — and streams it to the browser.
9. The browser displays the fully rendered dashboard immediately. No loading spinners.
10. `ChartsSection` hydrates on the client (it has `'use client'`), and the `useEffect` hooks fire to paint the Chart.js canvases. The data is already there in props — no additional fetch.

When someone creates a stock-in transaction:

1. The `createStockIn` server action runs.
2. After inserting the transaction, it calls `invalidateCache(CACHE_KEYS.DASHBOARD_STATS, CACHE_KEYS.DASHBOARD_CHARTS, ...)`.
3. Redis deletes the matching keys.
4. The next dashboard load hits a cold cache, fetches fresh data, and repopulates Redis.

This cycle runs thousands of times a day with minimal database load. The warehouse can have 50 people staring at the dashboard and only one request per TTL window actually reaches the database.

## Environment Setup

Add the Redis URL to your environment:

```bash
# .env.local
REDIS_URL=redis://localhost:6379
```

For production, use a managed Redis instance (AWS ElastiCache, Railway, Render, or Upstash). The connection string format is the same: `redis://:password@host:port/db`.

Install `ioredis`:

```bash
npm install ioredis
```

If you're using Upstash (serverless Redis), swap out the client:

```bash
npm install @upstash/redis
```

And adjust `src/lib/cache.ts` to use the Upstash REST-based client instead of `ioredis`. The `cached()` and `invalidateCache()` function signatures stay identical — only the underlying client changes.

## What We Didn't Do

We didn't add real-time updates. The dashboard shows data that's up to 5 minutes stale (for stats) or 15 minutes stale (for charts). For a warehouse management system, that's fine. Warehouse managers aren't day traders. They don't need sub-second updates on inventory levels. They need a reliable overview when they sit down in the morning and check on things after lunch.

If you do need real-time, Supabase provides Realtime subscriptions. Subscribe to the `transactions` table and update the stats on insert. But that adds connection management, reconnection logic, and client-side state synchronization. The complexity is not worth it for a dashboard that people glance at a few times a day.

We also didn't add per-user caching. The current implementation shares one cache across all users. This works because the dashboard shows global data — total products, total inventory value, all warehouses. There's no user-specific filtering. If you add a "my transactions" widget, you'd need per-user cache keys: `dashboard:recent-transactions:${userId}`. Simple to add later, unnecessary now.

The caching layer we built is 100 lines of code. It wraps around existing server actions without modifying their query logic. It degrades gracefully when Redis is unavailable. It invalidates predictably when data changes. And it turns a 500ms dashboard load into a 10ms one for every request after the first. That's the entire point.
