# Chapter 7: Core Modules

Chapter 6 gave us authentication. Users can sign in, sessions persist across requests, and middleware redirects unauthenticated visitors. But a dashboard with nothing to manage isn't much of a dashboard. Time to build actual features.

Categories and warehouses are the right place to start. They're the simplest CRUD modules in Inventra: no complex business rules, no cross-table calculations, no multi-step workflows. Products depend on categories. Stock transactions depend on warehouses. So these two must exist before anything else can.

More importantly, these modules establish the pattern every subsequent feature will follow. Get the structure right here, and chapters 8 and 9 become a matter of filling in business logic rather than inventing architecture. Get it wrong, and we'll be refactoring under pressure when product images and stock reservations demand attention.

Here's the pattern we're building toward: a React Server Component page fetches data through Drizzle, passes it to a client component that renders a Shadcn table, and dialog forms call Server Actions validated by Zod. That's the entire stack in one sentence. The rest of this chapter is the implementation.

## The Module Template

Before touching any code, let's define the file structure that every CRUD module will follow. The original Inventra scattered its concerns across `actions/`, `components/`, `form/`, `hooks/`, `lib/`, and `types/` directories inside each feature. That worked, but it created a lot of files for simple operations. A category's create action lived in `actions/create-category.ts`, its read action in `actions/get-categories.ts`, and so on — six files just for server actions on a table with four columns.

We're consolidating. Each module gets this structure:

```
src/app/dashboard/<feature>/
├── page.tsx                           # RSC — data fetching, no client hooks
├── actions.ts                         # All server actions in one file
├── schema.ts                          # Zod validation schemas
└── components/
    ├── <feature>-table.tsx            # Client component — table + filters
    ├── <feature>-form-dialog.tsx      # Create and edit dialog
    └── delete-<feature>-dialog.tsx    # Deletion confirmation
```

Five files plus a components directory. That's it. One action file instead of six. One schema file instead of spreading validation across form hooks and action files. The page is a Server Component, the table and dialogs are client components. Clear separation without the ceremony.

Why not one action per file? The original Inventra's approach had a good argument: each file has a single responsibility. But in practice, these actions share imports (`db`, `schema`, `revalidatePath`, the auth helper) and share types (the discriminated union result type). Splitting them means repeating those imports across six files, and navigating between them when debugging a flow that touches create-then-read. A single `actions.ts` file under 200 lines is easy to scan. If an action grows beyond 50 lines, that's a sign the business logic should be extracted into a utility — not that the file needs splitting.

## Categories

### The Schema File

Start with validation. Zod schemas define what the server accepts, and we can derive TypeScript types from them. This gives us a single source of truth for form validation and server-side checks.

```typescript
// src/app/dashboard/categories/schema.ts
import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
```

Notice we don't include `imageUrl` in this schema. File uploads go through `FormData`, not JSON. The form schema validates the text fields; the action handles the file separately. Mixing file validation into a Zod object schema creates awkward workarounds since `z.instanceof(File)` doesn't serialize across the server boundary.

The slug field has a regex constraint. We could auto-generate slugs from names on the server (and we will), but the form still lets users customize slugs for SEO purposes. The regex ensures they can't sneak in spaces or uppercase characters.

### Server Actions

Here's the complete actions file. Every action follows the same rhythm: authenticate, validate, query, revalidate, return.

