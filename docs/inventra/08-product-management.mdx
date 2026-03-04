# Chapter 8: Product Management

Products are the center of gravity in any inventory system. Every other feature — categories, warehouses, stock-in, stock-out — exists to serve products. The products module is also the most complex CRUD feature in Inventra. It handles multi-image upload with drag-and-drop, SKU auto-generation, stock aggregation across warehouses, full-text search across multiple columns, filtering by category and status, pagination with total counts, and four stats cards that summarize the entire product catalog. There's a reason this chapter comes after categories and warehouses: we need both of those to exist before products can reference them.

Let's look at what we're replacing, why it's a problem, and how the new implementation solves it.

## What the Original Does Wrong

The current `page.tsx` is 468 lines long. It's a `'use client'` component with over a dozen `useState` calls:

```typescript
// The original products page — 12+ useState calls in one component
const [showCreateModal, setShowCreateModal] = useState(false);
const [showUpdateModal, setShowUpdateModal] = useState(false);
const [editingProduct, setEditingProduct] = useState<ProductDB | null>(null);
const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
const [deleteError, setDeleteError] = useState<string | undefined>(undefined);
const [stats, setStats] = useState<ProductStats>({ totalProducts: 0, inStock: 0, ... });
const [weeklyStockTrends, setWeeklyStockTrends] = useState<ProductStockTrendsData | undefined>(undefined);
const [monthlyStockTrends, setMonthlyStockTrends] = useState<ProductStockTrendsData | undefined>(undefined);
const [distribution, setDistribution] = useState<ProductDistributionItem[]>([]);
const [chartsLoading, setChartsLoading] = useState(false);
const [filters, setFilters] = useState<ProductFilterState>({ search: '', categories: [], status: [] });
const [currentPage, setCurrentPage] = useState(1);
```

That page component is a controller, state manager, and layout coordinator jammed into a single file. It fetches all 1,000 products at once (`limit: 1000`), filters them client-side, and paginates the results in JavaScript. Every piece of data — stats, charts, product list — starts as `null` or empty and gets populated through `useEffect` calls that fire after the component mounts.

The form architecture has its own issues. The `useProductForm` hook handles drag-and-drop, file validation, preview URLs, and form state — but validation is manual string checking. No schema. No structured error types. And the form data types use `string` for everything (price, stock), which means the server action has to parse them back to numbers.

The server actions themselves work fine from a correctness standpoint. They check auth, validate inputs, upload images, insert rows, and clean up on failure. But there's no shared validation between client and server. The client does one set of checks, the server does another, and they can disagree.

Here's what we're fixing:

| Problem          | Old approach                            | New approach                                    |
| ---------------- | --------------------------------------- | ----------------------------------------------- |
| Page complexity  | 468-line monolith with 12+ `useState`   | RSC page + thin client components               |
| Data fetching    | `useEffect` → loading spinners          | Server-side fetch, instant render               |
| Client filtering | Fetch 1,000 rows, filter in JS          | SQL `WHERE` + `ILIKE` on server                 |
| Pagination       | `Array.slice()` in the browser          | `.limit()` + `.offset()` in Drizzle             |
| Validation       | Manual string checks, no schema         | Zod 4 shared between client and server          |
| Type safety      | Hand-maintained types, `string` prices  | Drizzle-inferred types, proper numeric handling |
| Image upload     | Works, but tightly coupled to form hook | Standalone `<ImageUpload>` component            |

## Zod Schemas

We start with validation because everything else depends on it. The schema file defines what a valid product looks like, and both the form component and the server action use the exact same schemas.

