# 02. WordPress Headless Configuration

> Konfigurasi WordPress sebagai Headless CMS - disable frontend, enable REST API

---

## 📋 Daftar Isi

1. [Konsep Headless WordPress](#1-konsep-headless-wordpress)
2. [Disable WordPress Frontend](#2-disable-wordpress-frontend)
3. [Konfigurasi REST API](#3-konfigurasi-rest-api)
4. [Install Required Plugins](#4-install-required-plugins)
5. [WordPress Settings](#5-wordpress-settings)
6. [Disable Fitur Tidak Diperlukan](#6-disable-fitur-tidak-diperlukan)
7. [wp-config.php Security](#7-wp-configphp-security)

---

## 1️⃣ Konsep Headless WordPress

Dalam arsitektur **headless**, WordPress hanya berfungsi sebagai:

| WordPress Handles | WordPress Does NOT Handle |
|-------------------|--------------------------|
| Content management (posts, pages) | Frontend rendering |
| User management & authentication | Template/theme rendering |
| Media uploads & management | Visitor-facing HTML/CSS/JS |
| REST API responses | SEO meta rendering |
| Custom fields (ACF) | Client-side routing |

**Semua frontend rendering ditangani oleh Next.js 16 yang di-host di Vercel.**

```
┌──────────────┐     REST API      ┌──────────────────┐
│   Next.js    │ ◄────────────────► │    WordPress     │
│   (Vercel)   │   /wp-json/...    │  (VPS - Headless)│
│              │                    │                  │
│  - Rendering │                    │  - Content CRUD  │
│  - Routing   │                    │  - User Auth     │
│  - SSR/SSG   │                    │  - Media Upload  │
│  - SEO       │                    │  - ACF Fields    │
└──────────────┘                    └──────────────────┘
```

---

## 2️⃣ Disable WordPress Frontend

### Step 1: Buat Minimal Theme

WordPress membutuhkan setidaknya satu theme aktif. Buat theme minimal yang redirect semua request frontend ke wp-admin.

```bash
mkdir -p /var/www/focus/wp-content/themes/focus-headless
```

**style.css:**

```css
/*
 Theme Name: Focus Headless
 Description: Minimal theme for headless WordPress - redirects all frontend to admin
 Version: 1.0
 Author: Focus Team
*/
```

**index.php:**

```php
<?php
// Redirect semua frontend request ke wp-admin
wp_redirect(admin_url());
exit;
```

**functions.php:**

```php
<?php
/**
 * Focus Headless Theme Functions
 * Minimal theme untuk WordPress headless CMS
 */

// Redirect semua frontend request ke admin (kecuali REST API dan AJAX)
add_action('template_redirect', function () {
    if (!is_admin() && !wp_doing_ajax() && !defined('REST_REQUEST')) {
        wp_redirect(admin_url());
        exit;
    }
});

// Remove unnecessary frontend head elements
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wp_shortlink_wp_head');
remove_action('wp_head', 'adjacent_posts_rel_link_wp_head', 10);
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('admin_print_scripts', 'print_emoji_detection_script');
remove_action('admin_print_styles', 'print_emoji_styles');

// Disable RSS feeds
add_action('do_feed', function () {
    wp_die('Feed tidak tersedia. Gunakan REST API.', '', ['response' => 404]);
}, 1);
add_action('do_feed_rdf', function () {
    wp_die('Feed tidak tersedia.', '', ['response' => 404]);
}, 1);
add_action('do_feed_rss', function () {
    wp_die('Feed tidak tersedia.', '', ['response' => 404]);
}, 1);
add_action('do_feed_rss2', function () {
    wp_die('Feed tidak tersedia.', '', ['response' => 404]);
}, 1);
add_action('do_feed_atom', function () {
    wp_die('Feed tidak tersedia.', '', ['response' => 404]);
}, 1);

// Remove feed links from head
remove_action('wp_head', 'feed_links', 2);
remove_action('wp_head', 'feed_links_extra', 3);
```

### Step 2: Aktifkan Theme

```bash
wp theme activate focus-headless
```

### Step 3: Verifikasi

```bash
# Frontend harus redirect ke wp-admin
curl -I https://api.focus.com/
# Expected: HTTP/1.1 302 Found, Location: .../wp-admin/

# REST API harus tetap berfungsi
curl https://api.focus.com/wp-json/wp/v2/posts
# Expected: JSON response dengan daftar posts
```

---

## 3️⃣ Konfigurasi REST API

### Enable REST API

REST API sudah enabled secara default di WordPress 4.7+. Verifikasi:

```bash
curl https://api.focus.com/wp-json/
# Response: JSON dengan daftar available endpoints
```

### wp-config.php Constants

Tambahkan constants berikut ke `wp-config.php`:

```php
/** ======================
 *  HEADLESS CONFIGURATION
 *  ====================== */

// Site URLs
define('WP_HOME', 'https://api.focus.com');
define('WP_SITEURL', 'https://api.focus.com');

// JWT Authentication
define('JWT_AUTH_SECRET_KEY', 'your-very-strong-secret-key-minimum-32-characters');
define('JWT_AUTH_CORS_ENABLE', true);

// Frontend URL (untuk email links, redirects)
define('FOCUS_FRONTEND_URL', 'https://focus.com');
```

**Generate JWT Secret Key:**

```bash
# Gunakan openssl untuk generate random key
openssl rand -base64 64
```

### Nginx Configuration untuk REST API

Pastikan Nginx meneruskan Authorization header ke PHP:

```nginx
server {
    listen 443 ssl http2;
    server_name api.focus.com;

    root /var/www/focus;
    index index.php;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/api.focus.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.focus.com/privkey.pem;

    # CORS Headers untuk REST API
    location /wp-json/ {
        # CORS - Allow frontend domain
        set $cors_origin "";
        if ($http_origin ~* "^https://(focus\.com|localhost:3000)$") {
            set $cors_origin $http_origin;
        }

        add_header Access-Control-Allow-Origin $cors_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-WP-Nonce" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Max-Age 3600 always;

        # Handle preflight requests
        if ($request_method = OPTIONS) {
            return 204;
        }

        try_files $uri $uri/ /index.php$is_args$args;
    }

    # WordPress permalinks
    location / {
        try_files $uri $uri/ /index.php$is_args$args;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;

        # Pass Authorization header ke PHP (CRITICAL untuk JWT)
        fastcgi_param HTTP_AUTHORIZATION $http_authorization;
    }

    # Block akses ke file sensitif
    location ~* /(\.git|\.env|wp-config\.php|readme\.html|license\.txt) {
        deny all;
    }

    # Block XML-RPC
    location = /xmlrpc.php {
        deny all;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Test dan reload Nginx:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4️⃣ Install Required Plugins

### Via WP-CLI (Recommended)

```bash
# ACF (Advanced Custom Fields) - Free version
wp plugin install advanced-custom-fields --activate

# ACF to REST API - Expose ACF fields via REST
wp plugin install acf-to-rest-api --activate

# JWT Authentication for WP REST API
wp plugin install jwt-authentication-for-wp-rest-api --activate

# WP REST Cache - Cache API responses
wp plugin install wp-rest-cache --activate

# Yoast SEO - SEO management + REST API support
wp plugin install wordpress-seo --activate
```

### Verifikasi Instalasi

```bash
wp plugin list --status=active
```

Output yang diharapkan:

```
+-------------------------------------------------+--------+--------+-----------+
| name                                            | status | update | version   |
+-------------------------------------------------+--------+--------+-----------+
| advanced-custom-fields                          | active | none   | 6.x.x    |
| acf-to-rest-api                                 | active | none   | 3.x.x    |
| jwt-authentication-for-wp-rest-api              | active | none   | 1.x.x    |
| wp-rest-cache                                   | active | none   | 2.x.x    |
| wordpress-seo                                   | active | none   | 24.x     |
+-------------------------------------------------+--------+--------+-----------+
```

### Plugin Configuration Notes

| Plugin | Post-Install Action |
|--------|---------------------|
| ACF | Field groups akan disetup di doc 03 |
| ACF to REST API | Otomatis aktif, tidak perlu konfigurasi |
| JWT Auth | Butuh JWT_AUTH_SECRET_KEY di wp-config.php |
| WP REST Cache | Settings → WP REST Cache → Set TTL |
| Yoast SEO | SEO → General → Features → REST API enabled |

---

## 5️⃣ WordPress Settings

### Via WP-CLI

```bash
# General Settings
wp option update blogname "Focus"
wp option update blogdescription "A Modern Reading Platform"
wp option update timezone_string "Asia/Jakarta"
wp option update date_format "Y-m-d"
wp option update time_format "H:i"

# Permalink Structure (IMPORTANT: harus /%postname%/)
wp rewrite structure '/%postname%/' --hard
wp rewrite flush

# Reading Settings
wp option update posts_per_page 10
wp option update show_on_front "posts"

# Discussion Settings
wp option update default_comment_status "open"
wp option update comment_moderation 1
wp option update comment_previously_approved 1
wp option update thread_comments 1
wp option update thread_comments_depth 3

# Media Settings
wp option update thumbnail_size_w 300
wp option update thumbnail_size_h 300
wp option update medium_size_w 768
wp option update medium_size_h 768
wp option update large_size_w 1024
wp option update large_size_h 1024
wp option update uploads_use_yearmonth_folders 1
```

### Via WP Admin

Jika prefer menggunakan admin panel:

1. **Settings → General**: Site Title = "Focus", Tagline kosong
2. **Settings → Permalinks**: Post name (/%postname%/)
3. **Settings → Reading**: Blog pages show 10 posts
4. **Settings → Discussion**: Enable comments, moderate first comment
5. **Settings → Media**: Sizes sesuai tabel di atas

---

## 6️⃣ Disable Fitur Tidak Diperlukan

Buat **Must-Use Plugin** untuk disable fitur yang tidak diperlukan dalam setup headless:

```bash
mkdir -p /var/www/focus/wp-content/mu-plugins
```

**File: `wp-content/mu-plugins/focus-headless-cleanup.php`**

```php
<?php
/**
 * Plugin Name: Focus Headless Cleanup
 * Description: Disable fitur WordPress yang tidak diperlukan untuk headless setup
 * Version: 1.0
 */

// Disable XML-RPC (tidak diperlukan, security risk)
add_filter('xmlrpc_enabled', '__return_false');
add_filter('xmlrpc_methods', '__return_empty_array');

// Remove XML-RPC from HTTP headers
add_filter('wp_headers', function ($headers) {
    unset($headers['X-Pingback']);
    return $headers;
});

// Disable Pingbacks
add_filter('pings_open', '__return_false', 10, 2);

// Remove REST API user enumeration untuk non-admin
add_filter('rest_endpoints', function ($endpoints) {
    if (!current_user_can('list_users')) {
        // Izinkan /users/me tapi block /users listing
        if (isset($endpoints['/wp/v2/users'])) {
            unset($endpoints['/wp/v2/users']);
        }
    }
    return $endpoints;
});

// Disable embed discovery links
remove_action('wp_head', 'wp_oembed_add_discovery_links');
remove_action('wp_head', 'wp_oembed_add_host_js');
remove_action('wp_head', 'rest_output_link_wp_head');

// Disable application passwords (kita pakai JWT)
add_filter('wp_is_application_passwords_available', '__return_false');

// Reduce heartbeat interval di admin (hemat resources)
add_action('admin_enqueue_scripts', function () {
    wp_localize_script('heartbeat', 'heartbeatSettings', [
        'interval' => 60, // Default 15, naikkan ke 60 detik
    ]);
});

// Remove default dashboard widgets yang tidak diperlukan
add_action('wp_dashboard_setup', function () {
    remove_meta_box('dashboard_primary', 'dashboard', 'side');      // WordPress Events
    remove_meta_box('dashboard_quick_press', 'dashboard', 'side');  // Quick Draft
    remove_meta_box('dashboard_right_now', 'dashboard', 'normal');  // At a Glance
});

// Disable author archives (kita handle di frontend)
add_action('template_redirect', function () {
    if (is_author()) {
        wp_redirect(admin_url());
        exit;
    }
});

// Add CORS support via WordPress (backup jika Nginx tidak handle)
add_action('rest_api_init', function () {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function ($value) {
        $origin = get_http_origin();
        $allowed_origins = [
            'https://focus.com',
            'http://localhost:3000',
        ];

        if (defined('FOCUS_FRONTEND_URL')) {
            $allowed_origins[] = FOCUS_FRONTEND_URL;
        }

        if (in_array($origin, $allowed_origins, true)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
            header('Access-Control-Allow-Credentials: true');
        }

        return $value;
    });
});
```

---

## 7️⃣ wp-config.php Security

Tambahkan konfigurasi keamanan ke `wp-config.php`:

```php
/** ======================
 *  SECURITY CONSTANTS
 *  ====================== */

// Disable file editing dari admin panel
define('DISALLOW_FILE_EDIT', true);

// Allow plugin/theme updates (tapi tidak bisa edit kode)
define('DISALLOW_FILE_MODS', false);

// Auto-update hanya minor versions
define('WP_AUTO_UPDATE_CORE', 'minor');

// Limit post revisions (hemat database)
define('WP_POST_REVISIONS', 10);

// Force SSL untuk admin
define('FORCE_SSL_ADMIN', true);

// Disable WP Cron (gunakan server cron sebagai gantinya)
define('DISABLE_WP_CRON', true);

// Empty trash setelah 7 hari (default 30)
define('EMPTY_TRASH_DAYS', 7);

// Memory limits
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');

/** ======================
 *  DEBUGGING (Production)
 *  ====================== */

define('WP_DEBUG', false);
define('WP_DEBUG_LOG', true);      // Log ke wp-content/debug.log
define('WP_DEBUG_DISPLAY', false); // Jangan tampilkan di browser
define('SCRIPT_DEBUG', false);
```

### Setup Server Cron (pengganti WP Cron)

```bash
# Edit crontab
crontab -e

# Tambahkan: jalankan WP Cron setiap 5 menit
*/5 * * * * cd /var/www/focus && php wp-cron.php > /dev/null 2>&1
```

---

## ✅ Checklist Konfigurasi

| Item | Command Verifikasi | Expected |
|------|-------------------|----------|
| Theme headless aktif | `wp theme list --status=active` | focus-headless |
| Frontend redirect | `curl -I https://api.focus.com/` | 302 → wp-admin |
| REST API aktif | `curl https://api.focus.com/wp-json/` | JSON endpoints |
| Plugins aktif | `wp plugin list --status=active` | 5 plugins |
| Permalinks | `wp option get permalink_structure` | /%postname%/ |
| JWT Secret | Cek wp-config.php | JWT_AUTH_SECRET_KEY defined |
| CORS headers | `curl -H "Origin: https://focus.com" -I https://api.focus.com/wp-json/` | Access-Control headers |

---

## 📌 Langkah Selanjutnya

Setelah konfigurasi dasar selesai, lanjutkan ke:
- **[03. ACF Field Groups Setup](03-acf-field-groups.md)** - Setup custom fields untuk artikel, author, dan kategori
