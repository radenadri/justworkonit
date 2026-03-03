# Chapter 4: Data Modeling

The database is the skeleton of every inventory system. Get the schema wrong and you'll fight the data model at every turn: queries that require awkward joins, business rules that can't be expressed without application-side hacks, type mismatches that slip through validation. Get it right and the rest of the application almost writes itself.

Inventra's current PostgreSQL schema, managed through Supabase migrations, works. The tables make sense. The relationships hold up under production load. But the way we interact with that schema has problems. Raw Supabase queries give us zero compile-time safety on column names. TypeScript types are hand-maintained separately from the database, and they've drifted. Enum values in the database don't match enum values in the frontend code.

We're going to fix all of that by porting the schema to Drizzle ORM. Same tables, same relationships, but with type-safe queries, schema-driven validation through Zod 4, and a single source of truth that both the database and TypeScript agree on.

## The Current Schema

Let's look at what we have. The existing Inventra database runs on PostgreSQL through Supabase, defined across two migration files. Nine tables, ten enum types, nine indexes, six triggers, and a full set of RLS policies.

### Enum Types

The database defines these custom types:

```sql
-- Roles and access
user_role:          'admin', 'manager', 'warehouse_staff'
user_department:    'Warehouse', 'Logistics', 'Headquarters', 'Regional Office'

-- Warehouse classification
warehouse_type:     'distribution_center', 'fulfillment_center', 'cold_storage',
                    'bonded_warehouse', 'cross_dock_facility', 'retail_warehouse'
warehouse_status:   'operational', 'under_maintenance', 'closed'
warehouse_condition:'excellent', 'good', 'fair', 'poor'

-- Product lifecycle
product_status:     'active', 'inactive', 'discontinued'

-- Transaction flow
transaction_type:        'stock_in', 'stock_out'
transaction_source_type: 'supplier', 'customer_return', 'internal_transfer',
                         'customer', 'disposal', 'loss', 'adjustment'
transaction_status:      'in_transit', 'qc_pending', 'received',
                         'pending', 'packed', 'shipped', 'completed', 'cancelled'

-- Reservations
stock_reservation_reason: 'order', 'transfer', 'adjustment'
```

### Tables

Here's the full table structure as it exists in the migration files:

**profiles** — linked 1:1 with Supabase `auth.users`

| Column       | Type                                 | Notes                                         |
| ------------ | ------------------------------------ | --------------------------------------------- |
| id           | uuid, PK                             | references `auth.users(id)` on delete cascade |
| email        | varchar(255), unique, not null       |                                               |
| display_name | varchar(100)                         |                                               |
| image_url    | text                                 |                                               |
| phone        | varchar(20)                          |                                               |
| department   | user_department                      |                                               |
| role         | user_role, default 'warehouse_staff' |                                               |
| is_active    | boolean, default true                |                                               |
| created_at   | timestamptz, default now()           |                                               |
| updated_at   | timestamptz, default now()           | auto-updated by trigger                       |

**warehouses** — physical storage locations

| Column                 | Type                                    | Notes                     |
| ---------------------- | --------------------------------------- | ------------------------- |
| id                     | uuid, PK, gen_random_uuid()             |                           |
| name                   | varchar(100), not null                  |                           |
| location               | varchar(255), not null                  |                           |
| image_url              | jsonb, default '[]'                     | array of image URLs       |
| capacity               | integer, not null                       |                           |
| type                   | warehouse_type, not null                |                           |
| condition              | warehouse_condition, default 'good'     |                           |
| manager_id             | uuid                                    | references profiles(id)   |
| phone                  | varchar(20)                             |                           |
| address                | text                                    |                           |
| description            | text                                    |                           |
| status                 | warehouse_status, default 'operational' |                           |
| created_by             | uuid                                    | references auth.users(id) |
| created_at, updated_at | timestamptz                             |                           |

**categories** — product classification with self-referencing hierarchy

| Column                 | Type                           | Notes                              |
| ---------------------- | ------------------------------ | ---------------------------------- |
| id                     | uuid, PK                       |                                    |
| name                   | varchar(100), not null         |                                    |
| slug                   | varchar(120), not null, unique |                                    |
| parent_id              | uuid                           | self-reference, on delete set null |
| image_url              | text                           |                                    |
| description            | text                           |                                    |
| is_active              | boolean, default true          |                                    |
| created_by             | uuid                           | references auth.users(id)          |
| created_at, updated_at | timestamptz                    |                                    |

**products** — inventory items

