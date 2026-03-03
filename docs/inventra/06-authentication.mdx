# Chapter 6: Authentication

The original Inventra outsourced authentication entirely to Supabase. That meant calling `supabase.auth.signInWithPassword()` on the client, letting Supabase manage session cookies, and checking `supabase.auth.getUser()` in every server action. It worked. But it came with strings attached.

The Supabase auth model ties your user table to `auth.users`, a system table you don't control. Password hashing, session storage, token rotation—all hidden behind the SDK. You can't customize the session payload. You can't change the cookie configuration. You can't switch providers without rewriting every file that touches authentication. And if Supabase has an outage, your users can't log in.

We're building auth from scratch. Passwords hashed with bcryptjs. Sessions stored as encrypted JWTs in HTTP-only cookies using `jose`. Middleware that checks the cookie and redirects unauthenticated requests. Server actions that validate credentials, create sessions, and destroy them. No third-party dependency standing between our code and our users.

## What We're Replacing

Let's be specific about what the current system does.

**Sign-in flow.** The `FormSignIn.tsx` component calls `supabase.auth.signInWithPassword({ email, password })` directly from the browser. Supabase's client SDK handles the HTTP request, receives tokens, and stores them in cookies. No server action involved in the login itself.

**Session management.** Supabase sets its own cookies (`sb-access-token`, `sb-refresh-token`). The middleware in `proxy.ts` creates a server-side Supabase client on every request, passes the cookies through, and calls `supabase.auth.getUser()` to verify the session. If the user isn't authenticated and the path isn't public, it redirects to `/sign-in`.

**Server action auth checks.** Every server action starts with the same three lines:

```typescript
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();
if (authError || !user) return { success: false, error: 'Unauthorized.' };
```

That's a network call to Supabase's auth endpoint on every single mutation. Not a local check—an HTTP request.

**User context.** The `UserContext` creates a Supabase client, calls `supabase.auth.getUser()` again (yes, another network call), then queries the `profiles` table to get display name, role, and avatar. Two Supabase calls per page load.

**Profile creation.** A database trigger on `auth.users` automatically inserts a row into `profiles` when a new user signs up. The trigger copies the email and generates a UUID. This means the `profiles` table can't exist without `auth.users`.

**Roles.** Three roles: `admin`, `manager`, `warehouse_staff`. Checked in application code, not in RLS policies (the policies check `auth.uid()` but not role).

Every piece of this is getting replaced. Here's the plan.

## The New Auth Architecture

Our auth system has five parts:

1. **Password hashing** — bcryptjs with cost factor 12
2. **Session management** — JWTs signed with HMAC-SHA256, stored in HTTP-only cookies
3. **Middleware** — intercepts every request, validates the session cookie, redirects if needed
4. **Server actions** — `signIn`, `signOut`, and a `getCurrentUser` helper
5. **Client context** — a `UserProvider` that receives user data from the server, no client-side auth calls

Why JWT instead of opaque session tokens stored in a database? Because Next.js middleware runs on the Edge Runtime. It can't make database calls. It can't use the `pg` driver. JWTs are self-contained: the middleware decodes the cookie, verifies the signature, and reads the payload without touching the database. That's the entire reason.

Why `jose` instead of `jsonwebtoken`? Same answer. `jose` works on the Edge Runtime. `jsonwebtoken` requires Node.js crypto APIs that aren't available in Edge. This matters because our middleware file needs to verify tokens, and Next.js middleware runs on Edge by default.

## Installing jose

We already have `bcryptjs` from Chapter 5. We need one more package:

```bash
bun add jose
```

That's it. No `@types` package needed—`jose` ships its own TypeScript definitions.

Add `AUTH_SECRET` to your `.env.local` if you haven't already (Chapter 5 included it):

```bash
AUTH_SECRET=your-secret-key-here-at-least-32-characters-long
```

This secret signs and verifies JWTs. In production, generate a proper random string:

```bash
openssl rand -base64 32
```

## Password Hashing

First file. Short and focused.

```typescript
// src/lib/auth/password.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
```

