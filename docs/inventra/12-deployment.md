# Chapter 12: Deployment

Eleven chapters of rebuilding, and the application runs on `localhost:3000`. That's where most tutorials stop. The rewrite stays on a developer's machine, the Docker section gets skimmed, and the whole thing slowly rots in a Git repository nobody deploys.

Not this one. This chapter takes the rebuilt Inventra from a development environment to a production server. We'll write every config file, every Dockerfile instruction, every CI/CD workflow step. You'll have a deployment pipeline that builds, validates, and ships the application with a single `git push`.

## What Exists Today

The original Inventra ships with a working Docker setup. It's minimal but functional:

```dockerfile
# Original Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

The Compose file runs just the app container, pulling environment variables from a `.env` file and mapping port 3000. No database container. No cache layer. Supabase hosted both externally, so the container only needed network access to the internet.

Our rebuilt stack has different needs. PostgreSQL runs alongside the app. Redis handles caching. Drizzle migrations must execute before the application accepts traffic. Bun replaces Node.js as the runtime. The entire infrastructure story changes.

## The Production Dockerfile

Bun publishes official Docker images at `oven/bun`. We use the Debian-based image instead of Alpine because `pg` (the PostgreSQL driver) compiles native bindings that occasionally break on musl libc. The size difference is about 40MB — worth it to avoid cryptic build failures.

```dockerfile
# Dockerfile

# ---- Stage 1: Install dependencies ----
FROM oven/bun:1.2-slim AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production=false

# ---- Stage 2: Build the application ----
FROM oven/bun:1.2-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN bun run build

# ---- Stage 3: Production image ----
FROM oven/bun:1.2-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Drizzle migration files for the migrate service
COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Create upload directory
RUN mkdir -p /app/uploads && chown appuser:appgroup /app/uploads

USER appuser

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
```

Three stages. The first installs every dependency including dev dependencies — the build needs them. The second runs `bun run build`, which triggers `next build` and produces the standalone output. The third copies only the artifacts needed at runtime: the standalone server, static assets, public files, and migration files.

We create a non-root user because running containers as root is a security liability. If an attacker gains code execution inside the container, they get root access to the container's filesystem and network namespace. The `appuser` account limits the blast radius.

The migration files are included in the image so the migrate service (defined in Compose) can use the same image without needing a separate build. One image, two roles.

## Next.js Configuration

The standalone output mode is what makes the small final image possible. Without it, Next.js expects the entire `node_modules` directory at runtime.

```typescript
// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'ioredis', 'bcryptjs'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  poweredByHeader: false,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
};

export default nextConfig;
```

`output: 'standalone'` tells Next.js to trace all dependencies and copy only the files the server needs into `.next/standalone`. The result is a self-contained directory with its own `server.js` entry point and a minimal `node_modules`. `poweredByHeader: false` strips the `X-Powered-By: Next.js` header — no reason to advertise your framework to port scanners. The security headers block clickjacking, MIME sniffing, and unnecessary browser API access.

We're not setting `Content-Security-Policy` here because it requires careful tuning per deployment. A strict CSP that blocks inline scripts will break Next.js's hydration unless you configure nonce-based script loading. We'll handle that at the reverse proxy level instead, where the policy can reference the correct domain.

## Docker Compose

The full stack needs four services: the Next.js application, PostgreSQL, Redis, and a one-shot migration runner.

```yaml
# docker-compose.yml

services:
  postgres:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_DB: inventra
      POSTGRES_USER: ${DB_USER:-inventra}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Database password is required}
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER:-inventra} -d inventra']
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    ports:
      - '6379:6379'
    volumes:
      - redisdata:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

  migrate:
    build:
      context: .
      dockerfile: Dockerfile
    command: bunx drizzle-kit migrate
    environment:
      DATABASE_URL: postgresql://${DB_USER:-inventra}:${DB_PASSWORD}@postgres:5432/inventra
    depends_on:
      postgres:
        condition: service_healthy
    restart: 'no'

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://${DB_USER:-inventra}:${DB_PASSWORD}@postgres:5432/inventra
      REDIS_URL: redis://redis:6379
      AUTH_SECRET: ${AUTH_SECRET:?Auth secret is required}
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
      UPLOAD_DIR: /app/uploads
    volumes:
      - uploads:/app/uploads
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    healthcheck:
      test: ['CMD-SHELL', 'curl -f http://localhost:3000/api/health || exit 1']
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s

