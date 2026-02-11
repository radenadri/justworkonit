# Focus WordPress Setup Guide

> Panduan lengkap setup WordPress sebagai Headless CMS untuk platform Focus

---

## 📋 Project Overview

**Focus** adalah platform reading modern yang terinspirasi dari Medium. Platform ini menggunakan arsitektur **Headless CMS** dimana WordPress bertindak sebagai backend content management, dan Next.js 16 sebagai frontend yang menampilkan konten ke pembaca.

| Aspek | Detail |
|-------|--------|
| **Nama Proyek** | Focus - A Modern Reading Platform |
| **Arsitektur** | Headless CMS (WordPress + Next.js) |
| **Target** | Publisher kecil & penulis independen |
| **Fitur Utama** | Multi-author publishing, reading experience, bookmarks, follow system |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        PENGGUNA                               │
│                     (Browser/Mobile)                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                           │
│                                                               │
│   Next.js 16 (App Router)                                     │
│   ├── shadcn/ui + Tailwind CSS 4                             │
│   ├── Server Components (SSR/SSG)                            │
│   ├── Client Components (interaktif)                         │
│   └── SWR / React Query (data fetching)                      │
│                                                               │
│   Domain: https://focus.com                                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ REST API (HTTPS)
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND CMS (VPS)                           │
│                                                               │
│   WordPress (Headless Mode)                                   │
│   ├── REST API (/wp-json/wp/v2/*)                            │
│   ├── ACF Free 6.1+ (custom fields)                         │
│   ├── JWT Authentication                                      │
│   ├── Custom Endpoints (/wp-json/focus/v1/*)                 │
│   └── Yoast SEO (sitemap, meta)                              │
│                                                               │
│   Domain: https://api.focus.com                               │
│                                                               │
│   ┌──────────────────────────────────────────────────────┐   │
│   │              MySQL 8.0 Database                       │   │
│   │   ├── wp_posts (articles, authors)                    │   │
│   │   ├── wp_users (readers, writers, editors)            │   │
│   │   ├── wp_comments                                     │   │
│   │   ├── wp_postmeta (ACF fields)                        │   │
│   │   └── wp_focus_follows (custom table)                 │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Tech Stack

### Backend (WordPress CMS)

| Komponen | Versi | Keterangan |
|----------|-------|------------|
| **Ubuntu** | 22.04 LTS | Server OS |
| **PHP** | 8.2 | Dengan ekstensi yang diperlukan |
| **MySQL** | 8.0 | Database utama |
| **Nginx** | 1.24+ | Web server & reverse proxy |
| **WordPress** | Latest | Headless CMS |
| **ACF** | 6.1+ (Free) | Custom fields |
| **Redis** | 7.x | Object cache |

### Frontend (Next.js)

| Komponen | Versi | Keterangan |
|----------|-------|------------|
| **Next.js** | 16.x | App Router, Server Components |
| **React** | 19.x | UI library |
| **shadcn/ui** | Feb 2026 | Component library |
| **Tailwind CSS** | 4.x | Styling |
| **Vercel** | - | Hosting & deployment |

---

## 🔌 Required Plugins

Semua plugin yang digunakan adalah **gratis/open-source**.

| Plugin | Versi | Purpose | Required |
|--------|-------|---------|----------|
| **ACF (Advanced Custom Fields)** | 6.1+ Free | Custom fields untuk posts, users, categories | ✅ |
| **ACF to REST API** | Latest | Expose ACF fields via REST API endpoint | ✅ |
| **JWT Authentication for WP REST API** | Latest | JWT token authentication untuk frontend | ✅ |
| **WP REST Cache** | Latest | Cache REST API responses | ✅ |
| **Yoast SEO** | Latest | SEO management, sitemap, REST API support | ✅ |
| **WP REST User** | Latest | Extended user registration endpoint | ✅ |
| **Redis Object Cache** | Latest | Object caching dengan Redis | ⭐ Recommended |

> **Catatan:** Tidak ada plugin berbayar. ACF yang digunakan adalah versi **Free** (bukan Pro).

---

## 📚 Document Structure

Panduan ini terdiri dari 8 dokumen yang harus diikuti secara berurutan:

| No. | File | Konten |
|-----|------|--------|
| 00 | `00-overview.md` | Overview proyek, arsitektur, tech stack (file ini) |
| 01 | `01-server-setup.md` | Setup server Ubuntu, PHP, MySQL, Nginx |
| 02 | `02-wordpress-headless-config.md` | Instalasi WordPress & konfigurasi headless |
| 03 | `03-acf-field-groups.md` | ACF Free setup, field groups, CPT Author |
| 04 | `04-rest-api-jwt-auth.md` | REST API configuration, CORS, JWT auth |
| 05 | `05-custom-endpoints.md` | Custom endpoint: featured, follow, register, dll |
| 06 | `06-user-roles-permissions.md` | User roles, capabilities, permission matrix |
| 07 | `07-security-performance.md` | Security hardening, caching, backup |

---

## ✅ Prerequisites

Sebelum memulai, pastikan Anda memiliki:

### Server
- [ ] VPS dengan minimal 2 GB RAM, 2 vCPU
- [ ] Ubuntu 22.04 LTS terinstall
- [ ] Akses root atau sudo user
- [ ] SSH access

### Domain & SSL
- [ ] Domain untuk CMS backend (contoh: `api.focus.com`)
- [ ] Domain untuk frontend (contoh: `focus.com`)
- [ ] SSL certificate (Let's Encrypt / Cloudflare)

### Tools
- [ ] WP-CLI terinstall di server
- [ ] Git (opsional, untuk version control)

### Akun
- [ ] Akun Vercel (untuk deploy Next.js frontend)
- [ ] Akun email (untuk WordPress admin dan notifikasi)

---

## 🚀 Getting Started

Mulai dari **dokumen 01 (Server Setup)** dan ikuti secara berurutan hingga dokumen 07.

Setelah semua setup WordPress selesai, Anda bisa melanjutkan ke pengembangan frontend Next.js 16 menggunakan panduan terpisah.

---

## 📋 Quick Reference

### API Endpoints

| Endpoint | Tipe |
|----------|------|
| `/wp-json/wp/v2/posts` | Core WordPress |
| `/wp-json/wp/v2/categories` | Core WordPress |
| `/wp-json/wp/v2/users` | Core WordPress |
| `/wp-json/wp/v2/comments` | Core WordPress |
| `/wp-json/wp/v2/media` | Core WordPress |
| `/wp-json/acf/v3/posts/{id}` | ACF Plugin |
| `/wp-json/jwt-auth/v1/token` | JWT Auth Plugin |
| `/wp-json/focus/v1/*` | Custom Focus |

### User Roles

| Role | WP Role | Akses |
|------|---------|-------|
| Guest | - | Read only |
| Reader | Subscriber | + Bookmark, comment, follow |
| Writer | Author | + Create/edit articles |
| Editor | Editor | + Manage featured, approve |
| Admin | Administrator | Full access |