Cost factor 12. Why not 10 (the common default)? Because hardware keeps getting faster. A cost factor of 10 was fine in 2015. Today, it completes in under 100ms on modern hardware, which means an attacker with a GPU can brute-force weak passwords at a reasonable rate. Cost factor 12 takes roughly 250-300ms per hash, which is imperceptible for a login form but makes brute-forcing 4x slower. Cost factor 14 would be even safer, but at ~1 second per hash it starts to degrade the user experience.

There's no magic here. `bcrypt.hash` generates a random salt and bakes it into the output string. `bcrypt.compare` extracts the salt from the stored hash and re-hashes the input. If they match, the password is correct.

## Session Management

This is the core of our auth system. The session module creates, reads, and destroys JWT-based sessions stored in cookies.

```typescript
// src/lib/auth/session.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'inventra-session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'warehouse_staff';
  expiresAt: number;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: Omit<SessionPayload, 'expiresAt'>): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;

  const token = await new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
```

Let's walk through the design decisions.

**HMAC-SHA256 (`HS256`).** Symmetric signing. The same secret signs and verifies. This is fine for a monolithic Next.js app where the signer and verifier are the same process. RSA or ECDSA would make sense in a microservices architecture where one service signs and others verify. We don't have that.

**Seven-day sessions.** Long enough that users don't have to log in daily. Short enough that a stolen cookie has a limited window. You could implement token rotation (issue a new token on each request), but that adds complexity and can cause race conditions with concurrent requests. For an internal warehouse management tool, seven-day sessions are a reasonable tradeoff.

**Cookie settings.** `httpOnly` prevents JavaScript from reading the cookie—this blocks XSS attacks from stealing sessions. `secure` ensures the cookie only travels over HTTPS in production. `sameSite: 'lax'` allows the cookie on top-level navigations (so links from emails work) but blocks it on cross-origin POST requests (mitigating CSRF). `path: '/'` makes the cookie available on all routes.

**Why `sameSite: 'lax'` instead of `'strict'`?** Strict would block the cookie on any navigation from an external site. If a user clicks a link to your app from their email client, they'd land on the sign-in page even though they have a valid session. Lax allows GET requests from external origins while still blocking cross-origin form submissions.

## Session Verification for Middleware

The `getSession` function above uses `cookies()` from `next/headers`, which only works in Server Components and Server Actions. Middleware can't use it. Middleware receives the raw `NextRequest` object and needs to read cookies directly.

We need a separate function for middleware:

```typescript
// src/lib/auth/verify-session.ts
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'inventra-session';

interface SessionPayload {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'warehouse_staff';
  expiresAt: number;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function verifySessionFromCookie(
  cookieValue: string | undefined,
): Promise<SessionPayload | null> {
  if (!cookieValue) return null;

  try {
    const { payload } = await jwtVerify(cookieValue, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
```

This file imports nothing from `next/headers`. It takes a raw cookie string and returns a payload or null. Edge-compatible.

## Middleware

The middleware replaces the old `proxy.ts`. Same job, different implementation.

