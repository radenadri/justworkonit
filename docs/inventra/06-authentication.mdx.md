# Chapter 6: Authentication with better-auth

The original Inventra used Supabase Auth — a black-box system where user sessions lived in Supabase's infrastructure, tokens refreshed through their SDK, and your application code had no direct control over password hashing, session storage, or role enforcement. That coupling made every auth decision depend on a third-party service.

This chapter replaces all of that with [better-auth](https://www.better-auth.com/), a framework-agnostic authentication library that stores everything — users, sessions, accounts — in your own PostgreSQL database through Drizzle ORM. You control the schema. You control the session lifecycle. You define the roles and permissions.

## What We're Replacing

The old Supabase auth flow worked like this:

```
Browser → Supabase SDK (signInWithPassword) → Supabase servers → JWT cookie
Server Action → supabase.auth.getUser() → Supabase servers → user object
Middleware → supabase.auth.getUser() → Supabase servers → redirect decision
```

Every auth check hit Supabase's servers. Session data lived in their database. The user table was split between Supabase's `auth.users` (which you couldn't fully control) and your own `profiles` table (which duplicated some fields). Role enforcement happened through RLS policies tied to Supabase's auth system.

The new flow with better-auth:

```
Browser → better-auth API route → your PostgreSQL → session cookie
Server Action → auth.api.getSession() → your PostgreSQL → session + user
Middleware → cookie check → redirect decision (no DB hit)
```

Sessions live in your database. Passwords are hashed with bcrypt (built into better-auth). Roles are stored on the user record and enforced through better-auth's admin plugin. No external auth service needed.

## Installing better-auth

```bash
bun add better-auth
```

That's one dependency. No separate packages for password hashing, JWT handling, or session management — better-auth handles all of it internally.

Add two environment variables to `.env.local`:

```env
# Minimum 32 characters. Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters-long"

# The base URL where your app runs
BETTER_AUTH_URL="http://localhost:3000"
```

`BETTER_AUTH_SECRET` is used to sign session tokens. `BETTER_AUTH_URL` tells better-auth where to mount its API routes and where to redirect after auth operations.

## The Auth Configuration

The core of better-auth is a single configuration file that defines how authentication works in your application. Create `src/lib/auth.ts`:

```ts
// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { db } from '@/db';
import { user, session, account, verification } from '@/db/schema/auth';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh session if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — avoids DB hit on every request
    },
  },

  plugins: [
    admin({
      defaultRole: 'warehouse_staff',
    }),
  ],

  trustedOrigins: [process.env.BETTER_AUTH_URL!],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
```

Let's unpack what each section does.

**`drizzleAdapter`** connects better-auth to your PostgreSQL database through the same Drizzle instance your application uses. The `schema` option maps better-auth's internal table names to your Drizzle schema definitions — this gives you full control over table names and additional columns.

**`emailAndPassword`** enables the classic email/password sign-in flow. better-auth handles password hashing internally using bcrypt. The `minPasswordLength` option rejects passwords shorter than 8 characters at the API level, before they reach your application code.

**`session`** configures cookie-based sessions. The `cookieCache` option is important for performance — it serializes the session into the cookie itself, so middleware and server components can read the session without hitting the database on every request. The cache refreshes every 5 minutes.

**`admin` plugin** adds role management. By setting `defaultRole` to `'warehouse_staff'`, every new user gets the lowest privilege level. The admin plugin adds a `role` column to the user table and provides APIs for role assignment, user banning, and impersonation.

## Auth Schema for Drizzle

better-auth manages four tables: `user`, `session`, `account`, and `verification`. You can auto-generate the schema by running `bunx @better-auth/cli generate`, but for full control, define it manually.

Create `src/db/schema/auth.ts`:

```ts
// src/db/schema/auth.ts
import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),

  // Added by admin plugin
  role: text('role').notNull().default('warehouse_staff'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Added by admin plugin
  impersonatedBy: text('impersonated_by'),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

A few things to notice:

- The `account` table stores the hashed password in its `password` column (for the `credential` provider). This is different from the old approach where `password_hash` lived directly on the user table. better-auth separates identity providers from user records — the same user could later add Google or GitHub login without schema changes.
- The `session` table stores sessions in the database. Each session gets a unique token that's sent as an HTTP-only cookie. This is more secure than JWTs — if a session is compromised, you can delete the row and it's immediately revoked. JWTs remain valid until they expire.
- The `verification` table handles email verification tokens, password reset tokens, and similar one-time-use values.

Export these from your schema barrel file:

```ts
// src/db/schema/index.ts
export * from './auth';
export * from './categories';
export * from './warehouses';
export * from './products';
export * from './transactions';
export * from './activity-logs';
```

Generate and run the migration:

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

## API Route Handler

better-auth needs a single catch-all API route to handle sign-in, sign-up, sign-out, session checks, and admin operations. Create `src/app/api/auth/[...all]/route.ts`:

```ts
// src/app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { POST, GET } = toNextJsHandler(auth);
```

That's the entire file. `toNextJsHandler` adapts better-auth's request handler to Next.js App Router's route handler format. This single route handles all auth endpoints:

- `POST /api/auth/sign-up/email` — create account
- `POST /api/auth/sign-in/email` — sign in
- `POST /api/auth/sign-out` — sign out
- `GET /api/auth/get-session` — get current session
- `POST /api/auth/admin/*` — admin operations (create user, set role, ban, etc.)

## Auth Client

Client components need a way to call auth endpoints and react to session changes. Create `src/lib/auth-client.ts`:

```ts
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

`createAuthClient` builds a client that communicates with your `/api/auth/[...all]` route handler. The `adminClient` plugin adds client-side methods for admin operations like `admin.createUser()` and `admin.setRole()`.

`useSession` is a React hook that returns the current session reactively — it updates automatically when the user signs in or out.

## Server-Side Auth Helpers

Server Actions and Server Components need to verify the current user's session. Unlike the old approach that required separate files for password hashing, JWT creation, JWT verification, and role checking, better-auth consolidates this into one import.

Create `src/lib/auth/get-current-user.ts`:

```ts
// src/lib/auth/get-current-user.ts
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'warehouse_staff';
  image: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as CurrentUser['role'],
    image: session.user.image,
  };
}
```

This function calls `auth.api.getSession()` with the incoming request headers. better-auth reads the session cookie from those headers, looks up the session in the database (or reads from cookie cache if fresh enough), and returns the session and user data.

The `CurrentUser` interface narrows the return type to just the fields your application needs, with `role` typed as a union of your three roles rather than a generic string.

Create `src/lib/auth/require-role.ts`:

```ts
// src/lib/auth/require-role.ts
import { getCurrentUser } from './get-current-user';
import type { CurrentUser } from './get-current-user';

type RoleCheckSuccess = {
  success: true;
  user: CurrentUser;
};

type RoleCheckFailure = {
  success: false;
  error: string;
};

export type RoleCheckResult = RoleCheckSuccess | RoleCheckFailure;

export async function requireRole(...roles: CurrentUser['role'][]): Promise<RoleCheckResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated.' };
  }

  if (!roles.includes(user.role)) {
    return {
      success: false,
      error: `Access denied. Required role: ${roles.join(' or ')}.`,
    };
  }

  return { success: true, user };
}
```

This preserves the exact same API that the rest of the application expects — `requireRole('admin', 'manager')` returns a discriminated union with either the authenticated user or an error message. The difference is that the underlying mechanism now goes through better-auth instead of manually parsing JWT cookies.

## Custom Access Control (RBAC)

For more granular permissions beyond simple role checks, better-auth provides an access control system. This is optional — the `requireRole` helper above covers most cases — but it's useful when you need to express rules like "managers can view stock reports but only admins can export them."

Create `src/lib/auth/permissions.ts`:

```ts
// src/lib/auth/permissions.ts
import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

const statements = {
  ...defaultStatements,
  product: ['create', 'read', 'update', 'delete'] as const,
  category: ['create', 'read', 'update', 'delete'] as const,
  warehouse: ['create', 'read', 'update', 'delete'] as const,
  stockIn: ['create', 'read', 'update', 'approve', 'reject'] as const,
  stockOut: ['create', 'read', 'update', 'approve', 'reject'] as const,
  report: ['read', 'export'] as const,
  user: ['create', 'read', 'update', 'delete', 'set-role'] as const,
} as const;

export const ac = createAccessControl(statements);

export const admin = ac.newRole({
  product: ['create', 'read', 'update', 'delete'],
  category: ['create', 'read', 'update', 'delete'],
  warehouse: ['create', 'read', 'update', 'delete'],
  stockIn: ['create', 'read', 'update', 'approve', 'reject'],
  stockOut: ['create', 'read', 'update', 'approve', 'reject'],
  report: ['read', 'export'],
  user: ['create', 'read', 'update', 'delete', 'set-role'],
  ...adminAc.statements.admin,
});

export const manager = ac.newRole({
  product: ['create', 'read', 'update'],
  category: ['create', 'read', 'update'],
  warehouse: ['read'],
  stockIn: ['create', 'read', 'update', 'approve', 'reject'],
  stockOut: ['create', 'read', 'update', 'approve', 'reject'],
  report: ['read', 'export'],
  user: ['read'],
});

export const warehouseStaff = ac.newRole({
  product: ['read'],
  category: ['read'],
  warehouse: ['read'],
  stockIn: ['create', 'read'],
  stockOut: ['create', 'read'],
  report: ['read'],
  user: [],
});
```

Then update the auth configuration to use these roles:

```ts
// src/lib/auth.ts — updated plugins section
import { ac, admin, manager, warehouseStaff } from '@/lib/auth/permissions';

export const auth = betterAuth({
  // ... previous config ...

  plugins: [
    admin({
      defaultRole: 'warehouse_staff',
      ac,
      roles: {
        admin,
        manager,
        warehouse_staff: warehouseStaff,
      },
    }),
  ],
});
```

With this in place, you can check granular permissions in server actions:

```ts
const hasPermission = await auth.api.userHasPermission({
  body: {
    userId: user.id,
    permission: {
      stockIn: ['approve'],
    },
  },
});

if (!hasPermission.data?.success) {
  return { success: false, error: 'You do not have permission to approve stock-in.' };
}
```

For most operations in Inventra, the simpler `requireRole()` helper is sufficient. Use granular permissions when you need finer control — for instance, allowing managers to create products but not delete them.

## Middleware

The middleware protects routes by checking for a valid session cookie before the request reaches your page components. Create `middleware.ts` at the project root:

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { betterFetch } from '@better-fetch/fetch';

const PUBLIC_PATHS = ['/sign-in', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token');

  if (!sessionCookie) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Verify the session is valid by calling the auth API
  const { data: session } = await betterFetch<{
    session: { id: string; userId: string; expiresAt: string };
    user: { id: string; role: string; banned: boolean };
  }>('/api/auth/get-session', {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  });

  if (!session || session.user.banned) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

The middleware does two things:

1. **Skips public paths.** The sign-in page and auth API routes must be accessible without a session.
2. **Validates the session.** It reads the session cookie and calls the auth API to verify the session is still valid and the user isn't banned. If invalid, it redirects to `/sign-in` with a `?next=` parameter so the user returns to their intended page after signing in.

The `betterFetch` import from `@better-fetch/fetch` (included with better-auth) handles the internal API call. This does hit your auth route on each request, but with `cookieCache` enabled, the session lookup is fast — it reads from the cookie rather than querying the database on every request.

## Sign-In Page

The sign-in page uses Shadcn UI components and calls better-auth's client-side `signIn` function. Create `src/app/(auth)/sign-in/page.tsx`:

```tsx
// src/app/(auth)/sign-in/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Package } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn.email({
      email: email.toLowerCase().trim(),
      password,
    });

    if (signInError) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    router.push(next);
  }

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="bg-primary mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg">
            <Package className="text-primary-foreground h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Inventra</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@inventra.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

The key difference from the old implementation: instead of calling a server action that manually verifies the password and creates a JWT, `signIn.email()` sends a request to your `/api/auth/sign-in/email` endpoint. better-auth verifies the password, creates a session in the database, and sets the session cookie — all in one call.

The error handling is deliberately vague — "Invalid email or password" for both wrong email and wrong password. This prevents user enumeration attacks where an attacker could determine which emails have accounts.

## Auth Layout

The auth layout wraps the sign-in page with metadata. Create `src/app/(auth)/layout.tsx`:

```tsx
// src/app/(auth)/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — Inventra',
  description: 'Sign in to your Inventra account.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

## Sign-Out Action

Sign-out is a server action that calls better-auth's sign-out endpoint and redirects to the sign-in page. Create `src/app/(auth)/sign-out/actions.ts`:

```ts
// src/app/(auth)/sign-out/actions.ts
'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect('/sign-in');
}
```

`auth.api.signOut()` deletes the session from the database and clears the session cookie. The `redirect()` call then sends the user to the sign-in page. Since this is a server action called from a client component (the sidebar's sign-out button), the redirect happens server-side after the session is destroyed.

## Dashboard Layout with Auth

The dashboard layout is an async Server Component that checks for a valid session before rendering. If no session exists, it redirects to sign-in. If the session is valid, it passes the user data to a `UserProvider` context.

Create `src/app/dashboard/layout.tsx`:

```tsx
// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { UserProvider } from '@/contexts/UserContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — Inventra',
  description: 'Inventra warehouse management dashboard.',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <UserProvider user={user}>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="bg-muted/40 flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}
```

This layout serves as the auth gate for the entire dashboard. The `getCurrentUser()` call goes through better-auth's session API, and since the middleware already verified the session, this call should always succeed for legitimate requests. The redirect here is a safety net for edge cases like expired sessions between middleware check and page render.

## User Context

The `UserContext` provides user data to client components without requiring them to make their own auth calls. The context receives user data from the server (via the dashboard layout) and distributes it through React's context API.

Create `src/contexts/UserContext.tsx`:

```tsx
// src/contexts/UserContext.tsx
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { CurrentUser } from '@/lib/auth/get-current-user';

interface UserContextValue {
  user: CurrentUser;
  updateUser: (updates: Partial<CurrentUser>) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  user: CurrentUser;
  children: React.ReactNode;
}

export function UserProvider({ user: initialUser, children }: UserProviderProps) {
  const [user, setUser] = useState<CurrentUser>(initialUser);

  const updateUser = useCallback((updates: Partial<CurrentUser>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return <UserContext.Provider value={{ user, updateUser }}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider.');
  }
  return context;
}
```

Client components import `useUser` to read the current user's name, email, role, or avatar. The `updateUser` callback lets components update the displayed user data optimistically — for example, after the user changes their profile picture, you can update the context immediately without waiting for a page reload.

## Using Auth in Server Actions

Every server action that reads or writes data must verify the user's identity and role. The pattern is identical to before — the only thing that changed is what happens inside `getCurrentUser()` and `requireRole()`.

**Before (old Supabase approach):**

```ts
const supabase = await createClient();
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
if (error || !user) return { success: false, error: 'Unauthorized.' };
```

**After (better-auth):**

```ts
import { getCurrentUser } from '@/lib/auth/get-current-user';

const user = await getCurrentUser();
if (!user) return { success: false, error: 'Not authenticated.' };
```

For role-restricted actions:

```ts
import { requireRole } from '@/lib/auth/require-role';

export async function deleteProduct(productId: string) {
  const auth = await requireRole('admin');
  if (!auth.success) return auth;

  const user = auth.user;
  // ... proceed with deletion
}
```

The rest of the application code — the Drizzle queries, the Zod validation, the `revalidatePath` calls — stays exactly the same. The auth layer is a thin wrapper that the rest of the application treats as a black box.

## Seeding the Admin User

The seed script creates the initial admin account using better-auth's admin API. Create `src/db/seed-admin.ts`:

```ts
// src/db/seed-admin.ts
import { auth } from '@/lib/auth';

async function seedAdmin() {
  console.log('Seeding admin user...');

  try {
    const newUser = await auth.api.createUser({
      body: {
        name: 'Admin',
        email: 'admin@inventra.com',
        password: 'Admin123!',
        role: 'admin',
      },
    });

    console.log('Admin user created:', newUser.user.email);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('Admin user already exists, skipping.');
    } else {
      console.error('Failed to seed admin:', error);
      process.exit(1);
    }
  }

  process.exit(0);
}

seedAdmin();
```

Run it:

```bash
bun run src/db/seed-admin.ts
```

The `auth.api.createUser()` method is provided by the admin plugin. It hashes the password and creates both the user record and the credential account record in a single transaction. The `role: 'admin'` parameter overrides the default `warehouse_staff` role.

Create a similar seed for a manager user at `src/db/seed-manager.ts`:

```ts
// src/db/seed-manager.ts
import { auth } from '@/lib/auth';

async function seedManager() {
  console.log('Seeding manager user...');

  try {
    const newUser = await auth.api.createUser({
      body: {
        name: 'Manager',
        email: 'manager@inventra.com',
        password: 'Manager123!',
        role: 'manager',
      },
    });

    console.log('Manager user created:', newUser.user.email);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('Manager user already exists, skipping.');
    } else {
      console.error('Failed to seed manager:', error);
      process.exit(1);
    }
  }

  process.exit(0);
}

seedManager();
```

Add both to `package.json`:

```json
{
  "scripts": {
    "seed:admin": "bun run src/db/seed-admin.ts",
    "seed:manager": "bun run src/db/seed-manager.ts"
  }
}
```

## Session Caching with Redis

In production, you can offload session storage to Redis for faster lookups. better-auth supports a `secondaryStorage` option that stores sessions in Redis while keeping the database as the source of truth.

Update `src/lib/auth.ts` to add Redis caching:

```ts
// src/lib/auth.ts — with Redis secondary storage
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { Redis } from 'ioredis';
import { db } from '@/db';
import { user, session, account, verification } from '@/db/schema/auth';
import { ac, admin as adminRole, manager, warehouseStaff } from '@/lib/auth/permissions';

const redis = new Redis(process.env.REDIS_URL!);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  secondaryStorage: {
    get: async (key) => {
      const value = await redis.get(key);
      return value ?? null;
    },
    set: async (key, value, ttl) => {
      if (ttl) {
        await redis.set(key, value, 'EX', ttl);
      } else {
        await redis.set(key, value);
      }
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },

  plugins: [
    admin({
      defaultRole: 'warehouse_staff',
      ac,
      roles: {
        admin: adminRole,
        manager,
        warehouse_staff: warehouseStaff,
      },
    }),
  ],

  trustedOrigins: [process.env.BETTER_AUTH_URL!],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
```

With `secondaryStorage`, session lookups hit Redis first. If the session is found there, better-auth skips the database query entirely. Sessions are automatically synced — when a session is created or updated, it's written to both PostgreSQL and Redis.

This is optional for development. The application works fine without Redis — sessions are read from the database (or cookie cache). Add Redis when you need to handle thousands of concurrent users.

## Security Considerations

**Password storage.** better-auth uses bcrypt internally with a work factor that follows current best practices. You don't configure this — it's handled by the library. Passwords are stored in the `account` table, not the `user` table, which separates credential management from identity management.

**Session security.** Sessions are stored in the database with a unique token. The token is sent as an HTTP-only, SameSite=Lax, Secure (in production) cookie. HTTP-only prevents JavaScript from reading the cookie (XSS defense). SameSite=Lax prevents the cookie from being sent in cross-site POST requests (CSRF defense). Secure ensures the cookie is only sent over HTTPS.

**Session revocation.** Unlike JWTs, database-backed sessions can be revoked immediately. Ban a user with `auth.api.banUser({ body: { userId } })` and their session becomes invalid on the next request. No waiting for token expiry.

**User enumeration.** The sign-in page shows the same error message for wrong email and wrong password. better-auth's sign-up endpoint can be disabled (we only allow admin-created accounts for Inventra), which eliminates another enumeration vector.

**Cookie cache trade-off.** The 5-minute cookie cache means a banned user could remain active for up to 5 minutes after being banned. For most applications this is acceptable. If you need instant revocation, disable the cookie cache or reduce `maxAge` to a lower value.

**Rate limiting.** better-auth doesn't include built-in rate limiting. For production, add rate limiting at the middleware or reverse proxy level (Nginx, Cloudflare) to protect the `/api/auth/sign-in/email` endpoint from brute force attacks.

## File Summary

Here's every file created or modified in this chapter:

| File                                 | Purpose                         |
| ------------------------------------ | ------------------------------- |
| `src/lib/auth.ts`                    | Core better-auth configuration  |
| `src/lib/auth-client.ts`             | Client-side auth client         |
| `src/lib/auth/get-current-user.ts`   | Server-side session lookup      |
| `src/lib/auth/require-role.ts`       | Role-checking helper            |
| `src/lib/auth/permissions.ts`        | RBAC access control definitions |
| `src/db/schema/auth.ts`              | Drizzle schema for auth tables  |
| `src/app/api/auth/[...all]/route.ts` | better-auth API route handler   |
| `src/app/(auth)/sign-in/page.tsx`    | Sign-in page                    |
| `src/app/(auth)/sign-out/actions.ts` | Sign-out server action          |
| `src/app/(auth)/layout.tsx`          | Auth layout with metadata       |
| `src/app/dashboard/layout.tsx`       | Dashboard layout with auth gate |
| `src/contexts/UserContext.tsx`       | User context provider           |
| `src/db/seed-admin.ts`               | Admin user seed script          |
| `src/db/seed-manager.ts`             | Manager user seed script        |
| `middleware.ts`                      | Route protection middleware     |

The auth system is now self-contained. No external auth service, no opaque token refresh flows, no split between "auth users" and "profile users." Every user, session, and account record lives in your PostgreSQL database, managed through Drizzle, and accessed through better-auth's typed API.

Next chapter, we'll build the categories and warehouses modules — the first features that use `getCurrentUser()` and `requireRole()` to protect their server actions.