```typescript
// src/app/dashboard/products/schema.ts
import { z } from 'zod/v4';

export const PRODUCT_STATUS = ['active', 'inactive', 'discontinued'] as const;

export const PRODUCT_UNITS = [
  'pcs',
  'kg',
  'liter',
  'meter',
  'box',
  'pack',
  'dozen',
  'carton',
  'pallet',
  'unit',
  'set',
  'pair',
  'roll',
  'sheet',
  'bottle',
  'can',
  'bag',
  'bundle',
  'tube',
  'other',
] as const;

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  categoryId: z.string().uuid('Invalid category').nullable(),
  brand: z.string().max(100).nullable(),
  description: z.string().max(2000).nullable(),
  unitPrice: z
    .string()
    .refine((v) => v === '' || !isNaN(Number(v)), 'Must be a valid number')
    .refine((v) => v === '' || Number(v) >= 0, 'Price cannot be negative')
    .transform((v) => (v === '' ? null : v)),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock cannot be negative'),
  status: z.enum(PRODUCT_STATUS).default('active'),
});

export const updateProductSchema = createProductSchema.extend({
  id: z.string().uuid(),
  existingImages: z.array(z.string().url()).default([]),
});

export const productFiltersSchema = z.object({
  search: z.string().default(''),
  categoryId: z.string().uuid().nullable().default(null),
  status: z.enum(PRODUCT_STATUS).nullable().default(null),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;
```

Notice that `unitPrice` stays as a string through Zod. Drizzle's `numeric(18,2)` column maps to `string` in TypeScript, and that's correct for currency values. We validate the string looks like a number, but we don't convert it to `number` because floating-point arithmetic would corrupt the precision. The transform converts empty strings to `null` since the column is nullable.

`minimumStock` uses `z.coerce.number()`. The form sends it as a string from the `<input type="number">`, and `coerce` handles the parse. This is safer than doing `parseInt()` manually — if the value isn't parseable, Zod catches it with a proper error message instead of producing `NaN`.

## Server Actions

Nine server actions in the original. We're consolidating them into a single `actions.ts` file. Each function is still individually exported, but they live together because they share imports and helper functions.

```typescript
// src/app/dashboard/products/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { and, count, eq, ilike, or, sql, sum } from 'drizzle-orm';

import { db } from '@/db';
import { products, productStocks } from '@/db/schema';
import { categories } from '@/db/schema';
import { warehouses } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createProductSchema, updateProductSchema, productFiltersSchema } from './schema';
import type { CreateProductInput, ProductFilters } from './schema';

// ── Helpers ──────────────────────────────────────────────────

function generateSku(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
  return `PRD-${random}`;
}

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

// ── Get Products (paginated, filtered) ───────────────────────

export async function getProducts(rawFilters: Partial<ProductFilters>) {
  const user = await getCurrentUser();
  if (!user) return { data: [], total: 0 };

  const filters = productFiltersSchema.parse(rawFilters);
  const { search, categoryId, status, page, limit } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.sku, `%${search}%`),
        ilike(products.brand, `%${search}%`),
      ),
    );
  }

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  if (status) {
    conditions.push(eq(products.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db.query.products.findMany({
      where,
      with: {
        category: { columns: { id: true, name: true } },
        stocks: { columns: { quantity: true, warehouseId: true } },
      },
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      limit,
      offset,
    }),
    db.select({ total: count() }).from(products).where(where),
  ]);

  const data = rows.map((row) => {
    const totalStock = row.stocks.reduce((sum, s) => sum + s.quantity, 0);
    return {
      ...row,
      totalStock,
      categoryName: row.category?.name ?? 'Uncategorized',
    };
  });

  return { data, total: totalResult[0]?.total ?? 0 };
}
```

Let's break down what changed. The original `getProducts` action used Supabase's query builder:

```typescript
// Old: Supabase string-based select
let query = supabase.from('products').select(
  `
  *, category:categories(id, name), product_stocks(quantity)
`,
  { count: 'exact' },
);

if (search) {
  query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,brand.ilike.%${search}%`);
}
```

That `or()` call takes a raw string. Misspell a column name and you get a runtime error. The Drizzle version uses `ilike(products.name, ...)` — TypeScript will catch a typo at compile time.

The pagination is also fixed. The old code fetched products with `limit: 1000` in the hook, then used `Array.slice()` for pagination. That's fine with 50 products. With 5,000, you're shipping megabytes of JSON to the browser on every page load. The new version uses SQL `LIMIT` and `OFFSET`, so the database does the work.

Here's the rest of the actions file:

```typescript
// ── Get Single Product ───────────────────────────────────────