| Column                 | Type                             | Notes                     |
| ---------------------- | -------------------------------- | ------------------------- |
| id                     | uuid, PK                         |                           |
| name                   | varchar(100), not null           |                           |
| sku                    | varchar(50), unique, not null    |                           |
| category_id            | uuid                             | references categories(id) |
| brand                  | varchar(100)                     |                           |
| description            | text                             |                           |
| image_url              | jsonb, default '[]'              | array of image URLs       |
| unit_price             | numeric(18,2)                    |                           |
| minimum_stock          | integer, default 0               |                           |
| status                 | product_status, default 'active' |                           |
| created_by             | uuid                             | references auth.users(id) |
| created_at, updated_at | timestamptz                      |                           |

**product_stocks** — per-warehouse quantity tracking

| Column            | Type                             | Notes                                       |
| ----------------- | -------------------------------- | ------------------------------------------- |
| id                | uuid, PK                         |                                             |
| product_id        | uuid, not null                   | references products(id) on delete cascade   |
| warehouse_id      | uuid, not null                   | references warehouses(id) on delete cascade |
| quantity          | integer, default 0               |                                             |
| reserved_quantity | integer, default 0               |                                             |
| updated_at        | timestamptz                      |                                             |
|                   | unique(product_id, warehouse_id) | composite constraint                        |

**stock_reservations** — temporary holds on inventory

| Column           | Type                                      | Notes                                       |
| ---------------- | ----------------------------------------- | ------------------------------------------- |
| id               | uuid, PK                                  |                                             |
| product_id       | uuid, not null                            | references products(id) on delete cascade   |
| warehouse_id     | uuid, not null                            | references warehouses(id) on delete cascade |
| quantity         | integer, not null                         |                                             |
| reason           | stock_reservation_reason, default 'order' |                                             |
| reference_number | varchar(100)                              |                                             |
| created_by       | uuid                                      | references auth.users(id)                   |
| created_at       | timestamptz                               |                                             |

**transactions** — stock-in and stock-out header records

| Column             | Type                                     | Notes                     |
| ------------------ | ---------------------------------------- | ------------------------- |
| id                 | uuid, PK                                 |                           |
| document_url       | jsonb, default '[]'                      | attached files            |
| transaction_number | varchar(50), unique, not null            |                           |
| type               | transaction_type, not null               | 'stock_in' or 'stock_out' |
| warehouse_id       | uuid, not null                           | references warehouses(id) |
| source_type        | transaction_source_type, not null        | constrained by CHECK      |
| source_name        | varchar(100)                             |                           |
| reference_number   | varchar(100)                             |                           |
| transaction_date   | timestamptz, default now()               |                           |
| status             | transaction_status, default 'in_transit' |                           |
| notes              | text                                     |                           |
| created_by         | uuid                                     | references auth.users(id) |
| created_at         | timestamptz                              |                           |

The `transactions` table has a CHECK constraint that enforces which `source_type` values are valid for each `type`:

```sql
constraint transactions_source_matches_type check (
    (type = 'stock_in' and source_type in ('supplier','customer_return','internal_transfer'))
    or
    (type = 'stock_out' and source_type in ('customer','internal_transfer','disposal','loss','adjustment'))
)
```

This is good database design. It prevents nonsensical combinations like a stock-out from a supplier.

**transaction_lines** — individual items within a transaction

| Column         | Type              | Notes                                         |
| -------------- | ----------------- | --------------------------------------------- |
| id             | uuid, PK          |                                               |
| transaction_id | uuid, not null    | references transactions(id) on delete cascade |
| product_id     | uuid, not null    | references products(id)                       |
| quantity       | integer, not null |                                               |
| unit_price     | numeric(18,2)     |                                               |
| total_value    | numeric(18,2)     |                                               |

**activity_logs** — audit trail

| Column     | Type                   | Notes                     |
| ---------- | ---------------------- | ------------------------- |
| id         | uuid, PK               |                           |
| user_id    | uuid, not null         | references profiles(id)   |
| action     | varchar(100), not null | free-text action string   |
| entity     | varchar(50), not null  | table name                |
| record_id  | uuid                   | which record was affected |
| old_values | jsonb                  | previous state            |
| new_values | jsonb                  | new state                 |
| created_at | timestamptz            |                           |

### Entity Relationships

Here's how the tables connect:

```
profiles ──────────────────────────────────────────────────────────┐
    │                                                              │
    │ created_by                                                   │ user_id
    ├──────────── warehouses                                       │
    │                 │                                            │
    │ created_by      │ warehouse_id                               │
    ├──────────── categories      ┌──── product_stocks ◄───┐      │
    │                 │           │         │               │      │
    │ created_by      │ category_id        │ product_id    │      │
    ├──────────── products ───────┘         │               │      │
    │                 │                     │               │      │
    │ created_by      │ product_id          │ warehouse_id  │      │
    ├──────────── transactions ─────────────┘               │      │
    │                 │                                     │      │
    │                 │ transaction_id                      │      │
    │                 └──── transaction_lines               │      │
    │                                                      │      │
    │ created_by                                           │      │
    └──────────── stock_reservations ──────────────────────┘      │
                                                                   │
                  activity_logs ───────────────────────────────────┘
```