```typescript
// src/app/dashboard/categories/actions.ts
'use server';

import { eq, ilike, and, sql, asc, desc, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { saveFile, deleteFile } from '@/lib/storage';
import { categoryFormSchema } from './schema';

import type { Category } from '@/db/schema/categories';

// ── Result types ─────────────────────────────────────────────

type ActionSuccess<T = void> = { success: true } & (T extends void ? {} : { data: T });
type ActionError = { success: false; error: string };
type ActionResult<T = void> = ActionSuccess<T> | ActionError;

// ── Queries ──────────────────────────────────────────────────

export interface GetCategoriesParams {
  search?: string;
  status?: 'active' | 'inactive';
  page?: number;
  pageSize?: number;
}

export interface CategoriesResponse {
  categories: (Category & { productCount: number })[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getCategories(
  params: GetCategoriesParams = {},
): Promise<ActionResult<CategoriesResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { search, status, page = 1, pageSize = 10 } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (search) {
      conditions.push(ilike(categories.name, `%${search}%`));
    }
    if (status) {
      conditions.push(eq(categories.status, status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          parentId: categories.parentId,
          imageUrl: categories.imageUrl,
          description: categories.description,
          status: categories.status,
          createdBy: categories.createdBy,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
          productCount: sql<number>`cast(count(${products.id}) as int)`,
        })
        .from(categories)
        .leftJoin(products, eq(products.categoryId, categories.id))
        .where(where)
        .groupBy(categories.id)
        .orderBy(desc(categories.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(categories).where(where),
    ]);

    return {
      success: true,
      data: {
        categories: data as (Category & { productCount: number })[],
        total: totalResult[0].count,
        page,
        pageSize,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
    };
  }
}

// ── Mutations ────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createCategory(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const raw = {
      name: formData.get('name') as string,
      slug: (formData.get('slug') as string) || slugify(formData.get('name') as string),
      parentId: (formData.get('parentId') as string) || null,
      description: (formData.get('description') as string) || undefined,
      status: (formData.get('status') as string) || 'active',
    };

    const parsed = categoryFormSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return { success: false, error: firstError.message };
    }

    // Handle image upload
    let imageUrl: string | null = null;
    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveFile(imageFile, 'categories');
    }

    const [inserted] = await db
      .insert(categories)
      .values({
        ...parsed.data,
        imageUrl,
        createdBy: user.id,
      })
      .returning({ id: categories.id });

    revalidatePath('/dashboard/categories');
    return { success: true, data: { id: inserted.id } };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category',
    };
  }
}

export async function updateCategory(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const existing = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
    if (!existing) return { success: false, error: 'Category not found' };

    const raw = {
      name: formData.get('name') as string,
      slug: (formData.get('slug') as string) || existing.slug,
      parentId: (formData.get('parentId') as string) || null,
      description: (formData.get('description') as string) || undefined,
      status: (formData.get('status') as string) || existing.status,
    };

    const parsed = categoryFormSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return { success: false, error: firstError.message };
    }

    // Handle image replacement
    let imageUrl = existing.imageUrl;
    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      if (existing.imageUrl) {
        await deleteFile(existing.imageUrl);
      }
      imageUrl = await saveFile(imageFile, 'categories');
    }

    await db
      .update(categories)
      .set({ ...parsed.data, imageUrl })
      .where(eq(categories.id, id));

    revalidatePath('/dashboard/categories');
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update category',
    };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const existing = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: { products: { columns: { id: true }, limit: 1 } },
    });
    if (!existing) return { success: false, error: 'Category not found' };

    // Prevent deletion if products are assigned
    if (existing.products.length > 0) {
      return {
        success: false,
        error: 'Cannot delete a category that has products assigned to it',
      };
    }

    // Clean up image
    if (existing.imageUrl) {
      await deleteFile(existing.imageUrl);
    }

    await db.delete(categories).where(eq(categories.id, id));

    revalidatePath('/dashboard/categories');
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete category',
    };
  }
}
```

A few decisions worth explaining.

The `ActionResult<T>` generic type replaces the hand-written discriminated unions from the original. Instead of defining `CreateCategoryResult` and `DeleteCategoryResult` as separate types with nearly identical shapes, one generic handles all of them. Actions that return data use `ActionResult<{ id: string }>`. Actions that just succeed or fail use `ActionResult` (which defaults to `void`). The discriminated union behavior is preserved — callers still narrow with `if (result.success)`.

The `getCategories` function runs two queries in parallel with `Promise.all`: one for the paginated data with a product count, one for the total count. The product count uses a left join and `count()` so categories with zero products still appear. Drizzle's `sql` template tag handles the cast from `bigint` (PostgreSQL's default count return type) to `int` so TypeScript gets a `number` back.

Deletion checks for assigned products before proceeding. The original Inventra didn't do this — it let the database's foreign key constraint throw an error, which surfaced as an unhelpful message to the user. Checking first gives us a clean error string.

### The File Upload Utility

Both categories and warehouses need file uploads. Rather than duplicating upload logic, we'll build a shared utility. The original Inventra used Supabase Storage directly. We're replacing that with a local filesystem approach that's swappable for S3-compatible storage later.