```typescript
// middleware.ts (project root, NOT inside src/)
import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionFromCookie, SESSION_COOKIE_NAME } from '@/lib/auth/verify-session';

const PUBLIC_PATHS = ['/sign-in'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionFromCookie(cookieValue);

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Root redirect
  if (pathname === '/') {
    const target = session ? '/dashboard' : '/sign-in';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Unauthenticated user hitting a protected route
  if (!session && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting the sign-in page
  if (session && pathname.startsWith('/sign-in')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

The logic is identical to the old `proxy.ts`. Root redirects based on auth state. Protected routes redirect to sign-in. Authenticated users get bounced away from sign-in. The difference is that we're verifying a JWT locally instead of making a network call to Supabase.

One subtle but important thing: the `matcher` config in `export const config` and the early-return check at the top of the function overlap on purpose. The matcher is the primary filter—Next.js won't even invoke the middleware for static assets. The `pathname.includes('.')` check is a safety net for edge cases where the matcher pattern might miss something.

## Getting the Current User

Server actions need to know who's making the request. In the old system, that was `supabase.auth.getUser()`. In our system, it's a helper that reads the session cookie and fetches the full user record from the database.

```typescript
// src/lib/auth/get-current-user.ts
import { eq } from 'drizzle-orm';
import db from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth/session';

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
  imageUrl: string | null;
  role: 'admin' | 'manager' | 'warehouse_staff';
  status: 'active' | 'inactive' | 'suspended';
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      imageUrl: users.imageUrl,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || user.status !== 'active') return null;

  return user;
}
```

Why query the database instead of just reading the JWT payload? Because the JWT is a snapshot from when the user logged in. If an admin suspends a user's account, the JWT still says `status: 'active'` until it expires. The database check catches that. It also ensures we have fresh data for display name, avatar, and role changes.

This is a deliberate tradeoff. The middleware uses the JWT alone (fast, no DB hit) to decide if a request should proceed. Server actions use the JWT plus a database lookup (slower, but accurate) to get the actual user. The middleware is a gatekeeper. The server action is the source of truth.

## Role Checking

Some actions are restricted to certain roles. Admins can manage users. Managers can approve stock-in transactions. Warehouse staff can create stock-out requests but can't approve them.

```typescript
// src/lib/auth/require-role.ts
import { getCurrentUser } from './get-current-user';
import type { CurrentUser } from './get-current-user';

type Role = 'admin' | 'manager' | 'warehouse_staff';

type RequireRoleResult = { success: true; user: CurrentUser } | { success: false; error: string };

export async function requireRole(...allowedRoles: Role[]): Promise<RequireRoleResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  if (!allowedRoles.includes(user.role)) {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  return { success: true, user };
}
```

Usage in a server action:

```typescript
export async function deleteUser(userId: string) {
  const auth = await requireRole('admin');
  if (!auth.success) return auth;

  // Only admins reach this point
  // ...
}
```

The function returns a discriminated union, matching the convention from the original Inventra. If auth fails, the server action returns the error directly. No exceptions, no middleware magic. Explicit control flow.

## Sign-In Server Action

Now we wire everything together. The sign-in action validates input, checks credentials, and creates a session.

```typescript
// src/app/(auth)/sign-in/actions.ts
'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import db from '@/db';
import { users } from '@/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export type SignInResult = { success: true } | { success: false; error: string };