volumes:
  pgdata:
  redisdata:
  uploads:
```

A few design decisions here deserve explanation.

**The migrate service uses the same image as the app.** It overrides the command to run `bunx drizzle-kit migrate` instead of starting the server. This avoids building a separate image just for migrations. The `restart: 'no'` policy means it runs once and exits. The `depends_on` condition ensures PostgreSQL is healthy before migrations attempt to connect.

**The app waits for migrations to complete.** The `service_completed_successfully` condition means Docker won't start the app container until the migrate container exits with code 0. If migrations fail, the app never starts. This prevents a half-migrated database from serving traffic.

**Redis uses LRU eviction.** The `--maxmemory 128mb --maxmemory-policy allkeys-lru` flags cap memory usage and evict the least-recently-used keys when the limit is reached. Our cache is designed for this — every cached value can be regenerated from PostgreSQL. Losing a cache entry means a slightly slower query, not data loss.

**Environment variables use `${VAR:?error}` syntax.** The `:?` modifier causes Compose to fail with an error message if the variable is unset. `DB_PASSWORD` and `AUTH_SECRET` must be provided. No accidentally running production with empty passwords.

For local development, the `docker-compose.dev.yml` from Chapter 5 is still the right choice — it runs only PostgreSQL and Redis without the app or migration containers, since you're running `bun --bun run dev` directly on your machine.

## The .dockerignore

Without this file, Docker sends your entire project directory (including `node_modules`, `.next`, and `.git`) as build context. That's slow and wasteful.

```dockerignore
# .dockerignore

node_modules
.next
.git
.gitignore
*.md
.env*
.vscode
.idea
coverage
.turbo
docker-compose*.yml
nginx/
```

## Environment Configuration

Every environment variable the application needs, documented in one place:

```bash
# .env.example

# ---- Database ----
# PostgreSQL connection string
# For Docker Compose: uses service name 'postgres' as hostname
DATABASE_URL=postgresql://inventra:changeme@localhost:5432/inventra
DB_USER=inventra
DB_PASSWORD=changeme

# ---- Redis ----
# Redis connection string
# For Docker Compose: uses service name 'redis' as hostname
REDIS_URL=redis://localhost:6379

# ---- Authentication ----
# JWT signing secret — generate with: openssl rand -base64 32
AUTH_SECRET=generate-a-real-secret-at-least-32-characters

# ---- Application ----
# Public URL of the application (used for redirects, CORS, cookies)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ---- File Uploads ----
# Directory for uploaded files (product images, documents)
# In Docker: mount as a volume at this path
UPLOAD_DIR=./uploads
```

For production, never commit a `.env` file. Pass variables through your deployment platform's secrets management: Docker Compose reads from the shell environment, Vercel has its dashboard, and CI/CD pipelines inject them as encrypted secrets.

Generate `AUTH_SECRET` with `openssl rand -base64 32`. Don't use a passphrase you'll remember. It should be random, long, and treated as a secret no human ever types manually.

## Database Migrations in Production

Drizzle Kit handles migrations with a straightforward approach. During development, `drizzle-kit generate` creates SQL migration files from schema changes. In production, `drizzle-kit migrate` applies pending migrations in order.

The migrate service in our Compose file runs `bunx drizzle-kit migrate` before the app starts. This is the safest strategy: migrations complete or the deploy fails. There's no window where the app runs against an outdated schema.

For rollbacks, Drizzle doesn't generate down migrations automatically. If you need to undo a migration, write a manual SQL script and execute it directly. In practice, most rollbacks involve deploying an older version of the app alongside a forward-compatible migration rather than trying to reverse a schema change. Additive changes (new columns, new tables) are naturally backward compatible. Destructive changes (dropping columns, renaming tables) should be split into two deploys: first deploy code that stops using the old column, then deploy the migration that drops it.

**Seeding the initial admin.** The first time you deploy, the users table is empty. Create a seed script:

```typescript
// src/db/seed-admin.ts

