# 04. REST API & JWT Authentication

> Konfigurasi WordPress REST API, CORS, dan JWT Authentication untuk Next.js frontend

---

## 📋 Daftar Isi

1. [WordPress REST API Overview](#1-wordpress-rest-api-overview)
2. [JWT Authentication Setup](#2-jwt-authentication-setup)
3. [CORS Configuration](#3-cors-configuration)
4. [Login & Auth Flow](#4-login--auth-flow)
5. [REST API Response Optimization](#5-rest-api-response-optimization)
6. [WP REST Cache](#6-wp-rest-cache)
7. [Testing Endpoints](#7-testing-endpoints)

---

## 1️⃣ WordPress REST API Overview

WordPress REST API v2 adalah versi stabil yang digunakan Focus untuk komunikasi antara Next.js frontend dan WordPress backend.

### Base URL

```
https://api.focus.com/wp-json/wp/v2/
```

### Endpoint yang Digunakan Focus

#### Core Endpoints

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/wp-json/wp/v2/posts` | GET | No | Daftar artikel |
| `/wp-json/wp/v2/posts` | POST | JWT | Buat artikel baru |
| `/wp-json/wp/v2/posts/{id}` | PUT | JWT | Update artikel |
| `/wp-json/wp/v2/posts?slug={slug}` | GET | No | Artikel by slug |
| `/wp-json/wp/v2/posts?categories={id}` | GET | No | Artikel by kategori |
| `/wp-json/wp/v2/posts?author={id}` | GET | No | Artikel by author |
| `/wp-json/wp/v2/posts?search={query}` | GET | No | Cari artikel |
| `/wp-json/wp/v2/posts?status=draft` | GET | JWT | Draft user |
| `/wp-json/wp/v2/categories` | GET | No | Daftar kategori |
| `/wp-json/wp/v2/users/{id}` | GET | No | Profil author |
| `/wp-json/wp/v2/users/me` | GET | JWT | Current user |
| `/wp-json/wp/v2/media` | POST | JWT | Upload media |
| `/wp-json/wp/v2/comments` | GET | No | Daftar komentar |
| `/wp-json/wp/v2/comments` | POST | Mixed | Submit komentar |

#### ACF Endpoints

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/wp-json/acf/v3/posts/{id}` | GET | No | ACF fields for post |
| `/wp-json/acf/v3/categories/{id}` | GET | No | ACF fields for category |
| `/wp-json/acf/v3/authors/{id}` | GET | No | ACF fields for author CPT |

#### Authentication Endpoints

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/wp-json/jwt-auth/v1/token` | POST | Login (get JWT) |
| `/wp-json/jwt-auth/v1/token/validate` | POST | Validasi token |
| `/wp-json/jwt-auth/v1/token/refresh` | POST | Refresh token |

#### Custom Focus Endpoints

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/wp-json/focus/v1/register` | POST | No | Registrasi user |
| `/wp-json/focus/v1/forgot-password` | POST | No | Reset password |
| `/wp-json/focus/v1/featured` | GET | No | Featured articles |
| `/wp-json/focus/v1/related/{id}` | GET | No | Artikel terkait |
| `/wp-json/focus/v1/authors/popular` | GET | No | Popular authors |
| `/wp-json/focus/v1/follow/{author_id}` | POST | JWT | Follow author |
| `/wp-json/focus/v1/unfollow/{author_id}` | DELETE | JWT | Unfollow author |
| `/wp-json/focus/v1/following` | GET | JWT | Daftar following |
| `/wp-json/focus/v1/my-drafts` | GET | JWT | Draft user |
| `/wp-json/focus/v1/my-stats` | GET | JWT | Statistik writer |
| `/wp-json/focus/v1/newsletter/subscribe` | POST | No | Newsletter |

### Verifikasi REST API

```bash
# Test REST API aktif
curl -s https://api.focus.com/wp-json/ | python3 -m json.tool | head -20

# Test posts endpoint
curl -s https://api.focus.com/wp-json/wp/v2/posts | python3 -m json.tool
```

---

## 2️⃣ JWT Authentication Setup

### Install Plugin

```bash
wp plugin install jwt-authentication-for-wp-rest-api --activate
```

### Konfigurasi wp-config.php

Tambahkan constant berikut **sebelum** baris `/* That's all, stop editing! */`:

```php
/**
 * JWT Authentication Configuration
 */

// Secret key untuk signing JWT tokens (WAJIB diganti!)
// Generate: openssl rand -base64 64
define('JWT_AUTH_SECRET_KEY', 'your-super-secret-key-generate-with-openssl');

// Enable CORS support untuk JWT plugin
define('JWT_AUTH_CORS_ENABLE', true);
```

### Generate Secret Key

```bash
# Generate strong secret key
openssl rand -base64 64
# Output: RaNd0mStr1ngTh4tI5V3ryL0ng4ndS3cur3...

# Atau gunakan PHP
php -r "echo base64_encode(random_bytes(64)) . PHP_EOL;"
```

> ⚠️ **PENTING**: Secret key harus unik dan rahasia. Jangan gunakan default key. Simpan di wp-config.php saja, jangan commit ke repository.

### Konfigurasi Nginx untuk Authorization Header

Secara default, Nginx tidak meneruskan `Authorization` header ke PHP-FPM. Tambahkan konfigurasi ini:

```nginx
server {
    # ... konfigurasi server lainnya ...

    location ~ \.php$ {
        # Pastikan Authorization header diteruskan ke PHP
        fastcgi_param HTTP_AUTHORIZATION $http_authorization;
        
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

Atau jika menggunakan Apache, tambahkan ke `.htaccess`:

```apache
RewriteEngine on
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]

# Atau metode alternatif
SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
```

### Restart Services

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl restart php8.2-fpm
```

---

## 3️⃣ CORS Configuration

CORS (Cross-Origin Resource Sharing) **wajib** dikonfigurasi karena frontend (Next.js di Vercel) dan backend (WordPress di VPS) berada di domain berbeda.

### Metode 1: Via Nginx (Recommended)

```nginx
server {
    listen 443 ssl http2;
    server_name api.focus.com;
    
    # ... SSL configuration ...

    # CORS Headers untuk REST API
    location /wp-json/ {
        # Allow specific origin (JANGAN gunakan * di production!)
        set $cors_origin "";
        
        if ($http_origin = "https://focus.com") {
            set $cors_origin "https://focus.com";
        }
        if ($http_origin = "http://localhost:3000") {
            set $cors_origin "http://localhost:3000";
        }
        
        add_header Access-Control-Allow-Origin $cors_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Max-Age 3600 always;
        
        # Handle preflight OPTIONS requests
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin $cors_origin;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 3600;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        try_files $uri $uri/ /index.php?$args;
    }
}
```

### Metode 2: Via WordPress (functions.php atau mu-plugin)

Buat file `wp-content/mu-plugins/focus-cors.php`:

```php
<?php
/**
 * Focus CORS Configuration
 * 
 * Mengatur CORS headers untuk REST API agar bisa diakses
 * dari Next.js frontend di domain berbeda.
 */

add_action('rest_api_init', function () {
    // Remove default CORS handler
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    
    // Add custom CORS handler
    add_filter('rest_pre_serve_request', function ($value) {
        $origin = get_http_origin();
        
        // Allowed origins
        $allowed_origins = [
            'https://focus.com',
            'https://www.focus.com',
            'http://localhost:3000',  // Development
        ];
        
        if (in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Max-Age: 3600');
        }
        
        return $value;
    });
}, 15);

// Handle preflight OPTIONS request
add_action('init', function () {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        $allowed_origins = [
            'https://focus.com',
            'https://www.focus.com',
            'http://localhost:3000',
        ];
        
        if (in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Max-Age: 3600');
            header('Content-Length: 0');
            header('Content-Type: text/plain');
            exit(0);
        }
    }
});
```

> 💡 **Tip**: Gunakan Nginx untuk CORS di production (lebih performant), dan WordPress mu-plugin untuk development/testing.

---

## 4️⃣ Login & Auth Flow

### Login - Get JWT Token

```bash
# POST /wp-json/jwt-auth/v1/token
curl -X POST https://api.focus.com/wp-json/jwt-auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "writer@focus.com",
    "password": "securepassword123"
  }'
```

**Response (200 OK):**

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS5mb2N1cy5jb20iLCJpYXQiOjE3MDcyMzQ1NjcsIm5iZiI6MTcwNzIzNDU2NywiZXhwIjoxNzA3ODM5MzY3LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.abc123",
  "user_email": "writer@focus.com",
  "user_nicename": "writer",
  "user_display_name": "Focus Writer"
}
```

**Error Response (403):**

```json
{
  "code": "[jwt_auth] incorrect_password",
  "message": "The password you entered is incorrect.",
  "data": {
    "status": 403
  }
}
```

### Validate Token

```bash
# POST /wp-json/jwt-auth/v1/token/validate
curl -X POST https://api.focus.com/wp-json/jwt-auth/v1/token/validate \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1Q..."
```

**Response (200 OK):**

```json
{
  "code": "jwt_auth_valid_token",
  "data": {
    "status": 200
  }
}
```

### Authenticated Request

```bash
# GET current user profile
curl https://api.focus.com/wp-json/wp/v2/users/me \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1Q..."

# POST create article (Writer role required)
curl -X POST https://api.focus.com/wp-json/wp/v2/posts \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1Q..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Artikel Pertama Saya",
    "content": "<p>Konten artikel...</p>",
    "excerpt": "Ringkasan artikel",
    "status": "draft",
    "categories": [3]
  }'

# POST upload media
curl -X POST https://api.focus.com/wp-json/wp/v2/media \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1Q..." \
  -F "file=@/path/to/image.jpg" \
  -F "title=Cover Image" \
  -F "alt_text=Article cover"
```

### Token Handling di Next.js

Token management flow untuk frontend:

```
1. User login → POST /jwt-auth/v1/token
2. Simpan token di httpOnly cookie (via Next.js API route)
3. Setiap request ke WP API → attach Authorization: Bearer {token}
4. Token expired → redirect ke /login
5. Logout → clear cookie
```

### Extend Token Expiry

Default JWT token berlaku 7 hari. Untuk mengubah, tambahkan filter:

```php
// wp-content/mu-plugins/focus-jwt-config.php
<?php
/**
 * Extend JWT token expiry to 30 days
 */
add_filter('jwt_auth_expire', function ($expire, $issued_at) {
    // 30 hari dalam detik
    return $issued_at + (DAY_IN_SECONDS * 30);
}, 10, 2);

/**
 * Add custom data to JWT token response
 */
add_filter('jwt_auth_token_before_dispatch', function ($data, $user) {
    $data['user_id'] = $user->ID;
    $data['user_role'] = $user->roles[0] ?? 'subscriber';
    $data['user_avatar'] = get_avatar_url($user->ID, ['size' => 96]);
    
    return $data;
}, 10, 2);
```

---

## 5️⃣ REST API Response Optimization

Secara default, WP REST API response berisi banyak data yang tidak dibutuhkan, dan tidak menyertakan ACF fields secara langsung. Kita perlu mengoptimalkan response.

### Tambahkan ACF Fields ke Post Response

Buat file `wp-content/mu-plugins/focus-rest-fields.php`:

```php
<?php
/**
 * Focus REST API Field Optimization
 * 
 * Menambahkan custom fields langsung ke response standard
 * sehingga tidak perlu request terpisah ke /acf/v3/
 */

add_action('rest_api_init', function () {
    
    // === POST FIELDS ===
    
    // Reading Time
    register_rest_field('post', 'reading_time', [
        'get_callback' => function ($post) {
            return (int) get_field('reading_time', $post['id']) ?: 1;
        },
        'schema' => [
            'type' => 'integer',
            'description' => 'Estimated reading time in minutes',
        ],
    ]);
    
    // Featured Article
    register_rest_field('post', 'featured', [
        'get_callback' => function ($post) {
            return (bool) get_field('featured_article', $post['id']);
        },
        'schema' => [
            'type' => 'boolean',
            'description' => 'Whether this is a staff pick / featured article',
        ],
    ]);
    
    // SEO Fields
    register_rest_field('post', 'seo', [
        'get_callback' => function ($post) {
            return [
                'meta_title' => get_field('seo_meta_title', $post['id']) ?: '',
                'meta_description' => get_field('seo_meta_description', $post['id']) ?: '',
            ];
        },
        'schema' => [
            'type' => 'object',
            'description' => 'SEO metadata',
        ],
    ]);
    
    // Category with color (embed category ACF fields)
    register_rest_field('post', 'primary_category', [
        'get_callback' => function ($post) {
            $categories = wp_get_post_categories($post['id'], ['fields' => 'all']);
            if (empty($categories)) return null;
            
            $cat = $categories[0];
            return [
                'id' => $cat->term_id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'color' => get_field('category_color', 'category_' . $cat->term_id) ?: '#6B7280',
            ];
        },
        'schema' => [
            'type' => 'object',
            'description' => 'Primary category with color',
        ],
    ]);
    
    // === USER FIELDS ===
    
    // Author Role/Title
    register_rest_field('user', 'author_role_title', [
        'get_callback' => function ($user) {
            return get_field('author_role', 'user_' . $user['id']) ?: '';
        },
        'schema' => [
            'type' => 'string',
            'description' => 'Author professional role/title',
        ],
    ]);
    
    // Author Bio (from ACF, not WP description)
    register_rest_field('user', 'author_bio', [
        'get_callback' => function ($user) {
            return get_field('author_bio', 'user_' . $user['id']) ?: get_the_author_meta('description', $user['id']);
        },
        'schema' => [
            'type' => 'string',
            'description' => 'Author biography',
        ],
    ]);
    
    // Social Links
    register_rest_field('user', 'social_links', [
        'get_callback' => function ($user) {
            return [
                'twitter' => get_field('twitter_url', 'user_' . $user['id']) ?: '',
                'linkedin' => get_field('linkedin_url', 'user_' . $user['id']) ?: '',
                'website' => get_field('website_url', 'user_' . $user['id']) ?: '',
            ];
        },
        'schema' => [
            'type' => 'object',
            'description' => 'Author social media links',
        ],
    ]);
    
    // === CATEGORY FIELDS ===
    
    register_rest_field('category', 'color', [
        'get_callback' => function ($category) {
            return get_field('category_color', 'category_' . $category['id']) ?: '#6B7280';
        },
        'schema' => [
            'type' => 'string',
            'description' => 'Category badge color (hex)',
        ],
    ]);
    
    register_rest_field('category', 'icon', [
        'get_callback' => function ($category) {
            $icon = get_field('category_icon', 'category_' . $category['id']);
            return $icon ? wp_get_attachment_url($icon) : '';
        },
        'schema' => [
            'type' => 'string',
            'description' => 'Category icon URL',
        ],
    ]);
});
```

### Contoh Response Setelah Optimisasi

**GET /wp-json/wp/v2/posts?slug=hello-world&_embed:**

```json
{
  "id": 1,
  "title": { "rendered": "Hello World" },
  "slug": "hello-world",
  "excerpt": { "rendered": "<p>Ringkasan artikel...</p>" },
  "content": { "rendered": "<p>Konten artikel lengkap...</p>" },
  "date": "2026-02-10T10:00:00",
  "modified": "2026-02-10T12:00:00",
  "status": "publish",
  "author": 2,
  "categories": [3],
  "featured_media": 45,
  "reading_time": 5,
  "featured": true,
  "seo": {
    "meta_title": "Hello World - Focus",
    "meta_description": "Artikel pertama di platform Focus"
  },
  "primary_category": {
    "id": 3,
    "name": "Technology",
    "slug": "technology",
    "color": "#3B82F6"
  },
  "_embedded": {
    "author": [{
      "id": 2,
      "name": "John Writer",
      "slug": "john-writer",
      "avatar_urls": { "96": "https://..." },
      "author_role_title": "Senior Writer",
      "author_bio": "Tech writer with 10 years experience",
      "social_links": {
        "twitter": "https://twitter.com/johnwriter",
        "linkedin": "https://linkedin.com/in/johnwriter",
        "website": "https://johnwriter.com"
      }
    }]
  }
}
```

### Hide Sensitive User Data

```php
/**
 * Remove sensitive fields from user REST API response
 */
add_filter('rest_prepare_user', function ($response, $user, $request) {
    $data = $response->get_data();
    
    // Remove email from public responses
    if (!current_user_can('list_users')) {
        unset($data['email']);
    }
    
    // Remove capabilities and extra_capabilities
    unset($data['capabilities']);
    unset($data['extra_capabilities']);
    
    $response->set_data($data);
    return $response;
}, 10, 3);
```

---

## 6️⃣ WP REST Cache

### Install Plugin

```bash
wp plugin install wp-rest-cache --activate
```

### Konfigurasi

Setelah aktivasi, buka **Settings → WP REST Cache** di wp-admin:

| Setting | Value | Keterangan |
|---------|-------|------------|
| Cache Timeout | 3600 | 1 jam untuk public endpoints |
| Cache Auth Requests | No | Jangan cache authenticated requests |
| Auto Flush | Yes | Flush cache saat post diupdate |
| Show Cache Headers | Yes | Header X-WP-REST-Cache untuk debugging |

### Cache Control via Code

```php
// wp-content/mu-plugins/focus-cache-config.php
<?php

/**
 * Customize REST Cache behavior
 */

// Skip cache for specific endpoints
add_filter('wp_rest_cache_skip', function ($skip, $request_uri) {
    // Never cache authenticated endpoints
    $no_cache_patterns = [
        '/focus/v1/my-',
        '/focus/v1/follow',
        '/focus/v1/following',
        '/wp/v2/users/me',
    ];
    
    foreach ($no_cache_patterns as $pattern) {
        if (strpos($request_uri, $pattern) !== false) {
            return true;
        }
    }
    
    return $skip;
}, 10, 2);
```

### Flush Cache via WP-CLI

```bash
# Flush semua REST cache
wp rest-cache flush

# Flush via transient (alternative)
wp transient delete --all
```

---

## 7️⃣ Testing Endpoints

### Script Test Lengkap

```bash
#!/bin/bash
# test-api.sh - Test semua Focus API endpoints

API_URL="https://api.focus.com/wp-json"

echo "=== Testing Focus REST API ==="
echo ""

# 1. Test REST API root
echo "1. REST API Root:"
curl -s -o /dev/null -w "%{http_code}" $API_URL/
echo ""

# 2. Test posts
echo "2. Posts (public):"
curl -s -o /dev/null -w "%{http_code}" $API_URL/wp/v2/posts
echo ""

# 3. Test categories
echo "3. Categories:"
curl -s -o /dev/null -w "%{http_code}" $API_URL/wp/v2/categories
echo ""

# 4. Test users
echo "4. Users:"
curl -s -o /dev/null -w "%{http_code}" $API_URL/wp/v2/users
echo ""

# 5. Test JWT login
echo "5. JWT Login:"
TOKEN=$(curl -s -X POST $API_URL/jwt-auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token','FAILED'))")
echo "Token: ${TOKEN:0:50}..."

# 6. Test authenticated endpoint
echo "6. Users/me (authenticated):"
curl -s -o /dev/null -w "%{http_code}" $API_URL/wp/v2/users/me \
  -H "Authorization: Bearer $TOKEN"
echo ""

# 7. Test ACF fields
echo "7. ACF Fields (post 1):"
curl -s -o /dev/null -w "%{http_code}" $API_URL/acf/v3/posts/1
echo ""

# 8. Test CORS
echo "8. CORS Headers:"
curl -s -I -X OPTIONS $API_URL/wp/v2/posts \
  -H "Origin: https://focus.com" \
  -H "Access-Control-Request-Method: GET" \
  2>/dev/null | grep -i "access-control"

echo ""
echo "=== Done ==="
```

### Penggunaan

```bash
chmod +x test-api.sh
./test-api.sh
```

### Expected Results

| Test | Expected Status |
|------|----------------|
| REST API Root | 200 |
| Posts (public) | 200 |
| Categories | 200 |
| Users | 200 |
| JWT Login | 200 + token |
| Users/me | 200 |
| ACF Fields | 200 |
| CORS Headers | Access-Control headers present |

---

## ✅ Checklist

- [ ] JWT Authentication plugin terinstall dan aktif
- [ ] JWT_AUTH_SECRET_KEY di-set di wp-config.php (bukan default!)
- [ ] JWT_AUTH_CORS_ENABLE = true
- [ ] Nginx meneruskan Authorization header ke PHP-FPM
- [ ] CORS headers dikonfigurasi untuk domain frontend
- [ ] OPTIONS preflight request di-handle dengan benar
- [ ] Custom REST fields (reading_time, featured, social_links) terdaftar
- [ ] WP REST Cache aktif dengan konfigurasi yang tepat
- [ ] Sensitive user data di-hide dari public response
- [ ] Test script berjalan dengan semua status 200

---

**Selanjutnya**: [05. Custom REST API Endpoints →](./05-custom-endpoints.md)
