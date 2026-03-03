# Chapter 2: Feature Analysis

Let's talk about what Inventra actually does. Not at a marketing level. At a code level: what tables exist, what types define the data, what happens when a user clicks "Submit," and where things get interesting.

We'll go feature by feature, examining the type definitions, the database schema, the business rules baked into Server Actions, and the access control layer. By the end, you'll have a complete inventory of what we're working with before we start rebuilding.

## Authentication and Authorization

Inventra doesn't roll its own auth. It delegates to Supabase Auth, which handles email/password login, session tokens, and JWT validation. The app wraps this with a middleware layer in `proxy.ts` that intercepts every request and decides whether to let it through.

The middleware logic is simple. If the user has a valid Supabase session and they're hitting `/sign-in`, redirect them to `/dashboard`. If they don't have a session and they're trying to access anything under `/dashboard`, redirect them to `/sign-in`. Everything else passes through.

Once inside the dashboard, a React Context called `UserContext` loads the current user's profile from the `profiles` table:

```ts
// Simplified from contexts/UserContext.tsx
interface UserProfile {
  id: string;
  display_name: string | null;
  role: string;
  email: string;
  image_url: string | null;
}
```

The `role` field drives the authorization model. Three roles exist in the database:

| Role            | Database Value    | Capabilities                                                                                 |
| --------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| Admin           | `admin`           | Full access. Can create/delete users, manage all data, view activity logs                    |
| Manager         | `manager`         | Can create warehouses, products, categories. Can update transactions. Can view activity logs |
| Warehouse Staff | `warehouse_staff` | Read access to most tables. Cannot delete anything. Cannot view activity logs                |

There's a subtle mapping here. The TypeScript types define `UserRole = 'staff' | 'manager' | 'admin'`, but the Postgres enum uses `warehouse_staff` instead of `staff`. The Server Actions handle the translation when creating users.

Authorization happens at two levels. First, RLS policies in PostgreSQL enforce access rules on every query. Helper functions like `is_admin()` and `is_manager_or_admin()` check the user's JWT claims. Second, Server Actions perform explicit role checks before executing mutations. Every action starts with an auth check. No exceptions.

```ts
// Standard auth check pattern in every Server Action
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();
if (authError || !user) return { success: false, error: 'Unauthorized.' };
```

## User Management

Only admins can create, edit, or delete users. The Server Action for user creation uses Supabase's admin API with the service role key, bypassing RLS entirely. This is necessary because creating an auth user requires admin privileges that normal client tokens don't have.

When creating a user, the system auto-generates a 12-character alphanumeric password if none is provided. The profile record gets created automatically through a database trigger (`on_auth_user_created`) that fires on every insert to `auth.users`. The action then updates that profile with additional fields like `display_name`, `role`, `department`, and `phone`.

```ts
type CreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // auto-generated if omitted
  phone: string;
  role: UserRole; // 'staff' | 'manager' | 'admin'
  department: UserDepartment; // 'warehouse' | 'logistics' | 'hq' | 'regional'
  isActive: boolean;
  avatarFile?: File | null;
};
```

Avatar images upload to the `profile-images` storage bucket. Deletion is a two-step process: remove the avatar file from storage first, then delete the auth user. The cascade foreign key between `auth.users` and `profiles` handles cleaning up the profile record. One safety rail exists: users can't delete themselves.

The department field is worth noting. Four values map to the database enum:

| TypeScript Value | Database Enum     |
| ---------------- | ----------------- |
| `warehouse`      | `Warehouse`       |
| `logistics`      | `Logistics`       |
| `hq`             | `Headquarters`    |
| `regional`       | `Regional Office` |

Another mapping layer. The TypeScript types use shorthand values while the database stores the full labels.

## Warehouse Management

Warehouses are physical locations where inventory gets stored. Each warehouse has a type, a condition rating, a status, and an optional manager assignment.

```ts
type WarehouseTableItem = {
  id: string;
  name: string;
  location: string;
  image_url: string[]; // multiple warehouse photos
  capacity: number; // max units the warehouse can hold
  type: string; // warehouse_type enum
  condition: string | null; // condition rating
  status: 'operational' | 'under_maintenance' | 'closed' | null;
  manager_id: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  manager: WarehouseManagerSummary; // joined from profiles
};
```

The warehouse type enum in the database is more specific than you might expect:

| Warehouse Type        | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `distribution_center` | Central hub for receiving and dispatching goods |
| `fulfillment_center`  | Order picking and shipping                      |
| `cold_storage`        | Temperature-controlled storage                  |
| `bonded_warehouse`    | Customs-bonded for imported goods               |
| `cross_dock_facility` | Minimal storage, transfer between transport     |
| `retail_warehouse`    | Storage backing retail operations               |

Condition tracking uses a four-point scale: `excellent`, `good`, `fair`, `poor`. This isn't decorative. It feeds into operational decisions about where to route incoming stock.