export async function getProduct(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      category: { columns: { id: true, name: true } },
      stocks: {
        columns: { quantity: true, reservedQuantity: true },
        with: { warehouse: { columns: { id: true, name: true } } },
      },
      creator: { columns: { id: true, displayName: true } },
    },
  });
}

// ── Create Product ───────────────────────────────────────────

export async function createProduct(
  input: CreateProductInput,
  imageUrls: string[],
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, sku, categoryId, brand, description, unitPrice, minimumStock, status } =
    parsed.data;

  // Check SKU uniqueness
  const existing = await db.query.products.findFirst({
    where: eq(products.sku, sku),
    columns: { id: true },
  });

  if (existing) {
    return { success: false, error: 'A product with this SKU already exists' };
  }

  const [product] = await db
    .insert(products)
    .values({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      categoryId,
      brand: brand?.trim() || null,
      description: description?.trim() || null,
      imageUrl: imageUrls,
      unitPrice,
      minimumStock,
      status,
      createdBy: user.id,
    })
    .returning({ id: products.id });

  revalidatePath('/dashboard/products');
  return { success: true, data: { id: product.id } };
}

// ── Update Product ───────────────────────────────────────────

export async function updateProduct(
  input: unknown,
  newImageUrls: string[],
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, existingImages, ...data } = parsed.data;

  // Verify product exists
  const current = await db.query.products.findFirst({
    where: eq(products.id, id),
    columns: { id: true, sku: true, imageUrl: true },
  });

  if (!current) {
    return { success: false, error: 'Product not found' };
  }

  // Check SKU uniqueness (excluding current product)
  if (data.sku !== current.sku) {
    const skuConflict = await db.query.products.findFirst({
      where: and(eq(products.sku, data.sku), sql`${products.id} != ${id}`),
      columns: { id: true },
    });

    if (skuConflict) {
      return { success: false, error: 'A product with this SKU already exists' };
    }
  }

  const allImages = [...existingImages, ...newImageUrls];
  if (allImages.length === 0) {
    return { success: false, error: 'At least one product image is required' };
  }

  await db
    .update(products)
    .set({
      name: data.name.trim(),
      sku: data.sku.trim().toUpperCase(),
      categoryId: data.categoryId,
      brand: data.brand?.trim() || null,
      description: data.description?.trim() || null,
      imageUrl: allImages,
      unitPrice: data.unitPrice,
      minimumStock: data.minimumStock,
      status: data.status,
    })
    .where(eq(products.id, id));

  // Determine which images were removed so the caller can clean up storage
  const removedImages = (current.imageUrl ?? []).filter((url) => !existingImages.includes(url));

  revalidatePath('/dashboard/products');
  return { success: true, data: { id } };
}

// ── Delete Product ───────────────────────────────────────────

export async function deleteProduct(id: string): Promise<ActionResult<{ imageUrls: string[] }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    columns: { id: true, imageUrl: true },
  });

  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  await db.delete(products).where(eq(products.id, id));

  revalidatePath('/dashboard/products');
  return { success: true, data: { imageUrls: product.imageUrl ?? [] } };
}

// ── Stats ────────────────────────────────────────────────────

export async function getProductStats() {
  const user = await getCurrentUser();
  if (!user) return { total: 0, active: 0, lowStock: 0, outOfStock: 0 };

  const rows = await db.query.products.findMany({
    columns: { id: true, minimumStock: true, status: true },
    with: { stocks: { columns: { quantity: true } } },
  });

  let active = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const row of rows) {
    if (row.status === 'active') active++;

    const totalQty = row.stocks.reduce((sum, s) => sum + s.quantity, 0);
    if (totalQty === 0) {
      outOfStock++;
    } else if (totalQty <= row.minimumStock) {
      lowStock++;
    }
  }

  return { total: rows.length, active, lowStock, outOfStock };
}

// ── Category options (for select dropdown) ───────────────────

