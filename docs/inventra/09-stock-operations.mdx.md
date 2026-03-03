# Chapter 9: Stock Operations

Stock-in and stock-out are where an inventory system earns its keep. Everything we built up to this point — the Drizzle schema, the authentication layer, the warehouse and product modules — exists to support these two workflows. They move physical goods into warehouses and back out again. They track quantities, enforce capacity limits, and maintain an audit trail of every unit that passes through the system.

They are also the most complex features in Inventra. A stock-in transaction has a status lifecycle, warehouse capacity validation, and a product stock upsert that must be atomic. A stock-out transaction has all of that plus a reservation system that holds inventory while a shipment is being prepared. Get the reservation math wrong and you'll oversell. Get the capacity check wrong and you'll accept goods your warehouse can't hold.

This chapter builds both features from scratch using Drizzle ORM. We'll implement every Server Action, every validation schema, every status transition. The code is long. It needs to be — stock operations don't tolerate shortcuts.

## Transaction Number Generation

Both stock-in and stock-out transactions need unique, human-readable identifiers. Database UUIDs work for internal references, but warehouse staff need something they can read aloud, write on a clipboard, and search for in a list.

Our format: `STI-20260304-4827` for stock-in, `STO-20260304-1953` for stock-out. The prefix identifies the type. The date segment tells you when it was created at a glance. The four-digit suffix provides uniqueness within a day.

```typescript
// src/lib/utils/transaction-number.ts

export function generateTransactionNumber(prefix: 'STI' | 'STO'): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${random}`;
}
```

Four random digits give us 9,000 possible combinations per day per type. For a warehouse management system processing fewer than a thousand transactions daily, collisions are rare. But rare is not zero. We handle collisions with a retry loop in the create actions — if the database rejects the insert due to the unique constraint on `transaction_number`, we generate a new number and try again. Three attempts. If all three fail, something is seriously wrong with the random number generator, and we surface the error.

This is a deliberate choice over sequential numbering. Sequential numbers require either a database sequence (which creates contention under concurrent inserts) or a counter table (which needs its own locking). Random suffixes let multiple users create transactions simultaneously without coordination.

## Shared Validation Schemas

Both stock-in and stock-out share the same line item structure. A line item is a product, a quantity, and optionally a unit price. We define the validation schemas once and import them in both features.

```typescript
// src/lib/validators/stock-schemas.ts

import { z } from 'zod/v4';

// ── Line item schema (shared) ────────────────────────────────
export const lineItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;

// ── Stock-in create schema ───────────────────────────────────
export const createStockInSchema = z.object({
  warehouseId: z.string().uuid(),
  sourceType: z.enum(['supplier', 'customer_return', 'internal_transfer']),
  sourceName: z.string().min(1).max(100).optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  transactionDate: z.coerce.date().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'received']).default('draft'),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(lineItemSchema).min(1, 'At least one item is required'),
});

export type CreateStockInInput = z.infer<typeof createStockInSchema>;

// ── Stock-out create schema ──────────────────────────────────
export const createStockOutSchema = z.object({
  warehouseId: z.string().uuid(),
  sourceType: z.enum(['customer', 'internal_transfer', 'disposal', 'loss', 'adjustment']),
  sourceName: z.string().min(1).max(100).optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  transactionDate: z.coerce.date().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'dispatched']).default('draft'),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(lineItemSchema).min(1, 'At least one item is required'),
});

export type CreateStockOutInput = z.infer<typeof createStockOutSchema>;

// ── Status update schemas ────────────────────────────────────
export const updateStockInStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'pending', 'approved', 'received', 'cancelled']),
});

export const updateStockOutStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'pending', 'approved', 'dispatched', 'cancelled']),
});
```

Notice the `sourceType` enums are different for stock-in and stock-out. This mirrors the CHECK constraint we defined in the database schema back in Chapter 4. A stock-in can come from a supplier, a customer return, or an internal transfer. A stock-out goes to a customer, another warehouse (internal transfer), or represents disposal, loss, or adjustment. The Zod schema catches invalid combinations before they reach the database. The CHECK constraint catches anything that slips through.

The `z.coerce.date()` on `transactionDate` handles both ISO strings from form submissions and Date objects from programmatic calls. One less thing to worry about.

## Part 1: Stock-In Operations

Stock-in tracks goods arriving at a warehouse. A supplier ships 500 units of widget X. The shipment gets logged, passes through quality checks, and eventually gets accepted into inventory. That lifecycle looks like this:

```
  ┌───────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
  │ DRAFT │────▶│ PENDING │────▶│ APPROVED │────▶│ RECEIVED │
  └───────┘     └─────────┘     └──────────┘     └──────────┘
      │              │               │
      │              │               │
      ▼              ▼               ▼
  ┌───────────────────────────────────────┐
  │             CANCELLED                 │
  └───────────────────────────────────────┘
```

**Draft** means someone started filling out the form but hasn't submitted it. Think of it as a saved work-in-progress. No business rules are enforced yet.

**Pending** means the stock-in has been submitted and is waiting for a manager to review it. The warehouse, supplier, and line items are all set.

**Approved** means a manager signed off on it. The warehouse is expecting this shipment.

**Received** is the terminal state. The goods have physically arrived and been counted. This is the only status that modifies inventory. When a stock-in moves to "received," we upsert the `product_stocks` table, adding the incoming quantities to the warehouse's current stock.

**Cancelled** can happen from any active state. A supplier cancels the order, the warehouse rejects the shipment, or someone made a data entry mistake. If we cancel a stock-in that was already received, we need to reverse the stock adjustment. More on that shortly.

### File Structure

```
src/app/dashboard/stock-in/
├── actions/
│   ├── create-stock-in.ts
│   ├── get-stock-in.ts
│   ├── get-stock-in-by-id.ts
│   ├── update-stock-in-status.ts
│   └── delete-stock-in.ts
├── components/
│   ├── StockInTable.tsx
│   ├── StockInDetailModal.tsx
│   └── CreateStockInModal.tsx
├── form/
│   ├── StockInForm.tsx
│   └── useStockInForm.ts
├── hooks/
│   └── useStockIn.ts
├── layout.tsx
└── page.tsx
```

One action per file. The naming convention follows kebab-case for action files, PascalCase for components, camelCase for hooks. This isn't arbitrary — it matches the conventions we established in Chapter 3.

### Creating a Stock-In Transaction

The create action is the longest piece of code in this chapter. It validates input, checks warehouse capacity (if the status is "received"), generates a unique transaction number with retry logic, inserts the transaction header and line items in a single database transaction, and optionally adjusts product stocks.

```typescript
// src/app/dashboard/stock-in/actions/create-stock-in.ts