export async function signIn(formData: FormData): Promise<SignInResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.status !== 'active') {
      return {
        success: false,
        error: 'Your account has been deactivated. Contact an administrator.',
      };
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return { success: false, error: 'Invalid email or password.' };
    }

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update last login timestamp
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    return { success: true };
  } catch (error: unknown) {
    console.error('Sign-in error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
```

A few things to notice.

**Same error message for wrong email and wrong password.** `"Invalid email or password."` doesn't tell an attacker whether the email exists in the system. If we said `"No account found with that email"` vs `"Wrong password"`, an attacker could enumerate valid email addresses.

**Status check before password verification.** If the account is suspended or inactive, we reject the login immediately. We don't even check the password. No point hashing and comparing if the user can't log in regardless.

**`email.toLowerCase()`** — emails are case-insensitive per RFC 5321. Normalizing to lowercase prevents duplicate accounts and login confusion.

**`lastLoginAt` update** — a fire-and-forget update after successful login. We don't await this in the critical path, but since server actions are sequential by nature, it runs before the function returns. This gives admins visibility into active vs dormant accounts.

## Sign-Out Action

Short and sweet.

```typescript
// src/app/(auth)/sign-out/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { destroySession } from '@/lib/auth/session';

export async function signOut(): Promise<never> {
  await destroySession();
  redirect('/sign-in');
}
```

`destroySession` deletes the cookie. `redirect` sends the user to the sign-in page. The return type `never` tells TypeScript that this function never returns normally—it always throws a redirect.

## The Sign-In Page

The original sign-in page was heavily custom-styled. We're rebuilding it with Shadcn UI components. Cleaner code, same functionality.

```tsx
// src/app/(auth)/sign-in/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from './actions';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/dashboard';

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const result = await signIn(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-bg-secondary flex min-h-screen items-center justify-center px-4">
      <Card className="rounded-card w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your Inventra account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger/10 text-danger rounded-md px-4 py-3 text-sm">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-text-tertiary hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="rounded-button bg-primary hover:bg-primary-hover w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

The old form used `onSubmit` with `preventDefault` and called Supabase directly. The new form passes `FormData` to a server action. The server action validates, hashes, queries, and sets the cookie. The client just shows a loading state and handles the result.

We're using `useSearchParams` to read the `?next=` query parameter, same as the old implementation. After successful login, `router.replace(nextPath)` sends the user where they were trying to go. `router.refresh()` tells Next.js to re-run server components, which will now see the session cookie.

## Auth Layout

The auth layout is minimal. It just wraps the sign-in page (and any future auth pages like password reset) without the dashboard shell.

```tsx
// src/app/(auth)/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Inventra',
  description: 'Sign in to your Inventra account.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

No `UserProvider` here. Auth pages don't need user context. No sidebar, no header. Just the page content rendered inside the root layout.

## Dashboard Layout

The dashboard layout wraps every page under `/dashboard`. It checks authentication and provides user context to all client components underneath.

```tsx
// src/app/dashboard/layout.tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { UserProvider } from '@/contexts/UserContext';

export const metadata: Metadata = {
  title: {
    template: '%s | Inventra Dashboard',
    default: 'Overview | Inventra Dashboard',
  },
  description: 'Modern inventory management system for warehouses and businesses.',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <UserProvider user={user}>{children}</UserProvider>;
}
```

Two changes from the original.

First, this is now an async Server Component. The old layout was a plain component that rendered `<UserProvider>` and let the provider fetch user data on the client. Our new layout calls `getCurrentUser()` on the server and passes the result down. No client-side fetch. No loading spinner. The user data is available on the first render.

Second, the `redirect('/sign-in')` is a server-side redirect. If someone bypasses the middleware (unlikely, but possible), this catches them. Defense in depth.

The old layout also had `<html>` and `<body>` tags, which belong in the root layout (`src/app/layout.tsx`), not in a route group layout. We've corrected that. The dashboard layout only handles auth checking and context providing.

## User Context

The `UserContext` changes significantly. Instead of fetching data from Supabase on the client, it receives user data from the server via props.

```tsx
// src/contexts/UserContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  imageUrl: string | null;
  role: 'admin' | 'manager' | 'warehouse_staff';
  status: 'active' | 'inactive' | 'suspended';
}

interface UserContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  user: initialUser,
  children,
}: {
  user: UserProfile;
  children: ReactNode;
}) {
  const [user, setUser] = useState<UserProfile>(initialUser);

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return <UserContext.Provider value={{ user, updateUser }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
```

Gone: the `loading` state. Gone: the `refetch` function. Gone: the Supabase client import. Gone: the `useEffect` that fires a network request.

The user data arrives from the server, fully loaded, before the component mounts. If a client component needs to optimistically update the displayed user (like after editing their profile), the `updateUser` function handles that. But the source of truth is always the server. A page refresh re-runs the dashboard layout, re-fetches from the database, and passes fresh data.

## Using Auth in Server Actions

Here's the pattern every server action follows in the new system. Compare it to the old one:

**Old pattern (Supabase):**

```typescript
const supabase = await createClient();
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();
if (authError || !user) return { success: false, error: 'Unauthorized.' };
```

**New pattern:**

```typescript
import { getCurrentUser } from '@/lib/auth/get-current-user';

const user = await getCurrentUser();
if (!user) return { success: false, error: 'Authentication required.' };
```

Or with role checking:

```typescript
import { requireRole } from '@/lib/auth/require-role';

const auth = await requireRole('admin', 'manager');
if (!auth.success) return auth;

const { user } = auth;
// proceed with user...
```

One import. One function call. One check. The auth is local—no network request to an external service.

## Seeding an Admin User

The database is empty. You need at least one user to log in. Create a seed script:

```typescript
// src/db/seed-admin.ts
import { hashPassword } from '@/lib/auth/password';
import db from '@/db';
import { users } from '@/db/schema';

async function seedAdmin() {
  const email = 'admin@inventra.com';
  const password = 'Admin123!';

  const passwordHash = await hashPassword(password);

  await db
    .insert(users)
    .values({
      email,
      passwordHash,
      displayName: 'System Admin',
      role: 'admin',
      status: 'active',
    })
    .onConflictDoNothing();

  console.log(`Admin user seeded: ${email}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

Add a script to `package.json`:

```json
{
  "scripts": {
    "db:seed-admin": "tsx src/db/seed-admin.ts"
  }
}
```

Run it:

```bash
bun run db:seed-admin
```

Now you can log in with `admin@inventra.com` / `Admin123!`. Change these credentials immediately in production. Obviously.

## Security Considerations

We've covered most of this inline, but let's consolidate.

**Password storage.** bcrypt with cost factor 12. The password is never stored in plain text, never logged, never included in error messages. The `passwordHash` column contains the bcrypt output, which includes the algorithm identifier, cost factor, salt, and hash in a single string.

**Session cookies.** HTTP-only (no JavaScript access), Secure (HTTPS only in production), SameSite=Lax (blocks cross-origin POST requests). The JWT payload contains only the user ID, email, and role. No sensitive data. If someone intercepts the cookie, they get a session token—not a password.

**CSRF protection.** SameSite=Lax cookies are the first line of defense. Cross-origin POST requests won't include the cookie. Server actions in Next.js also have built-in CSRF protection: they check the `Origin` header against the app's hostname. Combined, these two mechanisms cover the standard CSRF attack vectors.

**Timing attacks.** `bcrypt.compare` is constant-time. It doesn't short-circuit when it finds a mismatch. An attacker can't measure response times to determine how many characters of the password are correct.

**User enumeration.** The sign-in action returns the same error message for both "email not found" and "wrong password." An attacker can't probe the system to discover valid email addresses.

**Session expiry.** Tokens expire after 7 days. The `exp` claim in the JWT is checked by `jwtVerify`. Expired tokens are rejected automatically. There's no refresh token mechanism. When the session expires, the user logs in again. For an internal tool with a small user base, this simplicity is worth it.

**Rate limiting.** We haven't implemented rate limiting in this chapter. It belongs at the infrastructure layer (Nginx, Cloudflare, or a Next.js middleware counter backed by Redis). Chapter 10 covers Redis. When you get there, adding a rate limiter to the sign-in action is straightforward: increment a counter keyed by IP address, reject requests after N failures within a time window.

**Account lockout.** Not implemented here, but the pattern is simple. Add a `failed_login_attempts` column and a `locked_until` timestamp to the users table. Increment the counter on failed logins. Lock the account after 5 failures. Reset on successful login. The schema change is a one-column migration.

## File Summary

Here's every file we created or modified in this chapter:

```
src/lib/auth/
├── password.ts           # hashPassword, verifyPassword
├── session.ts            # createSession, getSession, destroySession
├── verify-session.ts     # verifySessionFromCookie (Edge-compatible)
├── get-current-user.ts   # getCurrentUser helper for server actions
└── require-role.ts       # Role-based access control

src/app/(auth)/
├── layout.tsx            # Auth pages layout (metadata only)
└── sign-in/
    ├── page.tsx           # Sign-in form with Shadcn UI
    └── actions.ts         # signIn server action

src/app/(auth)/sign-out/
└── actions.ts             # signOut server action

src/app/dashboard/
└── layout.tsx             # Auth check + UserProvider with server data

src/contexts/
└── UserContext.tsx         # Client context (receives data from server)

src/db/
└── seed-admin.ts          # Admin user seed script

middleware.ts              # Root middleware for route protection
```

Twelve files. No external auth service. No SDK. No black box.

The auth system is self-contained. Passwords are hashed locally. Sessions are JWTs stored in cookies. The middleware runs on the Edge without database calls. Server actions verify against the database. The client receives user data from the server and never makes its own auth requests.

Chapter 7 builds on this foundation. We'll create the dashboard shell—sidebar navigation, header with user menu, sign-out button—using the `useUser` hook and the Shadcn components we installed in Chapter 5. The auth system we just built makes all of that possible.