Capacity plays a direct role in stock-in operations. When a stock-in transaction has status `received`, the Server Action checks whether the destination warehouse can absorb the incoming quantity. If current stock plus incoming quantity exceeds capacity, the transaction fails. This is one of the few hard business rules enforced at the application layer rather than in the database.

Only managers and admins can create warehouses. Only admins can delete them.

## Category Management

Categories organize products into a hierarchy. The schema supports parent-child relationships through a `parent_id` self-reference on the `categories` table.

```ts
interface SupabaseCategory {
  id: string;
  name: string;
  slug: string; // unique, URL-friendly identifier
  parent_id: string | null; // self-referencing FK
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products?: Array<{ count?: number }> | null;
}
```

The UI layer transforms this raw database shape into a richer `Category` interface that adds computed fields like `type` (derived from whether `parent_id` is null and whether `is_active` is true), icon styling properties, and a `productCount` pulled from the joined products array.

Categories use `is_active` as a boolean toggle rather than a status enum. This is simpler than what products and warehouses do, and it works fine for the use case. A category is either available for product assignment or it isn't.

The `slug` field has a unique index, which means category names need to produce distinct URL-friendly strings. The application generates these from the name, but the database enforces uniqueness as the final guard.

## Product Management

Products are the core entity. They sit at the intersection of categories, warehouses (through stock records), and transactions.

```ts
type ProductDB = {
  id: string;
  name: string;
  sku: string; // varchar(50), unique
  category_id: string | null;
  brand: string | null;
  description: string | null;
  image_url: string[]; // jsonb array, multiple images
  unit_price: number | null; // numeric(12,2)
  minimum_stock: number; // threshold for low-stock alerts
  status: ProductStatus; // 'active' | 'inactive' | 'archived'
  created_by: string;
  created_at: string;
  updated_at: string;
};
```

The `image_url` field stores a JSON array of storage URLs, enabling multi-image product listings. The form layer handles `File[]` objects, uploads them to Supabase Storage, and converts the results to URL strings before inserting into the database.

Stock levels don't live on the product record itself. They're tracked in a separate `product_stocks` table with a composite unique constraint on `(product_id, warehouse_id)`. A single product can exist in multiple warehouses with different quantities. The `ProductTableItem` type aggregates this:

```ts
interface ProductTableItem {
  // ...product fields...
  total_stock: number; // aggregated across warehouses
  product_stocks_quantity: number; // sum of product_stocks.quantity
  minimum_stock: number; // from products table
  stockStatus: StockStatus; // computed client-side
}
```

Stock status is computed by comparing `product_stocks_quantity` against `minimum_stock`. The four levels signal urgency:

| Stock Status | Meaning                         |
| ------------ | ------------------------------- |
| `critical`   | Far below minimum threshold     |
| `low`        | Below minimum threshold         |
| `good`       | Above minimum but not excessive |
| `high`       | Well above minimum threshold    |

This computation happens client-side, not in the database. That's a design choice we'll revisit in the rebuild, because it means every client recalculates the same thresholds independently.

## Stock-In Operations

Stock-in records represent inventory arriving at a warehouse. Each transaction gets a generated reference number in the format `RC-{YEAR}-{6-digit-random}`, like `RC-2026-847291`.

```ts
type StockInSourceType = 'supplier' | 'transfer' | 'return';
type StockInStatus = 'received' | 'in_transit' | 'qc_pending';

interface StockInFormData {
  reference: string;
  dateReceived: string;
  status: StockInStatus;
  sourceType: StockInSourceType;
  sourceName: string;
  destinationWarehouse: string;
  comments: string;
  items: StockInItemRow[]; // multi-line items
  existingDocuments?: string[];
}
```

The source type maps to database enum values with a translation layer:

| Form Value | Database `source_type` |
| ---------- | ---------------------- |
| `supplier` | `supplier`             |
| `transfer` | `internal_transfer`    |
| `return`   | `customer_return`      |

Each stock-in transaction contains multiple line items. Each item references a product and specifies a quantity and unit price. This is a proper transaction/line-item pattern, not a one-product-per-record approach.