'use server';

import { eq, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import {
  transactions,
  transactionLines,
  productStocks,
  activityLogs,
  warehouses,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { generateTransactionNumber } from '@/lib/utils/transaction-number';
import { createStockInSchema } from '@/lib/validators/stock-schemas';

import type { CreateStockInInput } from '@/lib/validators/stock-schemas';

export type CreateStockInResult =
  | { success: true; data: { id: string; transactionNumber: string } }
  | { success: false; error: string };

export async function createStockIn(input: CreateStockInInput): Promise<CreateStockInResult> {
  try {
    // 1. Auth check
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    // 2. Validate input
    const parsed = createStockInSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const data = parsed.data;

    // 3. Verify warehouse exists and is operational
    const [warehouse] = await db
      .select({ id: warehouses.id, capacity: warehouses.capacity })
      .from(warehouses)
      .where(eq(warehouses.id, data.warehouseId))
      .limit(1);

    if (!warehouse) {
      return { success: false, error: 'Warehouse not found.' };
    }

    // 4. Capacity check (only when receiving immediately)
    if (data.status === 'received') {
      const capacityCheck = await checkWarehouseCapacity(
        data.warehouseId,
        warehouse.capacity,
        data.items,
      );
      if (!capacityCheck.ok) {
        return { success: false, error: capacityCheck.error };
      }
    }

    // 5. Generate transaction number with retry
    let transactionNumber = '';
    let insertedId = '';
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      transactionNumber = generateTransactionNumber('STI');

      try {
        const result = await db.transaction(async (tx) => {
          // Insert transaction header
          const [txn] = await tx
            .insert(transactions)
            .values({
              transactionNumber,
              type: 'stock_in',
              warehouseId: data.warehouseId,
              sourceType: data.sourceType,
              sourceName: data.sourceName ?? null,
              referenceNumber: data.referenceNumber ?? null,
              transactionDate: data.transactionDate ?? new Date(),
              status: data.status,
              notes: data.notes ?? null,
              createdBy: user.id,
            })
            .returning({ id: transactions.id });

          // Insert line items
          const lineValues = data.items.map((item) => ({
            transactionId: txn.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice?.toString() ?? null,
            totalValue: item.unitPrice ? (item.quantity * item.unitPrice).toString() : null,
          }));

          await tx.insert(transactionLines).values(lineValues);

          // If status is 'received', adjust stock immediately
          if (data.status === 'received') {
            await applyStockInAdjustments(tx, data.warehouseId, data.items);
          }

          // Log activity
          await tx.insert(activityLogs).values({
            userId: user.id,
            action: 'stock_in_created',
            entity: 'transactions',
            recordId: txn.id,
            newValues: {
              transactionNumber,
              status: data.status,
              warehouseId: data.warehouseId,
              itemCount: data.items.length,
            },
          });

          return txn;
        });

        insertedId = result.id;
        break; // success — exit retry loop
      } catch (error: unknown) {
        // 23505 = unique_violation (transaction_number collision)
        const isUniqueViolation =
          error instanceof Error && 'code' in error && (error as { code: string }).code === '23505';

        if (isUniqueViolation && attempt < MAX_RETRIES - 1) {
          continue; // retry with new number
        }
        throw error; // rethrow if not a collision or last attempt
      }
    }

    revalidatePath('/dashboard/stock-in');

    return {
      success: true,
      data: { id: insertedId, transactionNumber },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
```

Let's unpack the important parts.

The retry loop wraps the entire database transaction. If the generated transaction number collides with an existing one, PostgreSQL throws error code `23505` (unique violation). We catch that specific error, generate a new number, and try again. The transaction rolls back automatically on error, so no partial data gets left behind.

The `db.transaction()` call gives us an atomic unit. Either the header, all line items, and the stock adjustments succeed together, or nothing happens. This is non-negotiable for stock operations. You cannot have a transaction header without its line items, and you cannot have stock adjustments without the corresponding transaction record.

### Warehouse Capacity Validation

Capacity checks prevent a warehouse from accepting more goods than it can physically store. We sum the current stock across all products in the warehouse, add the incoming quantities, and compare against the warehouse's capacity limit.

```typescript
// Helper: check warehouse capacity (used in create-stock-in.ts)

interface CapacityResult {
  ok: boolean;
  error: string;
}

async function checkWarehouseCapacity(
  warehouseId: string,
  warehouseCapacity: number,
  items: Array<{ productId: string; quantity: number }>,
): Promise<CapacityResult> {
  // Sum current stock in this warehouse
  const [currentStock] = await db
    .select({
      totalQuantity: sql<number>`coalesce(sum(${productStocks.quantity}), 0)`,
    })
    .from(productStocks)
    .where(eq(productStocks.warehouseId, warehouseId));

  const incomingQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const projectedTotal = Number(currentStock.totalQuantity) + incomingQuantity;

  if (projectedTotal > warehouseCapacity) {
    return {
      ok: false,
      error: `Warehouse capacity exceeded. Current: ${currentStock.totalQuantity}, incoming: ${incomingQuantity}, capacity: ${warehouseCapacity}.`,
    };
  }

  return { ok: true, error: '' };
}
```

The `coalesce(sum(...), 0)` handles empty warehouses. Without it, `SUM` over zero rows returns `null`, and the comparison against capacity would always pass. A small detail that would cause a subtle bug.

One design decision worth defending: we check capacity against the total unit count across all products, not against volume, weight, or shelf space. Real warehouses have complex capacity models involving cubic footage, weight limits per rack, and temperature zones. Inventra uses a simplified model where capacity is a single integer representing maximum total units. This is appropriate for small-to-medium operations. If you need volumetric capacity, you'd add `volume_per_unit` to the products table and multiply.

### Stock Adjustment on Receive

When a stock-in transaction reaches the "received" status, we need to add the incoming quantities to the `product_stocks` table. The challenge: a product might not have a stock record for this warehouse yet. We need an upsert — insert if the combination doesn't exist, update (increment) if it does.

Drizzle handles this with `onConflictDoUpdate`:

```typescript
// Helper: apply stock adjustments for received items

async function applyStockInAdjustments(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  warehouseId: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<void> {
  for (const item of items) {
    await tx
      .insert(productStocks)
      .values({
        productId: item.productId,
        warehouseId,
        quantity: item.quantity,
        reservedQuantity: 0,
      })
      .onConflictDoUpdate({
        target: [productStocks.productId, productStocks.warehouseId],
        set: {
          quantity: sql`${productStocks.quantity} + ${item.quantity}`,
          updatedAt: new Date(),
        },
      });
  }
}
```

The `onConflictDoUpdate` targets the composite unique constraint on `(product_id, warehouse_id)`. If a row already exists for this product in this warehouse, we increment the quantity by the incoming amount using raw SQL: `quantity + excluded.quantity`. If no row exists, we insert a new one with the incoming quantity and zero reserved.

This is a single SQL statement per line item. No SELECT-then-UPDATE race condition. No application-level locking. The database handles the atomicity. This pattern replaces the old Supabase code that used a select query followed by a conditional insert or update — three round trips instead of one, with a race condition window between the select and the write.

### Fetching Stock-In Transactions

The list query supports search, pagination, and includes the warehouse name through a join. Drizzle's relational query API makes this clean:

```typescript
// src/app/dashboard/stock-in/actions/get-stock-in.ts

'use server';

import { eq, or, ilike, sql, desc, and } from 'drizzle-orm';

import { db } from '@/db';
import { transactions, warehouses } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export interface StockInListItem {
  id: string;
  transactionNumber: string;
  warehouseName: string;
  sourceType: string;
  sourceName: string | null;
  status: string;
  transactionDate: Date;
  createdAt: Date;
}

interface GetStockInParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export type GetStockInResult =
  | { success: true; data: StockInListItem[]; total: number }
  | { success: false; error: string };

export async function getStockIn(params: GetStockInParams = {}): Promise<GetStockInResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const { search, status, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [eq(transactions.type, 'stock_in')];

    if (status) {
      conditions.push(eq(transactions.status, status as any));
    }

    if (search) {
      conditions.push(
        or(
          ilike(transactions.transactionNumber, `%${search}%`),
          ilike(transactions.sourceName, `%${search}%`),
          ilike(transactions.referenceNumber, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    // Fetch data with warehouse join
    const rows = await db
      .select({
        id: transactions.id,
        transactionNumber: transactions.transactionNumber,
        warehouseName: warehouses.name,
        sourceType: transactions.sourceType,
        sourceName: transactions.sourceName,
        status: transactions.status,
        transactionDate: transactions.transactionDate,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .innerJoin(warehouses, eq(transactions.warehouseId, warehouses.id))
      .where(whereClause)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(whereClause);

    return {
      success: true,
      data: rows,
      total: Number(count),
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
```

The `innerJoin` on warehouses means stock-in records with a deleted warehouse won't appear in the list. That's intentional. If you need to see orphaned transactions, switch to `leftJoin` and handle the null warehouse name.

### Status Updates

Status transitions enforce the lifecycle. You can't jump from "draft" to "received" — you have to go through "pending" and "approved" first. The update action validates the transition, applies stock adjustments when transitioning to "received," and reverses them when cancelling a received transaction.

```typescript
// src/app/dashboard/stock-in/actions/update-stock-in-status.ts

'use server';

import { eq, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import {
  transactions,
  transactionLines,
  productStocks,
  activityLogs,
  warehouses,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { updateStockInStatusSchema } from '@/lib/validators/stock-schemas';

// Valid status transitions for stock-in
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'cancelled'],
  approved: ['received', 'cancelled'],
  received: ['cancelled'],
  cancelled: [],
};

export type UpdateStockInStatusResult = { success: true } | { success: false; error: string };

export async function updateStockInStatus(input: {
  id: string;
  status: string;
}): Promise<UpdateStockInStatusResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const parsed = updateStockInStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { id, status: newStatus } = parsed.data;

    // Fetch current transaction
    const [txn] = await db
      .select({
        id: transactions.id,
        status: transactions.status,
        warehouseId: transactions.warehouseId,
      })
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.type, 'stock_in')))
      .limit(1);

    if (!txn) {
      return { success: false, error: 'Stock-in transaction not found.' };
    }

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[txn.status] ?? [];
    if (!allowedNext.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from '${txn.status}' to '${newStatus}'.`,
      };
    }

    await db.transaction(async (tx) => {
      const oldStatus = txn.status;

      // If transitioning to 'received', check capacity and apply adjustments
      if (newStatus === 'received') {
        const lines = await tx
          .select({
            productId: transactionLines.productId,
            quantity: transactionLines.quantity,
          })
          .from(transactionLines)
          .where(eq(transactionLines.transactionId, id));

        // Check capacity
        const [warehouse] = await tx
          .select({ capacity: warehouses.capacity })
          .from(warehouses)
          .where(eq(warehouses.id, txn.warehouseId))
          .limit(1);

        const [currentStock] = await tx
          .select({
            totalQuantity: sql<number>`coalesce(sum(${productStocks.quantity}), 0)`,
          })
          .from(productStocks)
          .where(eq(productStocks.warehouseId, txn.warehouseId));

        const incomingQty = lines.reduce((s, l) => s + l.quantity, 0);
        if (Number(currentStock.totalQuantity) + incomingQty > warehouse.capacity) {
          throw new Error('Warehouse capacity would be exceeded.');
        }

        // Apply stock adjustments
        for (const line of lines) {
          await tx
            .insert(productStocks)
            .values({
              productId: line.productId,
              warehouseId: txn.warehouseId,
              quantity: line.quantity,
              reservedQuantity: 0,
            })
            .onConflictDoUpdate({
              target: [productStocks.productId, productStocks.warehouseId],
              set: {
                quantity: sql`${productStocks.quantity} + ${line.quantity}`,
                updatedAt: new Date(),
              },
            });
        }
      }

      // If cancelling a 'received' transaction, reverse the adjustments
      if (newStatus === 'cancelled' && oldStatus === 'received') {
        const lines = await tx
          .select({
            productId: transactionLines.productId,
            quantity: transactionLines.quantity,
          })
          .from(transactionLines)
          .where(eq(transactionLines.transactionId, id));

        for (const line of lines) {
          await tx
            .update(productStocks)
            .set({
              quantity: sql`${productStocks.quantity} - ${line.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(productStocks.productId, line.productId),
                eq(productStocks.warehouseId, txn.warehouseId),
              ),
            );
        }
      }

      // Update status
      await tx.update(transactions).set({ status: newStatus }).where(eq(transactions.id, id));

      // Log activity
      await tx.insert(activityLogs).values({
        userId: user.id,
        action: 'stock_in_status_updated',
        entity: 'transactions',
        recordId: id,
        oldValues: { status: oldStatus },
        newValues: { status: newStatus },
      });
    });

    revalidatePath('/dashboard/stock-in');
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
```

The `VALID_TRANSITIONS` map is a simple state machine. Each key is a current status, and its value is an array of statuses it can transition to. Cancelled is a terminal state — once there, it can't move anywhere. This replaces complex if-else chains with a lookup table that's easy to read, easy to modify, and easy to reason about.

The cancellation of a received transaction is the trickiest case. We have to subtract the quantities that were previously added. The database-level CHECK constraint `quantity >= 0` on `product_stocks` acts as a safety net. If cancelling would drive stock below zero (because some of those goods were already shipped out), the transaction will fail. That's correct behavior. You can't un-receive goods that have already left the warehouse.

## Part 2: Stock-Out Operations

Stock-out is the mirror image of stock-in, with one critical addition: the reservation system. When goods are earmarked for shipment, we need to prevent other transactions from claiming the same inventory. Reserved stock is still physically in the warehouse, but it's spoken for.

```
  ┌───────┐     ┌─────────┐     ┌──────────┐     ┌────────────┐
  │ DRAFT │────▶│ PENDING │────▶│ APPROVED │────▶│ DISPATCHED │
  └───────┘     └─────────┘     └──────────┘     └────────────┘
      │              │               │
      │              │               │
      ▼              ▼               ▼
  ┌───────────────────────────────────────┐
  │             CANCELLED                 │
  └───────────────────────────────────────┘
```

The lifecycle matches stock-in except the terminal state is "dispatched" instead of "received." The statuses mean:

**Draft** — saved but not committed. No reservations created.

**Pending** — submitted for approval. Stock is now reserved. Other transactions can see the reserved quantity and know that this inventory is claimed.

**Approved** — a manager signed off. Reservations remain.

**Dispatched** — goods have left the warehouse. Reservations are released and actual stock is deducted.

**Cancelled** — aborted. All reservations are released. Stock goes back to the available pool.

### The Reservation System

This is the heart of stock-out operations. The reservation system answers one question: how much of product X can actually be shipped from warehouse Y right now?

The answer is: **available = actual quantity - reserved quantity**.

If warehouse A has 100 units of widget X, and 30 are reserved for pending shipments, only 70 are available for new stock-out transactions. Without reservations, two warehouse workers could each create a 100-unit shipment, and only one would succeed (or worse, both would succeed and you'd have negative inventory).

```
┌──────────────────────────────────────────────┐
│              PRODUCT STOCK                    │
│                                               │
│  Actual Quantity: 100                         │
│  Reserved:         30  (pending/approved)     │
│  ─────────────────────                        │
│  Available:        70  (can be reserved)      │
│                                               │
│  Reservations:                                │
│    STO-20260304-1234: 15 units (pending)      │
│    STO-20260304-5678: 15 units (approved)     │
└──────────────────────────────────────────────┘
```

Reservations live in two places. The `stock_reservations` table holds individual reservation records tied to specific transactions. The `reserved_quantity` column on `product_stocks` holds the aggregated total. We maintain both because:

1. The `stock_reservations` table tells us which transactions hold which reservations. We need this for releasing reservations when a transaction is cancelled or dispatched.
2. The `reserved_quantity` on `product_stocks` gives us fast availability checks without aggregating the reservations table every time.

Keeping them in sync is our responsibility. Every operation that creates, releases, or modifies reservations must update both tables within the same database transaction.

### File Structure

```
src/app/dashboard/stock-out/
├── actions/
│   ├── create-stock-out.ts
│   ├── get-stock-out.ts
│   ├── get-stock-out-by-id.ts
│   ├── update-stock-out-status.ts
│   └── delete-stock-out.ts
├── components/
│   ├── StockOutTable.tsx
│   ├── StockOutDetailModal.tsx
│   └── CreateStockOutModal.tsx
├── form/
│   ├── StockOutForm.tsx
│   └── useStockOutForm.ts
├── hooks/
│   └── useStockOut.ts
├── layout.tsx
└── page.tsx
```

### Creating a Stock-Out Transaction

The create action checks available stock, creates reservations (for non-draft statuses), and handles the transaction number retry logic we saw in stock-in. The key difference is the reservation logic.

```typescript
// src/app/dashboard/stock-out/actions/create-stock-out.ts

'use server';

import { eq, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import {
  transactions,
  transactionLines,
  productStocks,
  stockReservations,
  activityLogs,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { generateTransactionNumber } from '@/lib/utils/transaction-number';
import { createStockOutSchema } from '@/lib/validators/stock-schemas';

import type { CreateStockOutInput } from '@/lib/validators/stock-schemas';

export type CreateStockOutResult =
  | { success: true; data: { id: string; transactionNumber: string } }
  | { success: false; error: string };

export async function createStockOut(input: CreateStockOutInput): Promise<CreateStockOutResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const parsed = createStockOutSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const data = parsed.data;

    const shouldReserve = data.status !== 'draft';
    const shouldDeduct = data.status === 'dispatched';

    // Check available stock for all items
    if (shouldReserve || shouldDeduct) {
      for (const item of data.items) {
        const availability = await checkAvailableStock(
          item.productId,
          data.warehouseId,
          item.quantity,
        );
        if (!availability.ok) {
          return { success: false, error: availability.error };
        }
      }
    }

    let transactionNumber = '';
    let insertedId = '';
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      transactionNumber = generateTransactionNumber('STO');

      try {
        const result = await db.transaction(async (tx) => {
          // Insert transaction header
          const [txn] = await tx
            .insert(transactions)
            .values({
              transactionNumber,
              type: 'stock_out',
              warehouseId: data.warehouseId,
              sourceType: data.sourceType,
              sourceName: data.sourceName ?? null,
              referenceNumber: data.referenceNumber ?? null,
              transactionDate: data.transactionDate ?? new Date(),
              status: data.status,
              notes: data.notes ?? null,
              createdBy: user.id,
            })
            .returning({ id: transactions.id });

          // Insert line items
          const lineValues = data.items.map((item) => ({
            transactionId: txn.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice?.toString() ?? null,
            totalValue: item.unitPrice ? (item.quantity * item.unitPrice).toString() : null,
          }));

          await tx.insert(transactionLines).values(lineValues);

          // Create reservations (for pending, approved statuses)
          if (shouldReserve && !shouldDeduct) {
            await createReservations(
              tx,
              txn.id,
              transactionNumber,
              data.warehouseId,
              data.items,
              user.id,
            );
          }

          // Direct deduction (for dispatched status — skip reservation)
          if (shouldDeduct) {
            await deductStock(tx, data.warehouseId, data.items);
          }

          // Log activity
          await tx.insert(activityLogs).values({
            userId: user.id,
            action: 'stock_out_created',
            entity: 'transactions',
            recordId: txn.id,
            newValues: {
              transactionNumber,
              status: data.status,
              warehouseId: data.warehouseId,
              itemCount: data.items.length,
            },
          });

          return txn;
        });

        insertedId = result.id;
        break;
      } catch (error: unknown) {
        const isUniqueViolation =
          error instanceof Error && 'code' in error && (error as { code: string }).code === '23505';

        if (isUniqueViolation && attempt < MAX_RETRIES - 1) {
          continue;
        }
        throw error;
      }
    }

    revalidatePath('/dashboard/stock-out');

    return {
      success: true,
      data: { id: insertedId, transactionNumber },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
```

Three possible paths based on the initial status:

1. **Draft**: no stock checks, no reservations. Just save the data.
2. **Pending/Approved**: check available stock, then create reservations.
3. **Dispatched**: check available stock, then deduct directly. No point reserving stock that's immediately leaving.

### Checking Available Stock

Available stock is the quantity in `product_stocks` minus the `reserved_quantity`. We check this before creating a stock-out and before each status transition that requires reservation or deduction.

```typescript
// Helper: check if enough stock is available

interface AvailabilityResult {
  ok: boolean;
  error: string;
}

async function checkAvailableStock(
  productId: string,
  warehouseId: string,
  requestedQuantity: number,
): Promise<AvailabilityResult> {
  const [stock] = await db
    .select({
      quantity: productStocks.quantity,
      reservedQuantity: productStocks.reservedQuantity,
    })
    .from(productStocks)
    .where(and(eq(productStocks.productId, productId), eq(productStocks.warehouseId, warehouseId)))
    .limit(1);

  if (!stock) {
    return {
      ok: false,
      error: `No stock record found for this product in the selected warehouse.`,
    };
  }

  const available = stock.quantity - stock.reservedQuantity;

  if (available < requestedQuantity) {
    return {
      ok: false,
      error: `Insufficient stock. Available: ${available}, requested: ${requestedQuantity}.`,
    };
  }

  return { ok: true, error: '' };
}
```

Simple subtraction. The `reserved_quantity` column acts as a running total of all active reservations. We don't need to sum the `stock_reservations` table here — that would be correct but slower. The denormalized `reserved_quantity` gives us O(1) lookups at the cost of maintaining it during writes.

### Creating and Releasing Reservations

Reservations are created when a stock-out enters the "pending" state and released in two scenarios: cancellation (stock returns to available) or dispatch (stock is physically removed).

```typescript
// Helper: create reservations for stock-out items

async function createReservations(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  transactionId: string,
  transactionNumber: string,
  warehouseId: string,
  items: Array<{ productId: string; quantity: number }>,
  userId: string,
): Promise<void> {
  for (const item of items) {
    // Insert reservation record
    await tx.insert(stockReservations).values({
      productId: item.productId,
      warehouseId,
      quantity: item.quantity,
      reason: 'order',
      referenceNumber: transactionNumber,
      createdBy: userId,
    });

    // Update reserved_quantity on product_stocks
    await tx
      .update(productStocks)
      .set({
        reservedQuantity: sql`${productStocks.reservedQuantity} + ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productStocks.productId, item.productId),
          eq(productStocks.warehouseId, warehouseId),
        ),
      );
  }
}

// Helper: release reservations (cancellation)

async function releaseReservations(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  transactionId: string,
  transactionNumber: string,
  warehouseId: string,
): Promise<void> {
  // Find all reservations for this transaction
  const reservations = await tx
    .select({
      id: stockReservations.id,
      productId: stockReservations.productId,
      quantity: stockReservations.quantity,
    })
    .from(stockReservations)
    .where(eq(stockReservations.referenceNumber, transactionNumber));

  for (const res of reservations) {
    // Decrease reserved_quantity
    await tx
      .update(productStocks)
      .set({
        reservedQuantity: sql`${productStocks.reservedQuantity} - ${res.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(eq(productStocks.productId, res.productId), eq(productStocks.warehouseId, warehouseId)),
      );
  }

  // Delete reservation records
  await tx
    .delete(stockReservations)
    .where(eq(stockReservations.referenceNumber, transactionNumber));
}

// Helper: deduct stock (dispatch)

async function deductStock(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  warehouseId: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<void> {
  for (const item of items) {
    await tx
      .update(productStocks)
      .set({
        quantity: sql`${productStocks.quantity} - ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productStocks.productId, item.productId),
          eq(productStocks.warehouseId, warehouseId),
        ),
      );
  }
}
```

Pay attention to the dispatch flow. When stock is dispatched, we deduct from `quantity` and release the reservation (decrease `reserved_quantity` and delete the reservation records). The net effect: actual stock goes down, reserved stock goes down, and available stock stays the same for other pending transactions. The math works out.

### Stock-Out Status Updates

The status update action for stock-out is the most complex piece in the entire chapter. Every transition has different side effects:

- **Draft → Pending**: create reservations
- **Pending → Approved**: no stock changes (reservations persist)
- **Approved → Dispatched**: release reservations + deduct actual stock
- **Any → Cancelled**: release reservations (if any exist)

```typescript
// src/app/dashboard/stock-out/actions/update-stock-out-status.ts

'use server';

import { eq, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import {
  transactions,
  transactionLines,
  productStocks,
  stockReservations,
  activityLogs,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { updateStockOutStatusSchema } from '@/lib/validators/stock-schemas';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'cancelled'],
  approved: ['dispatched', 'cancelled'],
  dispatched: ['cancelled'],
  cancelled: [],
};

export type UpdateStockOutStatusResult = { success: true } | { success: false; error: string };

export async function updateStockOutStatus(input: {
  id: string;
  status: string;
}): Promise<UpdateStockOutStatusResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const parsed = updateStockOutStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { id, status: newStatus } = parsed.data;

    const [txn] = await db
      .select({
        id: transactions.id,
        status: transactions.status,
        warehouseId: transactions.warehouseId,
        transactionNumber: transactions.transactionNumber,
      })
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.type, 'stock_out')))
      .limit(1);

    if (!txn) {
      return { success: false, error: 'Stock-out transaction not found.' };
    }

    const allowedNext = VALID_TRANSITIONS[txn.status] ?? [];
    if (!allowedNext.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from '${txn.status}' to '${newStatus}'.`,
      };
    }

    await db.transaction(async (tx) => {
      const oldStatus = txn.status;

      // Draft → Pending: create reservations
      if (oldStatus === 'draft' && newStatus === 'pending') {
        const lines = await tx
          .select({
            productId: transactionLines.productId,
            quantity: transactionLines.quantity,
          })
          .from(transactionLines)
          .where(eq(transactionLines.transactionId, id));

        // Verify availability before reserving
        for (const line of lines) {
          const [stock] = await tx
            .select({
              quantity: productStocks.quantity,
              reservedQuantity: productStocks.reservedQuantity,
            })
            .from(productStocks)
            .where(
              and(
                eq(productStocks.productId, line.productId),
                eq(productStocks.warehouseId, txn.warehouseId),
              ),
            )
            .limit(1);

          if (!stock) throw new Error('No stock record found.');

          const available = stock.quantity - stock.reservedQuantity;
          if (available < line.quantity) {
            throw new Error(
              `Insufficient stock. Available: ${available}, requested: ${line.quantity}.`,
            );
          }
        }

        // Create reservations
        for (const line of lines) {
          await tx.insert(stockReservations).values({
            productId: line.productId,
            warehouseId: txn.warehouseId,
            quantity: line.quantity,
            reason: 'order',
            referenceNumber: txn.transactionNumber,
            createdBy: user.id,
          });

          await tx
            .update(productStocks)
            .set({
              reservedQuantity: sql`${productStocks.reservedQuantity} + ${line.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(productStocks.productId, line.productId),
                eq(productStocks.warehouseId, txn.warehouseId),
              ),
            );
        }
      }

      // Approved → Dispatched: release reservations + deduct stock
      if (oldStatus === 'approved' && newStatus === 'dispatched') {
        const reservations = await tx
          .select({
            id: stockReservations.id,
            productId: stockReservations.productId,
            quantity: stockReservations.quantity,
          })
          .from(stockReservations)
          .where(eq(stockReservations.referenceNumber, txn.transactionNumber));

        for (const res of reservations) {
          // Deduct from actual stock
          await tx
            .update(productStocks)
            .set({
              quantity: sql`${productStocks.quantity} - ${res.quantity}`,
              reservedQuantity: sql`${productStocks.reservedQuantity} - ${res.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(productStocks.productId, res.productId),
                eq(productStocks.warehouseId, txn.warehouseId),
              ),
            );
        }

        // Delete reservation records
        await tx
          .delete(stockReservations)
          .where(eq(stockReservations.referenceNumber, txn.transactionNumber));
      }

      // Any → Cancelled: release reservations if they exist
      if (newStatus === 'cancelled') {
        const reservations = await tx
          .select({
            id: stockReservations.id,
            productId: stockReservations.productId,
            quantity: stockReservations.quantity,
          })
          .from(stockReservations)
          .where(eq(stockReservations.referenceNumber, txn.transactionNumber));

        if (reservations.length > 0) {
          for (const res of reservations) {
            await tx
              .update(productStocks)
              .set({
                reservedQuantity: sql`${productStocks.reservedQuantity} - ${res.quantity}`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(productStocks.productId, res.productId),
                  eq(productStocks.warehouseId, txn.warehouseId),
                ),
              );
          }

          await tx
            .delete(stockReservations)
            .where(eq(stockReservations.referenceNumber, txn.transactionNumber));
        }

        // If cancelling a dispatched transaction, restore stock
        if (oldStatus === 'dispatched') {
          const lines = await tx
            .select({
              productId: transactionLines.productId,
              quantity: transactionLines.quantity,
            })
            .from(transactionLines)
            .where(eq(transactionLines.transactionId, id));

          for (const line of lines) {
            await tx
              .update(productStocks)
              .set({
                quantity: sql`${productStocks.quantity} + ${line.quantity}`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(productStocks.productId, line.productId),
                  eq(productStocks.warehouseId, txn.warehouseId),
                ),
              );
          }
        }
      }

      // Update status
      await tx.update(transactions).set({ status: newStatus }).where(eq(transactions.id, id));

      // Log activity
      await tx.insert(activityLogs).values({
        userId: user.id,
        action: 'stock_out_status_updated',
        entity: 'transactions',
        recordId: id,
        oldValues: { status: oldStatus },
        newValues: { status: newStatus },
      });
    });

    revalidatePath('/dashboard/stock-out');
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
```

The dispatch transition is the most critical. It combines two operations atomically: deducting `quantity` and releasing `reservedQuantity`. Both fields on `product_stocks` change in a single UPDATE statement per item. This is intentional — we don't want a scenario where reserved quantity is released but actual quantity isn't deducted (or vice versa).

Cancelling a dispatched stock-out is rare but possible. Maybe the delivery truck returned, or the goods were rejected at the destination. In that case, we add the quantities back to `product_stocks.quantity`. No reservations to restore, because they were already cleared during dispatch.

### Deleting a Stock-Out Transaction

Deleting a stock-out is only allowed for draft and pending statuses. Approved and dispatched transactions should be cancelled, not deleted — we want the audit trail.

```typescript
// src/app/dashboard/stock-out/actions/delete-stock-out.ts

'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { transactions, stockReservations, productStocks, activityLogs } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export type DeleteStockOutResult = { success: true } | { success: false; error: string };

export async function deleteStockOut(id: string): Promise<DeleteStockOutResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const [txn] = await db
      .select({
        id: transactions.id,
        status: transactions.status,
        warehouseId: transactions.warehouseId,
        transactionNumber: transactions.transactionNumber,
      })
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.type, 'stock_out')))
      .limit(1);

    if (!txn) {
      return { success: false, error: 'Stock-out transaction not found.' };
    }

    if (!['draft', 'pending'].includes(txn.status)) {
      return {
        success: false,
        error: `Cannot delete a transaction with status '${txn.status}'. Cancel it instead.`,
      };
    }

    await db.transaction(async (tx) => {
      // Release reservations if status is pending
      if (txn.status === 'pending') {
        const reservations = await tx
          .select({
            productId: stockReservations.productId,
            quantity: stockReservations.quantity,
          })
          .from(stockReservations)
          .where(eq(stockReservations.referenceNumber, txn.transactionNumber));

        for (const res of reservations) {
          await tx
            .update(productStocks)
            .set({
              reservedQuantity: sql`${productStocks.reservedQuantity} - ${res.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(productStocks.productId, res.productId),
                eq(productStocks.warehouseId, txn.warehouseId),
              ),
            );
        }

        await tx
          .delete(stockReservations)
          .where(eq(stockReservations.referenceNumber, txn.transactionNumber));
      }

      // Delete transaction (cascade deletes transaction_lines)
      await tx.delete(transactions).where(eq(transactions.id, id));

      // Log activity
      await tx.insert(activityLogs).values({
        userId: user.id,
        action: 'stock_out_deleted',
        entity: 'transactions',
        recordId: id,
        oldValues: {
          transactionNumber: txn.transactionNumber,
          status: txn.status,
        },
      });
    });

    revalidatePath('/dashboard/stock-out');
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
```

The `ON DELETE CASCADE` on `transaction_lines.transaction_id` means deleting the transaction header automatically removes all line items. We don't need a separate delete statement for them. But reservations use `reference_number` as the link (not a foreign key to transactions), so we clean those up manually.

## Part 3: Fetching Transaction Details

Both stock-in and stock-out need a detail view that shows the transaction header, all line items with product names, and the warehouse name. The query pattern is identical — only the type filter changes.

```typescript
// src/app/dashboard/stock-in/actions/get-stock-in-by-id.ts

'use server';

import { eq, and } from 'drizzle-orm';

import { db } from '@/db';
import { transactions, transactionLines, warehouses, products, users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export interface StockInDetail {
  id: string;
  transactionNumber: string;
  type: string;
  status: string;
  warehouseId: string;
  warehouseName: string;
  sourceType: string;
  sourceName: string | null;
  referenceNumber: string | null;
  transactionDate: Date;
  notes: string | null;
  createdBy: string | null;
  creatorName: string | null;
  createdAt: Date;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: string | null;
    totalValue: string | null;
  }>;
}

export type GetStockInByIdResult =
  | { success: true; data: StockInDetail }
  | { success: false; error: string };

export async function getStockInById(id: string): Promise<GetStockInByIdResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    // Fetch header with warehouse and creator
    const [txn] = await db
      .select({
        id: transactions.id,
        transactionNumber: transactions.transactionNumber,
        type: transactions.type,
        status: transactions.status,
        warehouseId: transactions.warehouseId,
        warehouseName: warehouses.name,
        sourceType: transactions.sourceType,
        sourceName: transactions.sourceName,
        referenceNumber: transactions.referenceNumber,
        transactionDate: transactions.transactionDate,
        notes: transactions.notes,
        createdBy: transactions.createdBy,
        creatorName: users.displayName,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .innerJoin(warehouses, eq(transactions.warehouseId, warehouses.id))
      .leftJoin(users, eq(transactions.createdBy, users.id))
      .where(and(eq(transactions.id, id), eq(transactions.type, 'stock_in')))
      .limit(1);

    if (!txn) {
      return { success: false, error: 'Stock-in transaction not found.' };
    }

    // Fetch line items with product details
    const items = await db
      .select({
        id: transactionLines.id,
        productId: transactionLines.productId,
        productName: products.name,
        productSku: products.sku,
        quantity: transactionLines.quantity,
        unitPrice: transactionLines.unitPrice,
        totalValue: transactionLines.totalValue,
      })
      .from(transactionLines)
      .innerJoin(products, eq(transactionLines.productId, products.id))
      .where(eq(transactionLines.transactionId, id));

    return {
      success: true,
      data: { ...txn, items },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
```

Two queries instead of one. We could use Drizzle's relational API with `with: { lines: { with: { product: true } } }` to get everything in a single call, but the explicit join gives us more control over which columns we select. In a detail view, we want product names and SKUs but not the entire product record. Selecting specific columns keeps the response payload lean.

The `leftJoin` on users handles the case where `created_by` is null (shouldn't happen in practice, but defensive coding costs nothing). The `innerJoin` on warehouses means if the warehouse was deleted, this query returns "not found" — which is correct behavior. A transaction without a warehouse is orphaned data.

## Drizzle Patterns Worth Remembering

This chapter used several Drizzle patterns that come up repeatedly in any data-heavy application. Here's a summary.

**Upsert with onConflictDoUpdate.** Insert a row if it doesn't exist, update it if it does. The `target` parameter specifies which unique constraint to check. The `set` parameter contains the update expression. Use `sql` template literals for arithmetic operations like incrementing a counter.

```typescript
await db
  .insert(productStocks)
  .values({ productId, warehouseId, quantity: 50 })
  .onConflictDoUpdate({
    target: [productStocks.productId, productStocks.warehouseId],
    set: { quantity: sql`${productStocks.quantity} + 50` },
  });
```

**Transaction with rollback.** Wrap multiple operations in `db.transaction()`. If any operation throws, the entire transaction rolls back. The callback receives a `tx` object that has the same API as `db` — use it for all queries within the transaction.

**Aggregation with sql template.** Use `sql<number>` for type-safe aggregations. Wrap nullable aggregations in `coalesce()` to avoid null results.

```typescript
const [{ total }] = await db
  .select({ total: sql<number>`coalesce(sum(${productStocks.quantity}), 0)` })
  .from(productStocks)
  .where(eq(productStocks.warehouseId, warehouseId));
```

**Conditional WHERE clauses.** Build an array of conditions and spread them into `and()`. This pattern handles optional filters cleanly without nested ternaries.

```typescript
const conditions = [eq(transactions.type, 'stock_in')];
if (status) conditions.push(eq(transactions.status, status));
if (search) conditions.push(ilike(transactions.transactionNumber, `%${search}%`));
const rows = await db
  .select()
  .from(transactions)
  .where(and(...conditions));
```

**Discriminated union return types.** Every Server Action returns `{ success: true; data: T } | { success: false; error: string }`. The caller uses a simple `if (result.success)` check, and TypeScript narrows the type automatically. No exceptions to catch, no undefined checks.

## What Could Go Wrong

Stock operations interact with money and physical goods. Bugs here have real consequences. Here are the failure modes we've guarded against, and a few we haven't.

**Race conditions on reservation.** Two users create stock-out transactions for the same product simultaneously. Both check available stock, both see 100 units available, both try to reserve 80. Without database-level protection, both succeed, and we've promised 160 units from 100. Our mitigation: the CHECK constraint `reserved_quantity >= 0` catches the case where deductions would overshoot. For reservation creation, we rely on the transaction isolation level. Under PostgreSQL's default `READ COMMITTED`, the second transaction's UPDATE will see the first transaction's committed changes, preventing double-reservation. For stricter guarantees, you could use `SERIALIZABLE` isolation, but the performance cost is rarely justified for Inventra's scale.

**Orphaned reservations.** A stock-out is created with status "pending" (reservations created), but the transaction is never completed and never cancelled. Stock sits reserved indefinitely. We don't have automatic reservation expiry in this implementation. For a production system, add a scheduled job that cancels stock-out transactions stuck in "pending" or "approved" for more than N days, releasing their reservations.

**Decimal precision in totalValue.** The `total_value` column is `numeric(18,2)`. We calculate it in JavaScript as `quantity * unitPrice` and store the result as a string. JavaScript floating-point arithmetic can produce values like `19.990000000000002` for `9.995 * 2`. For the quantities and prices typical in warehouse management, this rounding error is below the two-decimal-place precision of the column, so PostgreSQL will round it correctly. But if you're dealing with very large quantities or very small unit prices, use a decimal library like `decimal.js` for the multiplication.

**Missing import of sql in delete action.** The delete action uses `sql` in the reservation release but may fail to import it. Always verify imports when extracting helpers from larger files. The TypeScript compiler will catch this, but only if you run it.

## What Comes Next

We have functional stock-in and stock-out modules with complete Server Actions, validation schemas, status state machines, capacity checks, and a reservation system. The business logic is solid.

What's missing is the frontend. The page components, the data tables, the modals, the forms. Chapter 10 builds the UI for these features using the same component patterns we established for products and warehouses: a page component that owns the state, a table component that displays data, and modal components for create/edit workflows. The stock-out form will include real-time availability indicators that show how much of each product is actually available (not just in stock, but accounting for reservations).

The other gap is reporting. Stock-in and stock-out data feeds into inventory valuation, turnover analysis, and reorder calculations. That's Chapter 11's territory. But the Server Actions we wrote here — particularly `getStockIn` and the detail queries — provide the data foundation those reports will build on.