```typescript
// src/lib/storage.ts
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function getExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
  if (!allowed.includes(ext)) {
    throw new Error(`File type ${ext} is not allowed`);
  }
  return ext;
}

export async function saveFile(file: File, subdirectory: string): Promise<string> {
  const ext = getExtension(file.name);
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_DIR, subdirectory);

  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);

  // Return the public URL path (not the filesystem path)
  return `/uploads/${subdirectory}/${filename}`;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  if (!fileUrl.startsWith('/uploads/')) return;

  const filepath = path.join(process.cwd(), 'public', fileUrl);
  try {
    await unlink(filepath);
  } catch {
    // File might already be deleted — don't throw
  }
}
```

This is deliberately simple. Files go to `public/uploads/<subdirectory>/` with UUID filenames. The function returns a URL path that works with `<Image src={...}>` directly. No external service, no API keys, no bucket configuration.

For production, you'd swap this implementation for an S3-compatible client. The interface stays the same — `saveFile` returns a URL string, `deleteFile` takes one. The rest of the application doesn't care where files physically live. We'll revisit this in Chapter 12 when we cover deployment.

### The Server Component Page

This is where the RSC model shines. The page itself is a Server Component — no `'use client'` directive, no `useState`, no `useEffect`. It fetches data directly during render and passes it down.

```typescript
// src/app/dashboard/categories/page.tsx
import { Suspense } from 'react';

import { getCategories } from './actions';
import { CategoriesTable } from './components/categories-table';

export const metadata = {
  title: 'Categories — Inventra',
};

export default async function CategoriesPage() {
  const result = await getCategories();

  if (!result.success) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">Failed to load categories: {result.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Manage product categories and their hierarchy.
        </p>
      </div>

      <CategoriesTable
        initialData={result.data.categories}
        initialTotal={result.data.total}
      />
    </div>
  );
}
```

Twenty-eight lines. The page fetches categories on the server, handles the error case, and renders the heading plus a client component. No loading spinners needed for the initial load — the page streams the HTML with data already included.

The `CategoriesTable` receives `initialData` and `initialTotal`. These are the server-rendered defaults. When the user searches, filters, or paginates, the client component calls `getCategories` again with updated parameters. This hybrid approach gives us instant first paint with full interactivity.

### The Categories Table

This is the largest component in the module. It handles display, search, filtering, pagination, and coordinates the create/edit/delete dialogs.

```typescript
// src/app/dashboard/categories/components/categories-table.tsx
'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { getCategories } from '../actions';
import { CategoryFormDialog } from './category-form-dialog';
import { DeleteCategoryDialog } from './delete-category-dialog';

import type { Category } from '@/db/schema/categories';

interface CategoriesTableProps {
  initialData: (Category & { productCount: number })[];
  initialTotal: number;
}

export function CategoriesTable({ initialData, initialTotal }: CategoriesTableProps) {
  const [data, setData] = useState(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const pageSize = 10;
  const totalPages = Math.ceil(total / pageSize);

  function refresh(overrides: { search?: string; status?: string; page?: number } = {}) {
    startTransition(async () => {
      const result = await getCategories({
        search: overrides.search ?? search,
        status: (overrides.status ?? statusFilter) === 'all'
          ? undefined
          : ((overrides.status ?? statusFilter) as 'active' | 'inactive'),
        page: overrides.page ?? page,
        pageSize,
      });

      if (result.success) {
        setData(result.data.categories);
        setTotal(result.data.total);
      }
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    refresh({ search: value, page: 1 });
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
    refresh({ status: value, page: 1 });
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    refresh({ page: newPage });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => { setEditingCategory(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                  {isPending ? 'Loading...' : 'No categories found.'}
                </TableCell>
              </TableRow>
            ) : (
              data.map((category) => (
                <TableRow key={category.id} className={isPending ? 'opacity-50' : ''}>
                  <TableCell>
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        width={32}
                        height={32}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="bg-muted h-8 w-8 rounded" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>{category.productCount}</TableCell>
                  <TableCell>
                    <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                      {category.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => { setEditingCategory(category); setFormOpen(true); }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingCategory(category)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isPending}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || isPending}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingCategory(null); }}
        category={editingCategory}
        onSuccess={() => refresh()}
      />

      {deletingCategory && (
        <DeleteCategoryDialog
          open={!!deletingCategory}
          onOpenChange={(open) => { if (!open) setDeletingCategory(null); }}
          category={deletingCategory}
          onSuccess={() => refresh()}
        />
      )}
    </div>
  );
}
```