The status field controls what happens to actual inventory levels. When a transaction is created with status `received`, the Server Action immediately updates the `product_stocks` table. It either inserts a new record (if the product hasn't been stocked at that warehouse before) or increments the existing quantity. For `in_transit` or `qc_pending` statuses, no stock changes happen yet. The goods aren't physically in the warehouse.

Before applying stock deltas, the action validates warehouse capacity. Total existing stock plus incoming quantity must not exceed the warehouse's `capacity` value.

Document attachments support PDF files only, with a maximum of 5 files at 5MB each. These upload to the `stockin-files` storage bucket. The reference number generation includes retry logic. If a collision occurs on the random number (unlikely but possible), the system retries up to 3 times.

## Stock-Out Operations

Stock-out is the inverse flow. Products leave a warehouse, headed to customers, other facilities, or written off as losses.

```ts
type StockOutDestinationType =
  | 'internal_transfer'
  | 'customer'
  | 'disposal'
  | 'loss'
  | 'adjustment';

type StockOutStatus = 'pending' | 'packed' | 'shipped' | 'completed' | 'cancelled';
```

Transaction numbers follow the format `SO-{YEAR}-{6-digit-random}`, like `SO-2026-159482`.

Stock-out has a more complex lifecycle than stock-in because of the reservation system. When a stock-out transaction is created with a status of `pending`, `packed`, or `shipped`, the system doesn't deduct stock immediately. Instead, it creates entries in the `stock_reservations` table and increments the `reserved_quantity` on the corresponding `product_stocks` record.

This matters. Available stock isn't just `quantity`. It's `quantity - reserved_quantity`. A warehouse might show 100 units in stock, but if 30 are reserved for pending shipments, only 70 are actually available for new outbound orders.

Stock deduction happens when the status reaches `completed`. At that point, the Server Action calls `applyQuantityDeltas` to reduce the actual quantity in `product_stocks`. The reservation records get cleaned up.

If a stock-out is `cancelled`, reservations get released and `reserved_quantity` decrements back. No stock leaves the warehouse.

The five destination types capture different reasons for outbound movement:

| Destination Type    | Use Case                                                 |
| ------------------- | -------------------------------------------------------- |
| `customer`          | Direct sales fulfillment                                 |
| `internal_transfer` | Moving stock between warehouses                          |
| `disposal`          | Damaged or expired goods removal                         |
| `loss`              | Inventory shrinkage, theft, or unaccounted missing items |
| `adjustment`        | Manual corrections to inventory counts                   |

## Dashboard and Analytics

The dashboard aggregates data from across the system into summary cards and charts. The overview stats come from a single Server Action that runs multiple queries:

Five key metrics populate the dashboard cards: total products (count of active products), new products in the last 7 days, low stock items (products where `SUM(product_stocks.quantity) < minimum_stock`), total inventory value (`SUM(quantity * unit_price)` across all products and warehouses), and active warehouses (count of warehouses with `operational` status).

The low stock calculation happens server-side here, unlike the client-side `StockStatus` computation in the product table. Two different pieces of code making the same determination in different ways. This kind of inconsistency is exactly what the rebuild aims to fix.

Inventory value is a cross-join aggregate. It multiplies each product's unit price by its total stock quantity across all warehouses and sums the result. For large inventories, this query will slow down without caching or materialized views.

The dashboard also displays recent activity through Chart.js-powered visualizations: stock level trend lines, activity timelines, and category distribution charts.

## Activity Logging

Activity logging is mostly automatic. A database trigger (`trg_log_transactions`) fires on every INSERT, UPDATE, or DELETE against the `transactions` table. It captures the operation type, the old and new row data, and the timestamp.

```sql
-- Trigger definition (simplified)
CREATE TRIGGER trg_log_transactions
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION log_transaction_activity();
```

The `activity_logs` table stores the actor (user ID), the action performed, the entity type and ID, and a JSONB `details` column for the before/after snapshot. This gives you a complete audit trail of every stock movement without any application code needing to explicitly write log entries.

Access to activity logs is restricted. Only managers and admins can read them, enforced by both RLS policies and application-level role checks. Warehouse staff can't see the audit trail.

The dashboard fetches activity logs using an admin client (service role key) to bypass RLS, then filters and formats them for display. This approach works but means the Server Action has more power than it strictly needs. A scoped query with the user's own permissions would be safer.

## Storage and File Management

Supabase Storage handles all binary file uploads across the application. Six storage buckets partition the files by purpose:

| Bucket             | Content                | Constraints                         |
| ------------------ | ---------------------- | ----------------------------------- |
| `profile-images`   | User avatar photos     | Image files                         |
| `product-images`   | Product catalog photos | Multiple per product (JSONB array)  |
| `warehouse-images` | Warehouse photos       | Multiple per warehouse              |
| `category-images`  | Category icons/images  | Single per category                 |
| `stockin-files`    | Stock-in documents     | PDF only, max 5 files, max 5MB each |
| `stockout-files`   | Stock-out documents    | PDF only                            |

File uploads happen client-side through the Supabase browser client. The resulting public URLs get stored in the relevant database records. Deletion is handled explicitly when parent records are removed. The user deletion action, for example, lists and removes all files in the user's avatar path before deleting the auth record.

There's no centralized file management service. Each feature handles its own uploads and deletions independently. The product module manages product images. The user module manages avatars. The stock-in module manages documents. This works, but it means upload logic (size validation, type checking, path construction) is duplicated across features.

## What We've Learned

Ten features. Three roles. Nine database tables. Six storage buckets. A reservation system that tracks available versus committed inventory. Automatic audit logging via triggers. Capacity enforcement on warehouses. Multi-image support on products.

The application does real work. It handles real inventory management scenarios with real business rules. But several patterns repeat across the codebase: the mapping between TypeScript enum values and database enum values, the inconsistent stock level calculations, the duplicated file upload logic, the lack of input validation before data reaches the database.

These aren't bugs. They're engineering debt. Each shortcut made sense in isolation. Together, they create a codebase that's harder to extend and riskier to maintain than it needs to be.

Chapter 3 maps the architecture that holds all of this together.