### What's Wrong

The schema design is solid. Nine well-normalized tables with proper foreign keys. But there are concrete problems we need to fix.

**Type divergences between database and TypeScript.** The database defines `user_role` as `'admin' | 'manager' | 'warehouse_staff'`, but the TypeScript `UserRole` type uses `'admin' | 'manager' | 'staff'`. The database has `user_department` with values like `'Warehouse'` and `'Headquarters'` (PascalCase), while TypeScript uses `'warehouse'` and `'hq'` (lowercase abbreviated). The database defines `product_status` as `'active' | 'inactive' | 'discontinued'`, but the frontend TypeScript type uses `'active' | 'inactive' | 'archived'`. These mismatches exist because the types were defined independently. Nobody enforces that they stay in sync.

**No single source of truth.** TypeScript interfaces like `ProductDB`, `WarehouseTableItem`, and `SupabaseCategory` are all hand-written in separate files under each feature's `types/` directory. When a migration changes a column, someone has to remember to update the TypeScript type too. They often don't.

**Supabase auth coupling.** The `profiles` table references `auth.users(id)`, which is a Supabase-internal table. Moving to any other auth system means rewriting the foreign key relationship and the auto-profile-creation trigger. We want profiles to be self-contained.

**RLS at the database layer.** Row-Level Security policies are powerful, but they make the data access layer opaque. A query that works for an admin silently returns empty for a warehouse worker, with no error message explaining why. Moving authorization to the application layer gives us explicit error handling and testable permission checks.

**Free-text action column in activity_logs.** The `action` column is `varchar(100)`, not an enum. Any string can go in. The trigger uses values like `'STOCK_IN_CREATED'` and `'STOCK_OUT_STATUS_UPDATED'`, but nothing prevents someone from inserting `'whatever'` through a direct query.

## Redesigning with Drizzle ORM

We'll keep the same nine-table structure. It works well for the domain. What changes is how we define it, how we query it, and how we validate data flowing in and out.

Here are the design decisions for the new schema:

**Keep all nine tables.** The normalization is correct. Products have stocks per warehouse. Transactions have line items. Activity logs track changes. Nothing needs to be merged or split.

**Fix every type divergence.** The Drizzle schema becomes the single source of truth. TypeScript types are inferred from it using `$inferSelect` and `$inferInsert`. If the database says `warehouse_staff`, the TypeScript type says `warehouse_staff`. Period.

**Decouple from Supabase auth.** The `profiles` table becomes `users` with its own `id` primary key (still uuid). No foreign key to `auth.users`. Auth will be handled at the application layer in Chapter 6.

**Add a password hash column.** Since we're building our own auth, users need a `password_hash` column. Supabase handled this internally before.

**Convert boolean status fields to enums.** The current schema uses `is_active boolean` on profiles and categories. That works for two states, but if we ever need a third state (like `suspended` for users), a boolean won't cut it. Enums are more expressive and barely cost anything extra.

**Make activity_logs.action an enum.** No more free-text. Every action value is defined in the schema.

**Add Zod schemas via drizzle-zod.** Every table gets `createInsertSchema` and `createSelectSchema` calls that generate Zod 4 validation schemas. Server Actions will use these for runtime validation.

**Keep the CHECK constraint on transactions.** The source_type/type validation stays at the database level. Application-level validation too, but the database constraint is a safety net worth keeping.

### File Structure

The Drizzle schema lives in `src/db/schema/`, split by domain:

```
src/db/
├── index.ts                    # Drizzle client + connection
└── schema/
    ├── enums.ts                # All pgEnum definitions
    ├── users.ts                # Users table (replaces profiles)
    ├── warehouses.ts           # Warehouses table
    ├── categories.ts           # Categories table
    ├── products.ts             # Products + product_stocks tables
    ├── transactions.ts         # Transactions + transaction_lines + stock_reservations
    ├── activity-logs.ts        # Activity logs table
    └── index.ts                # Barrel export
```

## The Drizzle Schema

### `src/db/schema/enums.ts`