The `refresh` function deserves attention. It calls the server action directly from the client, which works because server actions are callable from client components. The `startTransition` wrapper marks the update as non-urgent, so the existing UI stays interactive while new data loads. The `isPending` flag dims the table rows during the transition — a subtle cue that's more polished than a full-page spinner.

Search doesn't debounce. For a warehouse management tool with hundreds (not millions) of categories, the round trip is fast enough. If you're adapting this for a larger dataset, wrap the search handler in a `useDeferredValue` or a debounce utility.

### The Form Dialog

One component handles both creation and editing. When `category` is `null`, it's a create form. When it's populated, it's an edit form with pre-filled values.

```typescript
// src/app/dashboard/categories/components/category-form-dialog.tsx
'use client';

import { useRef, useState, useTransition } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { createCategory, updateCategory } from '../actions';

import type { Category } from '@/db/schema/categories';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSuccess: () => void;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditing = category !== null;

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const result = isEditing
        ? await updateCategory(category.id, formData)
        : await createCategory(formData);

      if (result.success) {
        formRef.current?.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'New Category'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category details below.'
              : 'Fill in the details to create a new category.'}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name ?? ''}
              placeholder="Electronics"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={category?.slug ?? ''}
              placeholder="electronics (auto-generated if empty)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={category?.description ?? ''}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={category?.status ?? 'active'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? (isEditing ? 'Saving...' : 'Creating...')
                : (isEditing ? 'Save Changes' : 'Create Category')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

We're using the `action` attribute on the form instead of an `onSubmit` handler. This is the React 19 form action pattern — the function receives a `FormData` object directly, which we forward to the server action. No need for `e.preventDefault()`, no manual FormData construction, no JSON serialization of file objects.

The form uses `defaultValue` instead of controlled inputs. This is intentional. Controlled inputs with `useState` for every field add complexity that a simple CRUD form doesn't need. The `defaultValue` approach works because the form resets on success (via `formRef.current?.reset()`) and remounts when the dialog opens with a different category (React keys the component by the `open` state change).

### The Delete Dialog

Deletion gets its own dialog because the interaction is different: there's no form to fill, just a confirmation with context about what's being deleted.

```typescript
// src/app/dashboard/categories/components/delete-category-dialog.tsx
'use client';

import { useState, useTransition } from 'react';

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

import { deleteCategory } from '../actions';