export async function getCategoryOptions() {
  const rows = await db.query.categories.findMany({
    columns: { id: true, name: true },
    orderBy: (c, { asc }) => [asc(c.name)],
  });

  return rows.map((r) => ({ value: r.id, label: r.name }));
}
```

The original had separate files for `get-product-stats-card.ts`, `get-category.ts`, and `get-product.ts`. Each file imported `createClient` from Supabase and repeated the same auth check pattern. Consolidating them cuts boilerplate and makes the shared `ActionResult` type available everywhere.

One thing I want to highlight about the stats function. The original fetched all products with their stock relations, then looped through them in JavaScript to calculate totals. We're doing the same thing here. You might wonder why we don't use a SQL aggregate — something like `SELECT COUNT(*) FILTER (WHERE ...)`. We could. But the stats query touches three different metrics (active count, low stock count, out of stock count) that each depend on a per-product stock sum. Doing that in pure SQL means a subquery or CTE for the stock sum, then three `FILTER` clauses on top. It's possible but harder to read than a loop over a few hundred rows. For a catalog under 10,000 products, the loop is fine.

## The Image Upload Component

This is the hardest piece. The original ProductForm had the upload logic embedded directly in the component, mixed with drag event handlers, file validation, preview URL management, and the form fields. We're pulling it out into a standalone component that any form can use.

```tsx
// src/app/dashboard/products/components/image-upload.tsx
'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { GripVertical, Trash2, Upload, X } from 'lucide-react';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

interface ImageUploadProps {
  existingImages: string[];
  onExistingImagesChange: (urls: string[]) => void;
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
  error?: string;
}