```typescript
import { pgEnum } from 'drizzle-orm/pg-core';

// ── User enums ───────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'warehouse_staff']);

export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);

export const userDepartmentEnum = pgEnum('user_department', [
  'warehouse',
  'logistics',
  'headquarters',
  'regional_office',
]);

// ── Warehouse enums ──────────────────────────────────────────
export const warehouseTypeEnum = pgEnum('warehouse_type', [
  'distribution_center',
  'fulfillment_center',
  'cold_storage',
  'bonded_warehouse',
  'cross_dock_facility',
  'retail_warehouse',
]);

export const warehouseStatusEnum = pgEnum('warehouse_status', [
  'operational',
  'under_maintenance',
  'closed',
]);

export const warehouseConditionEnum = pgEnum('warehouse_condition', [
  'excellent',
  'good',
  'fair',
  'poor',
]);

// ── Product enums ────────────────────────────────────────────
export const productStatusEnum = pgEnum('product_status', ['active', 'inactive', 'discontinued']);

// ── Category enums ───────────────────────────────────────────
export const categoryStatusEnum = pgEnum('category_status', ['active', 'inactive']);

// ── Transaction enums ────────────────────────────────────────
export const transactionTypeEnum = pgEnum('transaction_type', ['stock_in', 'stock_out']);

export const transactionSourceTypeEnum = pgEnum('transaction_source_type', [
  'supplier',
  'customer_return',
  'internal_transfer',
  'customer',
  'disposal',
  'loss',
  'adjustment',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'in_transit',
  'qc_pending',
  'received',
  'pending',
  'packed',
  'shipped',
  'completed',
  'cancelled',
]);

// ── Reservation enums ────────────────────────────────────────
export const stockReservationReasonEnum = pgEnum('stock_reservation_reason', [
  'order',
  'transfer',
  'adjustment',
]);

// ── Activity log enums ───────────────────────────────────────
export const activityActionEnum = pgEnum('activity_action', [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'status_change',
  'stock_in_created',
  'stock_in_updated',
  'stock_in_status_updated',
  'stock_in_deleted',
  'stock_out_created',
  'stock_out_updated',
  'stock_out_status_updated',
  'stock_out_deleted',
  'approve',
  'reject',
  'receive',
  'dispatch',
  'cancel',
]);
```

We fixed the department enum values: `'Warehouse'` becomes `'warehouse'`, `'Headquarters'` becomes `'headquarters'`, `'Regional Office'` becomes `'regional_office'`. Consistent snake_case everywhere. The activity action enum now contains every value the trigger function uses, plus general CRUD actions.

### `src/db/schema/users.ts`

```typescript
import { relations, sql } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';

import { userDepartmentEnum, userRoleEnum, userStatusEnum } from './enums';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    displayName: varchar('display_name', { length: 100 }),
    imageUrl: text('image_url'),
    phone: varchar('phone', { length: 20 }),
    department: userDepartmentEnum('department'),
    role: userRoleEnum('role').notNull().default('warehouse_staff'),
    status: userStatusEnum('status').notNull().default('active'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_role_idx').on(table.role),
    index('users_status_idx').on(table.status),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  warehouses: many(warehouses),
  managedWarehouses: many(warehouses, { relationName: 'manager' }),
  categories: many(categories),
  products: many(products),
  transactions: many(transactions),
  activityLogs: many(activityLogs),
  stockReservations: many(stockReservations),
}));

// We forward-declare these to avoid circular imports.
// The actual table definitions are in their own files.
// Relations are resolved at runtime by Drizzle, so
// we import the tables in the barrel export (index.ts).
import { warehouses } from './warehouses';
import { categories } from './categories';
import { products } from './products';
import { transactions } from './transactions';
import { activityLogs } from './activity-logs';
import { stockReservations } from './transactions';

// ── Zod schemas ──────────────────────────────────────────────
export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email(),
  passwordHash: (schema) => schema.min(1),
  displayName: (schema) => schema.max(100),
  phone: (schema) => schema.max(20),
});

// ── Inferred types ───────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

A few things worth noting. The `is_active` boolean is gone, replaced by the `userStatusEnum` with three values: `active`, `inactive`, `suspended`. We added `passwordHash` since we're handling auth ourselves now. The `$onUpdate` on `updatedAt` replicates the old trigger behavior at the ORM level. And `lastLoginAt` gives us a column for tracking the last sign-in without polluting the activity log.

### `src/db/schema/warehouses.ts`

```typescript
import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';

import { warehouseConditionEnum, warehouseStatusEnum, warehouseTypeEnum } from './enums';
import { users } from './users';
import { productStocks } from './products';
import { transactions } from './transactions';
import { stockReservations } from './transactions';

export const warehouses = pgTable(
  'warehouses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    imageUrl: jsonb('image_url').$type<string[]>().notNull().default([]),
    capacity: integer('capacity').notNull(),
    type: warehouseTypeEnum('type').notNull(),
    condition: warehouseConditionEnum('condition').default('good'),
    managerId: uuid('manager_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    phone: varchar('phone', { length: 20 }),
    address: text('address'),
    description: text('description'),
    status: warehouseStatusEnum('status').notNull().default('operational'),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('warehouses_name_idx').on(table.name),
    index('warehouses_status_idx').on(table.status),
    index('warehouses_type_idx').on(table.type),
    index('warehouses_manager_id_idx').on(table.managerId),
  ],
);

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  manager: one(users, {
    fields: [warehouses.managerId],
    references: [users.id],
    relationName: 'manager',
  }),
  creator: one(users, {
    fields: [warehouses.createdBy],
    references: [users.id],
  }),
  productStocks: many(productStocks),
  transactions: many(transactions),
  stockReservations: many(stockReservations),
}));