import type { Category } from '@/db/schema/categories';

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  onSuccess: () => void;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteCategory(category.id);

      if (result.success) {
        onOpenChange(false);
        onSuccess();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{category.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The category will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

The `AlertDialog` is semantically correct here — it's a destructive action that requires user confirmation. Using a regular `Dialog` would work visually, but `AlertDialog` prevents dismissal by clicking the backdrop, which is the right UX for "are you sure you want to delete this."

The error state handles the case where deletion fails because products are assigned. The server action returns a clear message, and it shows inline below the description. No toast needed — the dialog stays open, and the user sees exactly what went wrong.

## Warehouses

With the categories pattern established, warehouses follow the same structure but with a few twists: more fields, a capacity utilization indicator, and an enum-based type system for warehouse classification.

### Schema

```typescript
// src/app/dashboard/warehouses/schema.ts
import { z } from 'zod';

export const warehouseFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  location: z.string().min(1, 'Location is required').max(255),
  description: z.string().max(1000).optional(),
  type: z.enum([
    'distribution_center',
    'fulfillment_center',
    'cold_storage',
    'bonded_warehouse',
    'cross_dock_facility',
    'retail_warehouse',
  ]),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  capacity: z
    .number({ coerce: true })
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1'),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  status: z.enum(['operational', 'under_maintenance', 'closed']).default('operational'),
  managerId: z.string().uuid().nullable().optional(),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;
```

The `capacity` field uses `z.number({ coerce: true })`. FormData sends everything as strings, so coercion converts `"500"` to `500` before the integer and minimum checks run. Without coercion, every form submission would fail validation because `"500"` isn't a number.

### Server Actions

```typescript
// src/app/dashboard/warehouses/actions.ts
'use server';

import { eq, ilike, and, sql, desc, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { warehouses, productStocks } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { saveFile, deleteFile } from '@/lib/storage';
import { warehouseFormSchema } from './schema';

import type { Warehouse } from '@/db/schema/warehouses';

type ActionSuccess<T = void> = { success: true } & (T extends void ? {} : { data: T });
type ActionError = { success: false; error: string };
type ActionResult<T = void> = ActionSuccess<T> | ActionError;

// ── Queries ──────────────────────────────────────────────────

export interface GetWarehousesParams {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface WarehouseWithStock extends Warehouse {
  currentStock: number;
}

export interface WarehousesResponse {
  warehouses: WarehouseWithStock[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getWarehouses(
  params: GetWarehousesParams = {},
): Promise<ActionResult<WarehousesResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { search, type, status, page = 1, pageSize = 10 } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (search) {
      conditions.push(ilike(warehouses.name, `%${search}%`));
    }
    if (type) {
      conditions.push(eq(warehouses.type, type as Warehouse['type']));
    }
    if (status) {
      conditions.push(eq(warehouses.status, status as Warehouse['status']));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: warehouses.id,
          name: warehouses.name,
          location: warehouses.location,
          imageUrl: warehouses.imageUrl,
          capacity: warehouses.capacity,
          type: warehouses.type,
          condition: warehouses.condition,
          managerId: warehouses.managerId,
          phone: warehouses.phone,
          address: warehouses.address,
          description: warehouses.description,
          status: warehouses.status,
          createdBy: warehouses.createdBy,
          createdAt: warehouses.createdAt,
          updatedAt: warehouses.updatedAt,
          currentStock: sql<number>`cast(coalesce(sum(${productStocks.quantity}), 0) as int)`,
        })
        .from(warehouses)
        .leftJoin(productStocks, eq(productStocks.warehouseId, warehouses.id))
        .where(where)
        .groupBy(warehouses.id)
        .orderBy(desc(warehouses.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(warehouses).where(where),
    ]);

    return {
      success: true,
      data: {
        warehouses: data as WarehouseWithStock[],
        total: totalResult[0].count,
        page,
        pageSize,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch warehouses',
    };
  }
}

// ── Mutations ────────────────────────────────────────────────

export async function createWarehouse(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const raw = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      description: (formData.get('description') as string) || undefined,
      type: formData.get('type') as string,
      condition: (formData.get('condition') as string) || 'good',
      capacity: formData.get('capacity') as string,
      phone: (formData.get('phone') as string) || undefined,
      address: (formData.get('address') as string) || undefined,
      status: (formData.get('status') as string) || 'operational',
      managerId: (formData.get('managerId') as string) || null,
    };

    const parsed = warehouseFormSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return { success: false, error: firstError.message };
    }

    // Handle image uploads (warehouses support multiple images)
    const imageUrls: string[] = [];
    const imageFiles = formData.getAll('images') as File[];
    for (const file of imageFiles) {
      if (file.size > 0) {
        const url = await saveFile(file, 'warehouses');
        imageUrls.push(url);
      }
    }

    const [inserted] = await db
      .insert(warehouses)
      .values({
        ...parsed.data,
        imageUrl: imageUrls,
        createdBy: user.id,
      })
      .returning({ id: warehouses.id });

    revalidatePath('/dashboard/warehouses');
    return { success: true, data: { id: inserted.id } };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create warehouse',
    };
  }
}

export async function updateWarehouse(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const existing = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    });
    if (!existing) return { success: false, error: 'Warehouse not found' };

    const raw = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      description: (formData.get('description') as string) || undefined,
      type: formData.get('type') as string,
      condition: (formData.get('condition') as string) || existing.condition,
      capacity: formData.get('capacity') as string,
      phone: (formData.get('phone') as string) || undefined,
      address: (formData.get('address') as string) || undefined,
      status: (formData.get('status') as string) || existing.status,
      managerId: (formData.get('managerId') as string) || null,
    };

    const parsed = warehouseFormSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return { success: false, error: firstError.message };
    }

    // Merge new images with existing ones
    let imageUrls = [...existing.imageUrl];
    const newFiles = formData.getAll('images') as File[];
    for (const file of newFiles) {
      if (file.size > 0) {
        const url = await saveFile(file, 'warehouses');
        imageUrls.push(url);
      }
    }

    // Handle image deletions (sent as comma-separated URLs)
    const removedImages =
      (formData.get('removedImages') as string)?.split(',').filter(Boolean) ?? [];
    for (const url of removedImages) {
      await deleteFile(url);
      imageUrls = imageUrls.filter((u) => u !== url);
    }

    await db
      .update(warehouses)
      .set({ ...parsed.data, imageUrl: imageUrls })
      .where(eq(warehouses.id, id));

    revalidatePath('/dashboard/warehouses');
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update warehouse',
    };
  }
}

export async function deleteWarehouse(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const existing = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
      with: { productStocks: { columns: { id: true }, limit: 1 } },
    });
    if (!existing) return { success: false, error: 'Warehouse not found' };

    if (existing.productStocks.length > 0) {
      return {
        success: false,
        error: 'Cannot delete a warehouse that still holds inventory',
      };
    }

    // Clean up all images
    for (const url of existing.imageUrl) {
      await deleteFile(url);
    }

    await db.delete(warehouses).where(eq(warehouses.id, id));

    revalidatePath('/dashboard/warehouses');
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete warehouse',
    };
  }
}
```

The `getWarehouses` query calculates `currentStock` by summing the `quantity` column from `product_stocks`. The `coalesce(..., 0)` ensures warehouses with no stock records get a zero instead of `null`. This is the same data the original Inventra computed, but Drizzle gives us compile-time verification that the columns exist.

Image handling differs from categories. Warehouses store a `jsonb` array of image URLs, so the update action merges new uploads with existing ones and removes explicitly deleted images. The `removedImages` field is a comma-separated string from the form — not ideal, but pragmatic. The alternative is a separate server action for each image deletion, which adds round trips for a rare operation.

### The Server Component Page

```typescript
// src/app/dashboard/warehouses/page.tsx
import { getWarehouses } from './actions';
import { WarehousesTable } from './components/warehouses-table';

export const metadata = {
  title: 'Warehouses — Inventra',
};

export default async function WarehousesPage() {
  const result = await getWarehouses();

  if (!result.success) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">Failed to load warehouses: {result.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
        <p className="text-muted-foreground">
          Manage warehouse locations, capacity, and status.
        </p>
      </div>

      <WarehousesTable
        initialData={result.data.warehouses}
        initialTotal={result.data.total}
      />
    </div>
  );
}
```

Identical structure to the categories page. That's the point. Every module page will look like this: fetch, handle error, render heading, pass data to client table. The consistency is a feature.

### The Warehouses Table

The table component follows the same pattern as categories but adds a capacity utilization bar and more filter options.

```typescript
// src/app/dashboard/warehouses/components/warehouses-table.tsx
'use client';

import { useState, useTransition } from 'react';
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { getWarehouses } from '../actions';
import { WarehouseFormDialog } from './warehouse-form-dialog';
import { DeleteWarehouseDialog } from './delete-warehouse-dialog';

import type { WarehouseWithStock } from '../actions';

const TYPE_LABELS: Record<string, string> = {
  distribution_center: 'Distribution Center',
  fulfillment_center: 'Fulfillment Center',
  cold_storage: 'Cold Storage',
  bonded_warehouse: 'Bonded Warehouse',
  cross_dock_facility: 'Cross Dock',
  retail_warehouse: 'Retail',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  operational: 'default',
  under_maintenance: 'secondary',
  closed: 'destructive',
};

interface WarehousesTableProps {
  initialData: WarehouseWithStock[];
  initialTotal: number;
}

export function WarehousesTable({ initialData, initialTotal }: WarehousesTableProps) {
  const [data, setData] = useState(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseWithStock | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseWithStock | null>(null);

  const pageSize = 10;
  const totalPages = Math.ceil(total / pageSize);

  function refresh(
    overrides: { search?: string; type?: string; status?: string; page?: number } = {},
  ) {
    startTransition(async () => {
      const result = await getWarehouses({
        search: overrides.search ?? search,
        type: (overrides.type ?? typeFilter) === 'all'
          ? undefined
          : (overrides.type ?? typeFilter),
        status: (overrides.status ?? statusFilter) === 'all'
          ? undefined
          : (overrides.status ?? statusFilter),
        page: overrides.page ?? page,
        pageSize,
      });

      if (result.success) {
        setData(result.data.warehouses);
        setTotal(result.data.total);
      }
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    refresh({ search: value, page: 1 });
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    refresh({ page: newPage });
  }

  function capacityPercent(current: number, max: number): number {
    if (max === 0) return 0;
    return Math.round((current / max) * 100);
  }

  function capacityColor(percent: number): string {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              placeholder="Search warehouses..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => { setTypeFilter(v); setPage(1); refresh({ type: v, page: 1 }); }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1); refresh({ status: v, page: 1 }); }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="under_maintenance">Maintenance</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => { setEditingWarehouse(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                  {isPending ? 'Loading...' : 'No warehouses found.'}
                </TableCell>
              </TableRow>
            ) : (
              data.map((warehouse) => {
                const pct = capacityPercent(warehouse.currentStock, warehouse.capacity);
                return (
                  <TableRow key={warehouse.id} className={isPending ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{warehouse.name}</TableCell>
                    <TableCell className="text-muted-foreground">{warehouse.location}</TableCell>
                    <TableCell>{TYPE_LABELS[warehouse.type] ?? warehouse.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
                          <div
                            className={`h-full rounded-full ${capacityColor(pct)}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {warehouse.currentStock}/{warehouse.capacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[warehouse.status] ?? 'secondary'}>
                        {warehouse.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => { setEditingWarehouse(warehouse); setFormOpen(true); }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingWarehouse(warehouse)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isPending}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || isPending}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <WarehouseFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingWarehouse(null); }}
        warehouse={editingWarehouse}
        onSuccess={() => refresh()}
      />

      {deletingWarehouse && (
        <DeleteWarehouseDialog
          open={!!deletingWarehouse}
          onOpenChange={(open) => { if (!open) setDeletingWarehouse(null); }}
          warehouse={deletingWarehouse}
          onSuccess={() => refresh()}
        />
      )}
    </div>
  );
}
```

The capacity bar is the interesting addition. Three colors — green below 70%, amber between 70-90%, red above 90%. The `tabular-nums` class on the stock count keeps the numbers from shifting width as values change. Small detail, but it prevents the column from jittering during transitions.

### Form and Delete Dialogs

The warehouse form is larger (more fields) but structurally identical to the category form. We won't repeat the full dialog shell, just the form body that differs.

```typescript
// src/app/dashboard/warehouses/components/warehouse-form-dialog.tsx
'use client';

