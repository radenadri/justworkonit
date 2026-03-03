# Chapter 1: Introduction

Inventra is a warehouse and inventory management application. It tracks products across multiple warehouses, handles stock-in and stock-out operations, manages user roles, and provides dashboard analytics. It works. It runs in production. Real users depend on it.

So why rewrite it?

Because "working" and "well-built" aren't the same thing. Inventra was built fast, with pragmatic shortcuts that made sense at the time. Supabase handled auth, database queries, and file storage all in one. Components were hand-built from scratch. Validation happened by hope and convention. Tests didn't exist. The app grew, and the cracks started showing.

This book is a reconstruction project. We'll take a real, production SaaS application apart piece by piece, understand why each part was built the way it was, and rebuild it with better tools, clearer architecture, and actual quality guarantees. No toy todo apps. No contrived examples. A real codebase with real problems.

## What Inventra Does

Before we tear anything down, let's understand what we're working with.

Inventra manages warehouse operations for businesses that need to track physical inventory. The feature set covers user management with three roles (admin, manager, warehouse staff), warehouse management with capacity tracking, a full product catalog with multi-image uploads and automatic SKU generation, stock-in operations for receiving inventory with document attachments, and stock-out operations with a reservation system to prevent overselling.

On top of all that sits a dashboard with Chart.js-powered analytics: stock level trends, activity timelines, category distribution breakdowns. Every table in the database is protected by Row-Level Security policies. The schema has 9 tables, 9 enum types, 6 triggers and functions, 23 indexes, and 6 storage buckets.

It's a real application. That's the point.

## The Problem with the Current Stack

The existing Inventra codebase runs on Next.js 16 with App Router, React 19, TypeScript in strict mode, Tailwind CSS v4, and Supabase for everything backend. There are no API routes. All data flows through Server Actions. State management uses React Context, `useState`, and custom hooks. No external state library.

This stack has clear strengths. Server Actions simplify the data layer. Strict TypeScript catches bugs early. Tailwind keeps styling consistent. But several decisions create friction as the app scales.

**Supabase as the entire backend** means business logic lives partly in the database (triggers, RLS policies, functions) and partly in Server Actions. There's no ORM, so queries are string-based and hard to refactor. Changing a column name means hunting through action files with find-and-replace.

**No validation layer** is the most dangerous gap. Form data hits Server Actions with no schema validation. TypeScript types provide compile-time safety, but at runtime, anything can arrive. A malformed request won't crash the compiler. It'll crash the query.

**Hand-built UI components** work fine until you need consistency at scale. Every modal, every form input, every dropdown was built from scratch. That's a lot of surface area to maintain, and it means new features take longer than they should.

**Zero tests.** No unit tests, no integration tests, no test runner installed. The app relies entirely on TypeScript's type checker and manual QA. For a production SaaS handling inventory data, that's a real risk.

**No caching strategy.** Every dashboard load runs fresh queries. Every page render hits the database. As the dataset grows, response times will climb.

## The New Stack

We're keeping what works and replacing what doesn't. Here's the comparison:

| Concern         | Current                          | New                                 | Why                                                                    |
| --------------- | -------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| Runtime         | Node.js + npm                    | Bun                                 | Faster installs, faster scripts, native TypeScript execution           |
| Framework       | Next.js 16 App Router            | Next.js 16 App Router               | No change needed. App Router with Server Actions is solid              |
| UI Library      | React 19                         | React 19                            | Same                                                                   |
| Language        | TypeScript 5 strict              | TypeScript 5 strict                 | Same                                                                   |
| Styling         | Tailwind CSS v4                  | Tailwind CSS v4                     | Same                                                                   |
| Components      | Custom hand-built                | Shadcn UI                           | Pre-built, accessible, customizable. Owned in your codebase            |
| Database Access | Supabase client (direct queries) | Drizzle ORM + PostgreSQL            | Type-safe queries, migrations as code, no vendor lock-in               |
| Auth            | Supabase Auth                    | Custom auth with session management | Full control over session handling, token rotation, role logic         |
| Validation      | None                             | Zod 4                               | Runtime schema validation on every Server Action input                 |
| Caching         | None                             | Redis                               | Dashboard queries cached, stock lookups cached, real-time invalidation |
| Testing         | None                             | Vitest                              | Fast, modern test runner with first-class TypeScript support           |
| Deployment      | Docker + docker-compose          | Docker + docker-compose             | Same setup, updated for Bun and Redis                                  |

A few decisions deserve extra context.

**Drizzle over Prisma.** Drizzle generates SQL that's predictable and readable. Its query API maps closely to SQL, which means less abstraction to debug. It's also lighter. For an app that already has a well-defined schema, Drizzle fits better than Prisma's heavier model-generation approach.

**Shadcn over building from scratch.** Shadcn isn't a component library you install from npm. It copies component source code directly into your project. You own every line. You can modify anything. But you start with accessible, well-tested defaults instead of a blank file.

**Zod 4 specifically.** Zod 4 shipped with major performance improvements and a smaller bundle. Since we're adding validation to every Server Action, the runtime cost matters. Zod 4's parser is significantly faster than v3.

**Redis for caching** is straightforward. Dashboard analytics queries aggregate data across multiple tables. Running those on every page load is wasteful. Redis gives us sub-millisecond reads for data that changes infrequently, with simple invalidation when stock operations modify the underlying data.

## What You'll Learn

This book follows a twelve-chapter arc that mirrors a real reconstruction project.

After this introduction, **Chapter 2** does a deep feature analysis of the existing Inventra app. Every screen, every flow, every edge case documented. **Chapter 3** maps the current architecture: how Server Actions connect to the database, how auth flows work, how components compose together.

**Chapter 4** takes the existing database schema and redesigns it with Drizzle ORM. We'll write migrations, define relations, and set up type-safe query patterns. **Chapter 5** scaffolds the new project from scratch with Bun, wires up Next.js 16, Drizzle, Shadcn, Zod 4, and Redis.

**Chapters 6 through 9** are the construction phase. Auth gets rebuilt in Chapter 6. Categories and warehouses come together in Chapter 7 as our first Shadcn-powered modules. Chapter 8 tackles the product catalog with its multi-image upload complexity. Chapter 9 implements stock-in and stock-out operations with their business rules around reservations and capacity tracking.

**Chapter 10** rebuilds the dashboard and reporting layer with Redis-cached analytics. **Chapter 11** retrofits the entire app with Vitest tests, covering Server Actions, form validation, and component behavior. **Chapter 12** packages everything for production deployment with Docker.

Each chapter includes the reasoning behind decisions, not just the code. You'll understand _why_ we structure things a certain way, not just _how_.

## Who This Book Is For

You should be comfortable with React and TypeScript. You don't need to be an expert, but you should know what a hook does, how props flow, and why TypeScript's strict mode matters. Experience with Next.js helps but isn't required. We explain App Router conventions as we go.

If you've ever inherited a codebase that works but feels fragile, this book is for you. If you've built something quickly and now want to rebuild it properly, this is that process documented start to finish. If you want to see how production decisions get made in a real app with real constraints, keep reading.

Chapter 2 starts with the app as it exists today.