// ── Zod schemas ──────────────────────────────────────────────
export const selectWarehouseSchema = createSelectSchema(warehouses);
export const insertWarehouseSchema = createInsertSchema(warehouses, {
  name: (schema) => schema.min(1).max(100),
  location: (schema) => schema.min(1).max(255),
  capacity: (schema) => schema.min(0),
});

// ── Inferred types ───────────────────────────────────────────
export type Warehouse = typeof warehouses.$inferSelect;
export type NewWarehouse = typeof warehouses.$inferInsert;
```

The `image_url` column uses `jsonb` typed as `string[]`. The old schema stored image URLs this way too. Drizzle's `$type<>()` method tells TypeScript exactly what shape the JSON data takes, so we get autocomplete and type checking on array operations.

### `src/db/schema/categories.ts`

```typescript
import { relations } from 'drizzle-orm';
import {
  type AnyPgColumn,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';

import { categoryStatusEnum } from './enums';
import { users } from './users';
import { products } from './products';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'set null',
    }),
    imageUrl: text('image_url'),
    description: text('description'),
    status: categoryStatusEnum('status').notNull().default('active'),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('categories_name_idx').on(table.name),
    uniqueIndex('categories_slug_uniq').on(table.slug),
    index('categories_parent_id_idx').on(table.parentId),
    index('categories_status_idx').on(table.status),
  ],
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories',
  }),
  subcategories: many(categories, { relationName: 'subcategories' }),
  products: many(products),
  creator: one(users, {
    fields: [categories.createdBy],
    references: [users.id],
  }),
}));

// ── Zod schemas ──────────────────────────────────────────────
export const selectCategorySchema = createSelectSchema(categories);
export const insertCategorySchema = createInsertSchema(categories, {
  name: (schema) => schema.min(1).max(100),
  slug: (schema) => schema.min(1).max(120),
});

// ── Inferred types ───────────────────────────────────────────
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
```

The self-referencing `parentId` column uses `AnyPgColumn` as its return type annotation. Drizzle requires this for self-referencing foreign keys because the table isn't fully defined at the point where the reference is declared. The `subcategories` relation gives us tree traversal: load a category and its children in one query.

We replaced `is_active boolean` with `categoryStatusEnum`. Right now it only has two values (`active`, `inactive`), which is functionally identical to a boolean. But it's more readable in queries: `where(eq(categories.status, 'active'))` beats `where(eq(categories.isActive, true))`. And if we ever need an `archived` state, we just add it to the enum without a migration that changes column types.

### `src/db/schema/products.ts`

```typescript
import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';

import { productStatusEnum } from './enums';
import { users } from './users';
import { categories } from './categories';
import { warehouses } from './warehouses';
import { transactionLines } from './transactions';

// ── Products ─────────────────────────────────────────────────
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    sku: varchar('sku', { length: 50 }).notNull().unique(),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    brand: varchar('brand', { length: 100 }),
    description: text('description'),
    imageUrl: jsonb('image_url').$type<string[]>().notNull().default([]),
    unitPrice: numeric('unit_price', { precision: 18, scale: 2 }),
    minimumStock: integer('minimum_stock').notNull().default(0),
    status: productStatusEnum('status').notNull().default('active'),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('products_category_id_idx').on(table.categoryId),
    index('products_status_idx').on(table.status),
    index('products_created_by_idx').on(table.createdBy),
  ],
);

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  creator: one(users, {
    fields: [products.createdBy],
    references: [users.id],
  }),
  stocks: many(productStocks),
  transactionLines: many(transactionLines),
}));

// ── Product Stocks ───────────────────────────────────────────
export const productStocks = pgTable(
  'product_stocks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(0),
    reservedQuantity: integer('reserved_quantity').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('product_stocks_product_warehouse_uniq').on(table.productId, table.warehouseId),
    index('product_stocks_product_id_idx').on(table.productId),
    index('product_stocks_warehouse_id_idx').on(table.warehouseId),
    check('quantity_non_negative', sql`${table.quantity} >= 0`),
    check('reserved_quantity_non_negative', sql`${table.reservedQuantity} >= 0`),
  ],
);