import { useRef, useState, useTransition } from 'react';

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { createWarehouse, updateWarehouse } from '../actions';

import type { WarehouseWithStock } from '../actions';

interface WarehouseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: WarehouseWithStock | null;
  onSuccess: () => void;
}

export function WarehouseFormDialog({
  open,
  onOpenChange,
  warehouse,
  onSuccess,
}: WarehouseFormDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditing = warehouse !== null;

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const result = isEditing
        ? await updateWarehouse(warehouse.id, formData)
        : await createWarehouse(formData);

      if (result.success) {
        formRef.current?.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Warehouse' : 'New Warehouse'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update warehouse details and configuration.'
              : 'Add a new warehouse location to the system.'}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={warehouse?.name ?? ''}
                placeholder="Main Distribution Center"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={warehouse?.location ?? ''}
                placeholder="Jakarta, Indonesia"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={warehouse?.type ?? 'distribution_center'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distribution_center">Distribution Center</SelectItem>
                  <SelectItem value="fulfillment_center">Fulfillment Center</SelectItem>
                  <SelectItem value="cold_storage">Cold Storage</SelectItem>
                  <SelectItem value="bonded_warehouse">Bonded Warehouse</SelectItem>
                  <SelectItem value="cross_dock_facility">Cross Dock Facility</SelectItem>
                  <SelectItem value="retail_warehouse">Retail Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                defaultValue={warehouse?.capacity ?? ''}
                placeholder="1000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select name="condition" defaultValue={warehouse?.condition ?? 'good'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={warehouse?.status ?? 'operational'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={warehouse?.phone ?? ''}
                placeholder="+62 21 xxx xxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">Images</Label>
              <Input id="images" name="images" type="file" accept="image/*" multiple />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={warehouse?.address ?? ''}
              placeholder="Full street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={warehouse?.description ?? ''}
              placeholder="Notes about this warehouse..."
              rows={3}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? (isEditing ? 'Saving...' : 'Creating...')
                : (isEditing ? 'Save Changes' : 'Create Warehouse')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

The delete dialog for warehouses is structurally identical to the category version, just with different text and a `deleteWarehouse` import. Here it is for completeness:

```typescript
// src/app/dashboard/warehouses/components/delete-warehouse-dialog.tsx
'use client';

import { useState, useTransition } from 'react';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { deleteWarehouse } from '../actions';

import type { WarehouseWithStock } from '../actions';

interface DeleteWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: WarehouseWithStock;
  onSuccess: () => void;
}

export function DeleteWarehouseDialog({
  open,
  onOpenChange,
  warehouse,
  onSuccess,
}: DeleteWarehouseDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteWarehouse(warehouse.id);

      if (result.success) {
        onOpenChange(false);
        onSuccess();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{warehouse.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the warehouse and its configuration.
            Warehouses with existing inventory cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Patterns Established

Two modules, ten files total. Here's what we've locked in as the template for every feature going forward.

**Data flow.** RSC page fetches initial data through a server action. The client table component receives it as props, displays it immediately, and re-fetches with different parameters when the user interacts. No `useEffect` for initial loads. No loading skeleton on first paint. The server does the work before the page reaches the browser.

**Server action structure.** Every action follows the same flow: authenticate with `getCurrentUser`, validate input with Zod's `safeParse`, execute the Drizzle query, call `revalidatePath`, return a discriminated union. The `ActionResult<T>` generic type means we never hand-write result types again. The original Inventra's pattern of `{ success: true; data: T } | { success: false; error: string }` is preserved, just generalized.

**Validation.** Zod schemas live in a separate `schema.ts` file, not embedded in the action or the form. The form component doesn't import Zod at all — it sends raw FormData to the action, and the action runs validation. This keeps the client bundle smaller (no Zod shipped to the browser) and ensures validation always runs server-side regardless of what the client sends.

**File uploads.** The shared `storage.ts` utility abstracts away the physical storage location. Actions call `saveFile` and `deleteFile` without knowing whether files go to disk, S3, or anywhere else. The interface is two functions that accept and return strings. Swapping storage backends is a single-file change.

**Dialogs.** One form dialog handles both create and edit modes. The `category` or `warehouse` prop determines which. When null, it's creation. When populated, it's editing with `defaultValue` pre-fill. The delete dialog is always a separate component because confirmation UX differs from form UX — `AlertDialog` blocks backdrop dismissal, `Dialog` doesn't.

**Pagination.** Server-side with `limit` and `offset`. The total count query runs in parallel with the data query. The client tracks page state and adjusts the offset accordingly. No infinite scroll — for admin dashboards, explicit pagination gives users a sense of how much data exists and where they are in the list.

**Search and filters.** Filters build a `conditions` array that gets combined with `and()`. Each filter is optional and only added when its value isn't the default. The pattern scales cleanly: adding a new filter means pushing one more condition into the array.

There's a deliberate absence worth noting: we didn't build a generic `DataTable` component that both modules share. The temptation is strong. The tables look similar. But categories have an image column that warehouses don't. Warehouses have a capacity bar that categories don't. The filter options differ. The type labels differ. Abstracting too early would mean a component riddled with conditional props and special-case branches. Each table is under 200 lines. The duplication is minimal and the readability gain is real.

Chapter 8 builds the Products module using these exact patterns, but with multi-image uploads, a richer form with category selection, and SKU generation. Chapter 9 does the same for stock transactions, adding business rules that span multiple tables. The foundation is set. Everything from here is variation on a theme.