export default function ImageUpload({
  existingImages,
  onExistingImagesChange,
  newFiles,
  onNewFilesChange,
  error,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>(() =>
    newFiles.map((f) => URL.createObjectURL(f)),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const totalCount = existingImages.length + newFiles.length;
  const remaining = MAX_IMAGES - totalCount;

  const validateAndAdd = useCallback(
    (incoming: FileList | File[]) => {
      const files = Array.from(incoming);

      if (files.length > remaining) {
        setFileError(`You can only add ${remaining} more image${remaining === 1 ? '' : 's'}`);
        return;
      }

      const errors: string[] = [];
      const valid: File[] = [];

      for (const file of files) {
        if (!ACCEPTED_TYPES.has(file.type)) {
          errors.push(`${file.name}: unsupported format`);
        } else if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: exceeds 2 MB limit`);
        } else {
          valid.push(file);
        }
      }

      if (errors.length > 0) {
        setFileError(errors.join('. '));
        return;
      }

      setFileError(null);
      const newPreviews = valid.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...newPreviews]);
      onNewFilesChange([...newFiles, ...valid]);
    },
    [remaining, newFiles, onNewFilesChange],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        validateAndAdd(e.dataTransfer.files);
      }
    },
    [validateAndAdd],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        validateAndAdd(e.target.files);
      }
      e.target.value = '';
    },
    [validateAndAdd],
  );

  const removeExisting = (index: number) => {
    onExistingImagesChange(existingImages.filter((_, i) => i !== index));
  };

  const removeNew = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    onNewFilesChange(newFiles.filter((_, i) => i !== index));
  };

  const displayError = fileError || error;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Product Images ({totalCount}/{MAX_IMAGES})
        </label>
        {totalCount > 0 && remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Add more
          </button>
        )}
      </div>

      {/* Thumbnail grid */}
      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {existingImages.map((url, i) => (
            <div key={url} className="group relative aspect-square">
              <Image
                src={url}
                alt={`Product image ${i + 1}`}
                fill
                className="rounded-lg border object-cover"
                sizes="120px"
              />
              <button
                type="button"
                onClick={() => removeExisting(i)}
                className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 hidden rounded-full p-0.5 shadow group-hover:block"
              >
                <X className="size-3.5" />
              </button>
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {i + 1}
              </span>
            </div>
          ))}

          {previews.map((url, i) => (
            <div key={url} className="group relative aspect-square">
              <Image
                src={url}
                alt={`New image ${i + 1}`}
                fill
                className="rounded-lg border object-cover"
                sizes="120px"
              />
              <button
                type="button"
                onClick={() => removeNew(i)}
                className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 hidden rounded-full p-0.5 shadow group-hover:block"
              >
                <X className="size-3.5" />
              </button>
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {existingImages.length + i + 1}
              </span>
              <span className="absolute right-1 bottom-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                NEW
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {totalCount < MAX_IMAGES && (
        <label
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : displayError
                ? 'border-destructive/50 bg-destructive/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <Upload className="text-muted-foreground size-8" />
          <div>
            <p className="text-sm font-medium">Drop images here or click to browse</p>
            <p className="text-muted-foreground text-xs">
              PNG, JPG, WEBP up to 2 MB each. Maximum {MAX_IMAGES} images.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            onChange={handleInputChange}
            className="hidden"
          />
        </label>
      )}

      {displayError && <p className="text-destructive text-xs">{displayError}</p>}
    </div>
  );
}
```

There are a few deliberate choices here worth explaining.

**State ownership.** The component doesn't own the file list. The parent passes `newFiles` and `onNewFilesChange` as props. This makes the upload component a controlled input — the parent decides what happens when files are added. The only internal state is the `dragActive` flag, the `previews` array (blob URLs for display), and the `fileError` string. Preview URLs are derived from the files the parent controls.

**Memory cleanup.** Every call to `URL.createObjectURL()` allocates a browser-side blob reference. If you don't call `revokeObjectURL()` when the preview is removed, you leak memory. The original code had a `cleanup()` function that revoked all URLs at once, but it only ran when the form unmounted. Our `removeNew` function revokes immediately on removal. That's better.

**Why no reorder?** The original code had numbered badges on images but no actual reorder capability. We're keeping the same behavior. Drag-to-reorder inside a grid requires either a DnD library (`@dnd-kit/core`) or a manual pointer event implementation. It adds complexity for minimal UX value — most products have 1-3 images, and the order rarely matters.

**The `ACCEPTED_TYPES` set.** Using a `Set` for lookups is faster than `Array.includes()`. Doesn't matter at this scale, but it's a better habit. The original used an array constant and called `.includes()` inside the validation loop.

## The Product Form Dialog

The form dialog wraps the image upload component with all the other product fields. It handles both create and edit modes through a single component.

```tsx
// src/app/dashboard/products/components/product-form-dialog.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

import ImageUpload from './image-upload';
import { createProduct, updateProduct, getCategoryOptions } from '../actions';
import { createProductSchema, PRODUCT_STATUS } from '../schema';
import type { CreateProductInput } from '../schema';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: {
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
  } | null;
}

function generateSku(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
  return `PRD-${random}`;
}

export default function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const isEdit = !!product;
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [minimumStock, setMinimumStock] = useState('0');
  const [status, setStatus] = useState<'active' | 'inactive' | 'discontinued'>('active');

  // Image state
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Load categories on mount
  useEffect(() => {
    getCategoryOptions().then(setCategories);
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    setErrors({});
    setServerError(null);
    setNewFiles([]);

    if (product) {
      setName(product.name);
      setSku(product.sku);
      setCategoryId(product.categoryId);
      setBrand(product.brand ?? '');
      setDescription(product.description ?? '');
      setUnitPrice(product.unitPrice ?? '');
      setMinimumStock(String(product.minimumStock));
      setStatus(product.status);
      setExistingImages(product.imageUrl ?? []);
    } else {
      setName('');
      setSku(generateSku());
      setCategoryId(null);
      setBrand('');
      setDescription('');
      setUnitPrice('');
      setMinimumStock('0');
      setStatus('active');
      setExistingImages([]);
    }
  }, [open, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input: CreateProductInput = {
      name,
      sku,
      categoryId,
      brand: brand || null,
      description: description || null,
      unitPrice,
      minimumStock: Number(minimumStock),
      status,
    };

    // Client-side validation with Zod
    const result = createProductSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (existingImages.length + newFiles.length === 0) {
      setErrors({ images: 'At least one product image is required' });
      return;
    }

    setErrors({});
    setServerError(null);

    startTransition(async () => {
      // In a real app, upload images to storage first, then pass URLs
      // For now, we assume images are uploaded and we get back URLs
      const uploadedUrls: string[] = []; // placeholder for upload logic

      let actionResult;
      if (isEdit && product) {
        actionResult = await updateProduct(
          { ...input, id: product.id, existingImages },
          uploadedUrls,
        );
      } else {
        actionResult = await createProduct(input, [...existingImages, ...uploadedUrls]);
      }

      if (!actionResult.success) {
        setServerError(actionResult.error);
        return;
      }

      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Create Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {serverError && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {serverError}
            </div>
          )}

          <ImageUpload
            existingImages={existingImages}
            onExistingImagesChange={setExistingImages}
            newFiles={newFiles}
            onNewFilesChange={setNewFiles}
            error={errors.images}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="MacBook Pro M3"
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="PRD-ABC123"
                className="font-mono"
              />
              {errors.sku && <p className="text-destructive text-xs">{errors.sku}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId ?? ''} onValueChange={(v) => setCategoryId(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Apple Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Unit Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
              />
              {errors.unitPrice && <p className="text-destructive text-xs">{errors.unitPrice}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Product details..."
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

The `useTransition` hook is a deliberate choice over `useState(isLoading)`. Transitions mark the state update as non-urgent, which means React won't block user interaction while the server action runs. The user can still scroll or close the dialog. With a raw `useState` loading flag, you'd have to manage it manually around the async call, and if the component unmounts mid-flight, you get the classic "can't update state on unmounted component" warning.

SKU auto-generation happens once when the dialog opens in create mode. The original app tried to auto-generate SKUs from the product name and brand — `generateSKU('MacBook Pro M3', 'Apple Inc.')` would produce something like `APP-MACBOOK-PRO-X7K`. That's clever but fragile. Names change. Brands get updated. You end up with SKUs that don't match the product anymore. A random `PRD-X7K9M2` is boring but stable.

## The RSC Page

The page component is where everything comes together. It's a React Server Component that fetches data on the server and passes it down to client components.

```tsx
// src/app/dashboard/products/page.tsx
import { Suspense } from 'react';

import { getProducts, getProductStats } from './actions';
import ProductsTable from './components/products-table';
import ProductStats from './components/product-stats';
import ProductFilters from './components/product-filters';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ data: products, total }, stats] = await Promise.all([
    getProducts({
      search: params.search,
      categoryId: params.categoryId,
      status: params.status as 'active' | 'inactive' | 'discontinued' | undefined,
      page,
      limit: 10,
    }),
    getProductStats(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-muted-foreground text-sm">Manage and track your inventory items</p>
      </div>

      <ProductStats
        total={stats.total}
        active={stats.active}
        lowStock={stats.lowStock}
        outOfStock={stats.outOfStock}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <ProductsTable products={products} total={total} page={page} limit={10} />
        </div>
        <div className="xl:col-span-1">
          <ProductFilters />
        </div>
      </div>
    </div>
  );
}
```

That's it. 45 lines. Compare that to the original's 468.

The page fetches both the product list and stats in parallel using `Promise.all`. No loading spinners. No `useEffect`. No `useState`. The data is ready before the HTML reaches the browser. Search parameters come through `searchParams` (which is a `Promise` in Next.js 16), so filters and pagination are URL-driven. Users can bookmark a filtered view. They can share a link that says "show me low-stock items on page 3." The original couldn't do that — filters lived in `useState` and vanished on refresh.

## Stats Cards Component

A simple server-rendered display component. No client-side state needed.

```tsx
// src/app/dashboard/products/components/product-stats.tsx
import { Package, PackageCheck, AlertTriangle, PackageX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProductStatsProps {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
}

export default function ProductStats({ total, active, lowStock, outOfStock }: ProductStatsProps) {
  const cards = [
    { label: 'Total Products', value: total, icon: Package, color: 'text-blue-600' },
    { label: 'Active', value: active, icon: PackageCheck, color: 'text-green-600' },
    { label: 'Low Stock', value: lowStock, icon: AlertTriangle, color: 'text-amber-600' },
    { label: 'Out of Stock', value: outOfStock, icon: PackageX, color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`bg-muted rounded-lg p-2.5 ${card.color}`}>
              <card.icon className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{card.label}</p>
              <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

The original `ProductStatsCard` fetched its own data via a `useEffect` on mount and maintained its own loading state. This version receives pre-fetched data as props. It renders instantly, with zero client-side JavaScript.

## Product Filters Component

Filters manipulate URL search parameters instead of local state. This makes filters shareable, bookmarkable, and server-driven.

```tsx
// src/app/dashboard/products/components/product-filters.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

import { getCategoryOptions } from '../actions';
import { PRODUCT_STATUS } from '../schema';

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    getCategoryOptions().then(setCategories);
  }, []);

  const currentSearch = searchParams.get('search') ?? '';
  const currentCategory = searchParams.get('categoryId') ?? '';
  const currentStatus = searchParams.get('status') ?? '';

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    // Reset to page 1 when filters change
    params.delete('page');

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const clearAll = () => {
    startTransition(() => {
      router.push('?');
    });
  };

  const hasFilters = currentSearch || currentCategory || currentStatus;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="mr-1 size-3" />
            Clear
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
        <Input
          placeholder="Search name or SKU..."
          defaultValue={currentSearch}
          onChange={(e) => updateParams({ search: e.target.value || null })}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground text-xs font-medium">Category</label>
        <Select
          value={currentCategory}
          onValueChange={(v) => updateParams({ categoryId: v || null })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground text-xs font-medium">Status</label>
        <Select value={currentStatus} onValueChange={(v) => updateParams({ status: v || null })}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

Every filter change calls `router.push()` with updated query parameters. Next.js re-runs the RSC page function, which calls `getProducts` with the new filters, and streams back fresh data. The `startTransition` wrapper prevents the UI from freezing during navigation — the old filter values stay visible until new data arrives.

This is a big shift from the original. The old filters stored state in `useState` inside the page component, then ran `Array.filter()` over the entire product list. Adding a category filter didn't touch the server at all — it just narrowed the 1,000 rows the client already had. Our version pushes filtering to SQL, which is where it belongs. The database has indexes on `category_id` and `status`. Let it use them.

## Delete Confirmation

```tsx
// src/app/dashboard/products/components/delete-product-dialog.tsx
'use client';

import { useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

import { deleteProduct } from '../actions';

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string } | null;
  onDeleted?: () => void;
}

export default function DeleteProductDialog({
  open,
  onOpenChange,
  product,
  onDeleted,
}: DeleteProductDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!product) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProduct(product.id);

      if (result.success) {
        // Storage cleanup: delete orphaned images
        // In production, this would call a storage utility
        // result.data.imageUrls contains the URLs to clean up
        onOpenChange(false);
        onDeleted?.();
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{product.name}</strong> and remove all associated
            images. Stock records linked to this product will also be deleted. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

The delete dialog is straightforward, but there's one detail worth noting: image cleanup. When a product is deleted, its `image_url` array contains references to files in Supabase Storage (or whatever object store you're using). The server action deletes the database row and returns the image URLs. The client is responsible for calling the storage cleanup. We separated these concerns because storage deletion can fail independently of the database operation — you don't want to prevent a product deletion just because one image file is missing from the bucket.

The original code had `deleteProductImages` as a client-side utility that called `supabase.storage.from('product-images').remove(...)`. That pattern works but leaks storage credentials to the browser. Moving image cleanup to a server action or a background job is cleaner for production deployments.

## What We Built

Nine original files consolidated into a tighter architecture. The page went from 468 lines of client-side state management to a 45-line RSC that fetches data before the browser even gets involved. Filtering moved from JavaScript `Array.filter()` to SQL `WHERE` clauses with proper indexes. Validation went from scattered manual checks to a single Zod schema shared between client and server. The image upload component was extracted into a reusable piece that any form can consume without inheriting the product form's business logic.

The products module is the template for everything else. Stock-in and stock-out will follow the same structure: RSC page, URL-driven filters, Zod schemas, Drizzle queries, Shadcn UI dialogs. Master this pattern and the remaining features are variations on a theme.