export const productStocksRelations = relations(productStocks, ({ one }) => ({
  product: one(products, {
    fields: [productStocks.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [productStocks.warehouseId],
    references: [warehouses.id],
  }),
}));

// ── Zod schemas ──────────────────────────────────────────────
export const selectProductSchema = createSelectSchema(products);
export const insertProductSchema = createInsertSchema(products, {
  name: (schema) => schema.min(1).max(100),
  sku: (schema) => schema.min(1).max(50),
  minimumStock: (schema) => schema.min(0),
});

export const selectProductStockSchema = createSelectSchema(productStocks);
export const insertProductStockSchema = createInsertSchema(productStocks, {
  quantity: (schema) => schema.min(0),
  reservedQuantity: (schema) => schema.min(0),
});

// ── Inferred types ───────────────────────────────────────────
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductStock = typeof productStocks.$inferSelect;
export type NewProductStock = typeof productStocks.$inferInsert;
```

Two CHECK constraints on `product_stocks` enforce that `quantity` and `reserved_quantity` can never go negative. The old schema had a single check on quantity. We added one for reserved quantity too, because a negative reservation makes no sense and would indicate a bug in the stock-out logic.

The `unitPrice` column uses `numeric(18,2)`. Drizzle maps this to `string` in TypeScript by default, which is correct. Floating-point arithmetic is unreliable for money. You parse the string into a decimal library when you need to compute, and store the result back as a string. Don't fight this with type casting.

### `src/db/schema/transactions.ts`

```typescript
import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';

import {
  stockReservationReasonEnum,
  transactionSourceTypeEnum,
  transactionStatusEnum,
  transactionTypeEnum,
} from './enums';
import { users } from './users';
import { warehouses } from './warehouses';
import { products } from './products';

// ── Transactions ─────────────────────────────────────────────
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentUrl: jsonb('document_url').$type<string[]>().notNull().default([]),
    transactionNumber: varchar('transaction_number', { length: 50 }).notNull().unique(),
    type: transactionTypeEnum('type').notNull(),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    sourceType: transactionSourceTypeEnum('source_type').notNull(),
    sourceName: varchar('source_name', { length: 100 }),
    referenceNumber: varchar('reference_number', { length: 100 }),
    transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull().defaultNow(),
    status: transactionStatusEnum('status').notNull().default('in_transit'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('transactions_warehouse_id_idx').on(table.warehouseId),
    index('transactions_created_by_idx').on(table.createdBy),
    index('transactions_transaction_date_idx').on(table.transactionDate),
    index('transactions_type_idx').on(table.type),
    index('transactions_status_idx').on(table.status),
    check(
      'transactions_source_matches_type',
      sql`(
        ${table.type} = 'stock_in'
        AND ${table.sourceType} IN ('supplier', 'customer_return', 'internal_transfer')
      ) OR (
        ${table.type} = 'stock_out'
        AND ${table.sourceType} IN ('customer', 'internal_transfer', 'disposal', 'loss', 'adjustment')
      )`,
    ),
  ],
);

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [transactions.warehouseId],
    references: [warehouses.id],
  }),
  creator: one(users, {
    fields: [transactions.createdBy],
    references: [users.id],
  }),
  lines: many(transactionLines),
}));

// ── Transaction Lines ────────────────────────────────────────
export const transactionLines = pgTable(
  'transaction_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 18, scale: 2 }),
    totalValue: numeric('total_value', { precision: 18, scale: 2 }),
  },
  (table) => [
    index('transaction_lines_transaction_id_idx').on(table.transactionId),
    index('transaction_lines_product_id_idx').on(table.productId),
    check('quantity_positive', sql`${table.quantity} > 0`),
  ],
);

export const transactionLinesRelations = relations(transactionLines, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionLines.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionLines.productId],
    references: [products.id],
  }),
}));

// ── Stock Reservations ───────────────────────────────────────
export const stockReservations = pgTable(
  'stock_reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    reason: stockReservationReasonEnum('reason').notNull().default('order'),
    referenceNumber: varchar('reference_number', { length: 100 }),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('stock_reservations_ref_idx').on(table.referenceNumber),
    index('stock_reservations_created_by_idx').on(table.createdBy),
    index('stock_reservations_product_id_idx').on(table.productId),
    index('stock_reservations_warehouse_id_idx').on(table.warehouseId),
    check('reservation_quantity_positive', sql`${table.quantity} > 0`),
  ],
);