import db from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@inventra.app';
  const password = process.env.ADMIN_PASSWORD ?? 'changeme';

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (existing) {
    console.log(`Admin user ${email} already exists. Skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    name: 'Admin',
    email,
    passwordHash,
    role: 'admin',
    isActive: true,
  });

  console.log(`Admin user created: ${email}`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
```

Run it after the first migration: `bun run src/db/seed-admin.ts`. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` as environment variables — don't deploy with the defaults.

## Reverse Proxy with Nginx

Running Next.js directly on port 443 is possible but not advisable. A reverse proxy handles TLS termination, HTTP/2, static asset caching, and rate limiting — things Next.js can do but shouldn't be responsible for in production.

```nginx
# nginx/nginx.conf

upstream inventra {
    server app:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name inventra.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name inventra.example.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' https://fonts.gstatic.com; connect-src 'self'" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting zone (defined in http block — add to main nginx.conf)
    # limit_req_zone $binary_remote_addr zone=app:10m rate=30r/s;
    # limit_req zone=app burst=50 nodelay;

    client_max_body_size 25M;

    location / {
        proxy_pass http://inventra;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Cache static assets aggressively
    location /_next/static/ {
        proxy_pass http://inventra;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        proxy_pass http://inventra;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

Replace `inventra.example.com` with your domain. Get certificates from Let's Encrypt using Certbot, or mount them from your host. The `client_max_body_size 25M` matches the file upload limits we set in the product management module.

If you'd rather skip Nginx configuration entirely, Caddy handles TLS automatically with zero config files. Run `caddy reverse-proxy --from inventra.example.com --to localhost:3000` and it provisions certificates from Let's Encrypt on its own. For teams that don't want to manage Nginx configs, Caddy is the better choice.

## CI/CD with GitHub Actions

The pipeline runs on every push to `main`. It lints, type-checks, runs tests, builds the Docker image, and deploys.

```yaml
# .github/workflows/deploy.yml

name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  validate:
    name: Lint, Type Check, Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.2'

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Type check
        run: bunx tsc --noEmit

      - name: Run tests
        run: bun run test

  build-and-push:
    name: Build Docker Image
    needs: validate
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Server
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/inventra
            docker compose pull app
            docker compose up -d --no-deps app
            docker image prune -f
```

The workflow splits into three jobs. `validate` runs on every push and PR — fast feedback for developers. `build-and-push` only runs on pushes to `main`, not on PRs. It builds the Docker image and pushes it to GitHub Container Registry. `deploy` SSHs into the production server and pulls the new image.

The deploy step uses `--no-deps` to restart only the app container. PostgreSQL and Redis keep running. Data persists in Docker volumes. The `docker image prune -f` cleans up old images to prevent disk bloat.

You'll need four secrets in your GitHub repository settings: `DEPLOY_HOST` (your server's IP or hostname), `DEPLOY_USER` (the SSH username), `DEPLOY_SSH_KEY` (the private key), and the built-in `GITHUB_TOKEN` (automatically provided by Actions for registry access).

## Production Hardening

A few operational concerns that don't fit neatly into a config file.

**PostgreSQL backups.** Add a cron job on the host machine that dumps the database daily. `pg_dump` through the Docker container works fine:

```bash
# /etc/cron.d/inventra-backup
0 3 * * * root docker exec inventra-postgres-1 pg_dump -U inventra inventra | gzip > /backups/inventra-$(date +\%Y\%m\%d).sql.gz
```

Keep seven days of backups locally. Sync them to object storage (S3, B2, or any provider that supports lifecycle policies) for long-term retention.

**File uploads.** The Docker volume `uploads` stores product images and stock-in documents on the host's filesystem. This works for single-server deployments. If you scale to multiple servers behind a load balancer, you need shared storage — either an NFS mount or S3-compatible object storage with presigned URLs. The application code already isolates file operations in utility functions, so switching storage backends doesn't require touching every action file.

**Monitoring.** At minimum, watch three things: container health (Docker's built-in healthchecks handle this), disk usage (PostgreSQL and uploads can grow quietly), and error rates (pipe Next.js stdout/stderr to a log aggregator). For a small deployment, `docker compose logs -f app` and a Prometheus node exporter cover the basics. For larger operations, consider Grafana + Loki for log aggregation and Grafana dashboards for Redis hit rates and PostgreSQL query latency.

## Vercel Deployment Alternative

Not every team wants to manage servers. Vercel deploys Next.js applications with zero infrastructure management, and since we're using App Router with Server Actions, the compatibility is strong.

The tradeoff: you lose control of the database and cache layer. Vercel doesn't run PostgreSQL or Redis for you. You'll need external providers.

**Database:** Neon (generous free tier, serverless PostgreSQL, branching for preview deployments), Supabase (yes, we removed their SDK, but their hosted PostgreSQL is still a solid managed database), or Railway (simple pricing, no connection pooling headaches).

**Cache:** Upstash Redis (serverless, pay-per-request, works from Edge Runtime). Update the Redis client configuration to use Upstash's REST-based SDK instead of `ioredis`:

```bash
bun add @upstash/redis
```

```typescript
// src/lib/upstash.ts (Vercel-specific alternative)

import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

**Environment variables** go in the Vercel dashboard under Project Settings > Environment Variables. Set `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, and the Upstash credentials. Mark server-only variables (everything except `NEXT_PUBLIC_*`) as available only in "Production" and "Preview" environments.

**Middleware compatibility.** Our auth middleware uses `jose` for JWT verification, which runs on the Edge Runtime without issues. If your middleware imported `pg` or `bcryptjs`, it would fail — but ours doesn't. The middleware only reads cookies and verifies JWT signatures, both of which work at the edge.

No `vercel.json` is needed unless you want custom rewrites or headers beyond what `next.config.ts` provides. For most deployments, connecting your GitHub repository to Vercel and setting environment variables is the entire process.

## Full Deployment Checklist

Before you push to production for the first time:

1. Generate a strong `AUTH_SECRET` with `openssl rand -base64 32`
2. Set a real `DB_PASSWORD` — not the development default
3. Verify `NEXT_PUBLIC_APP_URL` matches your production domain
4. Run migrations: `docker compose up migrate`
5. Seed the admin user: `docker compose exec app bun run src/db/seed-admin.ts`
6. Change the admin password immediately after first login
7. Enable TLS through Nginx/Caddy or your cloud provider
8. Set up automated PostgreSQL backups
9. Verify healthchecks pass: `docker compose ps` should show all services as "healthy"
10. Test the full flow: sign in, create a warehouse, add a product, process a stock-in

---

Twelve chapters. We started with an application that worked but couldn't scale — Supabase handling everything, no validation, no tests, no caching, hand-built components throughout. We tore it down to the requirements and rebuilt it piece by piece.

The new Inventra has type-safe database queries with Drizzle. Zod validates every input at runtime. Shadcn provides accessible, customizable components. Redis caches expensive queries. Vitest proves the code works. And now, Docker packages the whole thing into a reproducible deployment that runs the same way on every server.

The stack we chose — Bun, Next.js 16, Drizzle, Shadcn, Zod 4, Redis, Vitest — represents where the TypeScript ecosystem is heading in 2026. These tools are fast, composable, and they stay out of your way. They don't force you into abstractions you'll regret. They don't lock you into a vendor. The code you've written throughout this book is yours. Every component, every migration, every server action.

Take it. Ship it. Build something with it.