export const stockReservationsRelations = relations(stockReservations, ({ one }) => ({
  product: one(products, {
    fields: [stockReservations.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [stockReservations.warehouseId],
    references: [warehouses.id],
  }),
  creator: one(users, {
    fields: [stockReservations.createdBy],
    references: [users.id],
  }),
}));

// ── Zod schemas ──────────────────────────────────────────────
export const selectTransactionSchema = createSelectSchema(transactions);
export const insertTransactionSchema = createInsertSchema(transactions, {
  transactionNumber: (schema) => schema.min(1).max(50),
  sourceName: (schema) => schema.max(100),
  referenceNumber: (schema) => schema.max(100),
});

export const selectTransactionLineSchema = createSelectSchema(transactionLines);
export const insertTransactionLineSchema = createInsertSchema(transactionLines, {
  quantity: (schema) => schema.min(1),
});

export const selectStockReservationSchema = createSelectSchema(stockReservations);
export const insertStockReservationSchema = createInsertSchema(stockReservations, {
  quantity: (schema) => schema.min(1),
});

// ── Inferred types ───────────────────────────────────────────
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionLine = typeof transactionLines.$inferSelect;
export type NewTransactionLine = typeof transactionLines.$inferInsert;
export type StockReservation = typeof stockReservations.$inferSelect;
export type NewStockReservation = typeof stockReservations.$inferInsert;
```

The CHECK constraint on `transactions` is the same logic as the old SQL, just expressed through Drizzle's `check()` helper. If someone tries to insert a stock-in with `source_type = 'customer'`, PostgreSQL will reject it before our application code even sees the result. Defense in depth.

We added a `quantity_positive` check to `transaction_lines` that the old schema didn't have. A transaction line with zero or negative quantity is meaningless. Same for stock reservations.

The `totalValue` column on `transaction_lines` is stored, not computed. The old schema had it as a regular column too. You might wonder why we don't use a generated column (`quantity * unit_price`). Two reasons. First, `unit_price` is nullable because some internal transfers don't have a monetary value. A generated column would produce `null * quantity = null`, which is technically correct but makes aggregation queries more annoying. Second, the application sometimes needs to override the total for discount or adjustment scenarios. A stored column gives us that flexibility.

### `src/db/schema/activity-logs.ts`

```typescript
import { relations } from 'drizzle-orm';
import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';

import { activityActionEnum } from './enums';
import { users } from './users';

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    action: activityActionEnum('action').notNull(),
    entity: varchar('entity', { length: 50 }).notNull(),
    recordId: uuid('record_id'),
    oldValues: jsonb('old_values').$type<Record<string, unknown>>(),
    newValues: jsonb('new_values').$type<Record<string, unknown>>(),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('activity_logs_user_id_idx').on(table.userId),
    index('activity_logs_entity_record_idx').on(table.entity, table.recordId),
    index('activity_logs_action_idx').on(table.action),
    index('activity_logs_created_at_idx').on(table.createdAt),
  ],
);

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// ── Zod schemas ──────────────────────────────────────────────
export const selectActivityLogSchema = createSelectSchema(activityLogs);
export const insertActivityLogSchema = createInsertSchema(activityLogs);

// ── Inferred types ───────────────────────────────────────────
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
```

The `action` column is now an enum instead of a free-text varchar. Every allowed action value is defined in `activityActionEnum`. If we try to insert an action that doesn't exist in the enum, both TypeScript (at compile time) and PostgreSQL (at insert time) will reject it.

We added `ipAddress` with `varchar(45)`, which accommodates both IPv4 (`15 chars max`) and IPv6 (`39 chars max` in full notation, `45 chars max` with IPv4-mapped prefix). The old schema didn't track IP addresses. For an audit log, knowing where an action originated from is worth the storage.

### `src/db/schema/index.ts`

```typescript
// ── Enums ────────────────────────────────────────────────────
export {
  userRoleEnum,
  userStatusEnum,
  userDepartmentEnum,
  warehouseTypeEnum,
  warehouseStatusEnum,
  warehouseConditionEnum,
  productStatusEnum,
  categoryStatusEnum,
  transactionTypeEnum,
  transactionSourceTypeEnum,
  transactionStatusEnum,
  stockReservationReasonEnum,
  activityActionEnum,
} from './enums';

// ── Tables ───────────────────────────────────────────────────
export { users, usersRelations } from './users';
export { warehouses, warehousesRelations } from './warehouses';
export { categories, categoriesRelations } from './categories';
export { products, productsRelations, productStocks, productStocksRelations } from './products';
export {
  transactions,
  transactionsRelations,
  transactionLines,
  transactionLinesRelations,
  stockReservations,
  stockReservationsRelations,
} from './transactions';
export { activityLogs, activityLogsRelations } from './activity-logs';

// ── Zod schemas ──────────────────────────────────────────────
export { selectUserSchema, insertUserSchema } from './users';
export { selectWarehouseSchema, insertWarehouseSchema } from './warehouses';
export { selectCategorySchema, insertCategorySchema } from './categories';
export {
  selectProductSchema,
  insertProductSchema,
  selectProductStockSchema,
  insertProductStockSchema,
} from './products';
export {
  selectTransactionSchema,
  insertTransactionSchema,
  selectTransactionLineSchema,
  insertTransactionLineSchema,
  selectStockReservationSchema,
  insertStockReservationSchema,
} from './transactions';
export { selectActivityLogSchema, insertActivityLogSchema } from './activity-logs';

// ── Inferred types ───────────────────────────────────────────
export type { User, NewUser } from './users';
export type { Warehouse, NewWarehouse } from './warehouses';
export type { Category, NewCategory } from './categories';
export type { Product, NewProduct, ProductStock, NewProductStock } from './products';
export type {
  Transaction,
  NewTransaction,
  TransactionLine,
  NewTransactionLine,
  StockReservation,
  NewStockReservation,
} from './transactions';
export type { ActivityLog, NewActivityLog } from './activity-logs';
```

This barrel file is the single import point for the entire schema. Any Server Action, any query, any validation can import from `@/db/schema` and get tables, relations, Zod schemas, and TypeScript types. No more hunting through feature-specific type files.

### `src/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const db = drizzle(process.env.DATABASE_URL, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export type Database = typeof db;
```

The Drizzle client setup is short. That's intentional. The `drizzle()` function accepts a connection string and returns a typed database instance. Passing the full `schema` object enables Drizzle's relational query API, which lets us write queries like:

```typescript
const product = await db.query.products.findFirst({
  where: eq(products.id, productId),
  with: {
    category: true,
    stocks: {
      with: { warehouse: true },
    },
  },
});
```

That single call fetches a product with its category and all warehouse stock levels. With the old Supabase client, that required manually constructing a select string like `'id, name, category:categories(id, name), product_stocks(quantity, warehouse:warehouses(id, name))'`. The Drizzle version is type-safe, autocomplete-friendly, and won't silently break if we rename a column.

The `logger: true` option in development prints every SQL query to the console. Useful for spotting N+1 problems and verifying that Drizzle generates the SQL you expect. It gets turned off in production.

## What Changed, What Stayed, and Why

Let's summarize the differences between the old Supabase schema and the new Drizzle schema.

**Stayed the same:** Nine tables. Same relationships. Same composite unique constraint on `product_stocks`. Same CHECK constraint on `transactions` for source type validation. Same index coverage. The domain model didn't change because it was already correct.

**Changed:**

| What                        | Old                             | New                             | Reason                                   |
| --------------------------- | ------------------------------- | ------------------------------- | ---------------------------------------- |
| User table name             | `profiles`                      | `users`                         | Self-contained, no auth.users dependency |
| Auth link                   | FK to `auth.users(id)`          | Independent `id` column         | Decouples from Supabase                  |
| Password storage            | Handled by Supabase Auth        | `password_hash` column          | Custom auth in Chapter 6                 |
| `is_active` boolean         | On profiles, categories         | `status` enum                   | More expressive, extensible              |
| Department values           | `'Warehouse'`, `'Headquarters'` | `'warehouse'`, `'headquarters'` | Consistent snake_case                    |
| User role `'staff'`         | In TypeScript only              | `'warehouse_staff'` everywhere  | Matches database                         |
| Product status `'archived'` | In TypeScript only              | `'discontinued'` everywhere     | Matches database                         |
| Activity action column      | `varchar(100)` free-text        | `activityActionEnum`            | Type-safe, constrained                   |
| IP tracking                 | Not tracked                     | `ip_address` column             | Better audit trail                       |
| Type definitions            | Hand-maintained per feature     | Inferred via `$inferSelect`     | Single source of truth                   |
| Validation                  | None                            | Zod schemas via drizzle-zod     | Runtime safety                           |
| Updated_at triggers         | PostgreSQL triggers             | Drizzle `$onUpdate`             | ORM-level, portable                      |
| RLS policies                | Database layer                  | Removed (moved to app layer)    | Explicit, testable                       |

The RLS removal deserves a note. We're not saying RLS is bad. It's an excellent security layer for multi-tenant apps where you can't trust the application layer. But Inventra has a single tenant, and every data access goes through Server Actions we control. Moving permission checks to the application layer means we can write tests for authorization, return clear error messages when access is denied, and avoid the confusion of queries that silently return empty result sets.

The updated_at trigger replacement is a pragmatic choice. PostgreSQL triggers work fine, but they're invisible to the TypeScript compiler and to anyone reading the ORM code. Drizzle's `$onUpdate` callback does the same thing and appears right in the column definition where you'd expect to find it.

## What Comes Next

We have a complete, runnable Drizzle schema that matches Inventra's domain model. Every table, every index, every constraint is defined in TypeScript. Types are inferred, not hand-written. Zod schemas are generated, not manually maintained. The database and TypeScript finally agree on what the data looks like.

Chapter 5 will scaffold the new project: setting up Bun, wiring Next.js 16 to Drizzle, running the initial migration, and verifying that the schema creates the correct tables in PostgreSQL. We'll also install Shadcn UI and configure the project structure that'll carry us through the rest of the book.
