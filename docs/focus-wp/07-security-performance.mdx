# 07. Security & Performance

> Hardening keamanan dan optimasi performa WordPress Headless untuk Focus platform

---

## 📋 Daftar Isi

1. [Security Hardening](#1-security-hardening)
2. [Nginx Security Configuration](#2-nginx-security-configuration)
3. [WordPress Security Constants](#3-wordpress-security-constants)
4. [Rate Limiting](#4-rate-limiting)
5. [PHP & OPcache Optimization](#5-php--opcache-optimization)
6. [MySQL Optimization](#6-mysql-optimization)
7. [Object Cache dengan Redis](#7-object-cache-dengan-redis)
8. [REST API Caching](#8-rest-api-caching)
9. [Nginx FastCGI Cache](#9-nginx-fastcgi-cache)
10. [Monitoring & Maintenance](#10-monitoring--maintenance)
11. [Backup Strategy](#11-backup-strategy)

---

## 1️⃣ Security Hardening

### Disable Fitur yang Tidak Diperlukan

Buat file `wp-content/mu-plugins/focus-security.php`:

```php
<?php
/**
 * Focus Platform - Security Hardening
 * 
 * File: wp-content/mu-plugins/focus-security.php
 * 
 * Karena WordPress digunakan sebagai Headless CMS,
 * banyak fitur frontend yang bisa di-disable untuk keamanan.
 */

// =============================================
// 1. Disable XML-RPC (tidak diperlukan untuk headless)
// =============================================
add_filter('xmlrpc_enabled', '__return_false');
add_filter('wp_headers', function ($headers) {
    unset($headers['X-Pingback']);
    return $headers;
});

// =============================================
// 2. Disable pingbacks & trackbacks
// =============================================
add_filter('pings_open', '__return_false');

// =============================================
// 3. Remove WordPress version dari header
// =============================================
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');

// =============================================
// 4. Remove emoji scripts (tidak diperlukan di API)
// =============================================
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('admin_print_scripts', 'print_emoji_detection_script');
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('admin_print_styles', 'print_emoji_styles');
remove_filter('the_content_feed', 'wp_staticize_emoji');
remove_filter('comment_text_rss', 'wp_staticize_emoji');

// =============================================
// 5. Remove oEmbed discovery links
// =============================================
remove_action('wp_head', 'wp_oembed_add_discovery_links');

// =============================================
// 6. Remove REST API link dari header
// =============================================
remove_action('wp_head', 'rest_output_link_wp_head');
remove_action('template_redirect', 'rest_output_link_header', 11);

// =============================================
// 7. Remove RSD (Really Simple Discovery) link
// =============================================
remove_action('wp_head', 'rsd_link');

// =============================================
// 8. Remove Windows Live Writer manifest
// =============================================
remove_action('wp_head', 'wlwmanifest_link');

// =============================================
// 9. Disable user enumeration via REST API (non-admin)
// =============================================
add_filter('rest_user_query', function ($prepared_args) {
    if (!current_user_can('list_users')) {
        $prepared_args['has_published_posts'] = ['post'];
    }
    return $prepared_args;
});

// =============================================
// 10. Sanitize filenames on upload
// =============================================
add_filter('sanitize_file_name', function ($filename) {
    // Remove special characters
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '', $filename);
    return strtolower($filename);
});

// =============================================
// 11. Disable file editing dari admin
// =============================================
if (!defined('DISALLOW_FILE_EDIT')) {
    define('DISALLOW_FILE_EDIT', true);
}

// =============================================
// 12. Limit login attempts (basic)
// =============================================
function focus_limit_login_attempts($user, $username, $password) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $transient_key = 'login_attempts_' . md5($ip);
    $attempts = get_transient($transient_key) ?: 0;
    
    if ($attempts >= 5) {
        return new WP_Error('too_many_attempts', 
            'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.');
    }
    
    return $user;
}
add_filter('authenticate', 'focus_limit_login_attempts', 30, 3);

function focus_track_failed_login($username) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $transient_key = 'login_attempts_' . md5($ip);
    $attempts = get_transient($transient_key) ?: 0;
    set_transient($transient_key, $attempts + 1, 15 * MINUTE_IN_SECONDS);
}
add_action('wp_login_failed', 'focus_track_failed_login');

function focus_reset_login_attempts($username, $user) {
    $ip = $_SERVER['REMOTE_ADDR'];
    delete_transient('login_attempts_' . md5($ip));
}
add_action('wp_login', 'focus_reset_login_attempts', 10, 2);
```

---

## 2️⃣ Nginx Security Configuration

### Security Headers

Tambahkan ke Nginx server block:

```nginx
server {
    listen 443 ssl http2;
    server_name api.focus.com;

    # =============================================
    # SSL Configuration
    # =============================================
    ssl_certificate /etc/letsencrypt/live/api.focus.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.focus.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # =============================================
    # Security Headers
    # =============================================
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # =============================================
    # Block access to sensitive files
    # =============================================
    location ~* /(wp-config\.php|readme\.html|license\.txt) {
        deny all;
        return 404;
    }

    # Block xmlrpc.php
    location = /xmlrpc.php {
        deny all;
        return 403;
    }

    # Block access to hidden files (.htaccess, .env, etc)
    location ~ /\. {
        deny all;
        return 404;
    }

    # Block PHP execution in uploads directory
    location ~* /wp-content/uploads/.*\.php$ {
        deny all;
        return 403;
    }

    # Block access to wp-includes PHP files
    location ~* /wp-includes/.*\.php$ {
        deny all;
        return 403;
    }

    # =============================================
    # WordPress & REST API
    # =============================================
    root /var/www/focus/wordpress;
    index index.php;

    # Main location
    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        
        # Pass Authorization header untuk JWT
        fastcgi_param HTTP_AUTHORIZATION $http_authorization;
    }

    # =============================================
    # CORS untuk REST API
    # =============================================
    location /wp-json/ {
        # CORS Headers
        add_header Access-Control-Allow-Origin "https://focus.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-WP-Nonce" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Max-Age "3600" always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://focus.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-WP-Nonce";
            add_header Access-Control-Max-Age "3600";
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }

        try_files $uri $uri/ /index.php?$args;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Limit upload size
    client_max_body_size 64M;
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name api.focus.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 3️⃣ WordPress Security Constants

### wp-config.php

```php
<?php
// =============================================
// Security Constants
// =============================================

// Disable file editor di admin
define('DISALLOW_FILE_EDIT', true);

// Allow plugin/theme installation (disable di production jika perlu)
define('DISALLOW_FILE_MODS', false);

// Auto-update hanya minor versions
define('WP_AUTO_UPDATE_CORE', 'minor');

// Limit post revisions
define('WP_POST_REVISIONS', 10);

// Force SSL untuk admin
define('FORCE_SSL_ADMIN', true);

// JWT Authentication
define('JWT_AUTH_SECRET_KEY', 'your-unique-strong-secret-key-minimum-32-chars');
define('JWT_AUTH_CORS_ENABLE', true);

// =============================================
// Security Keys & Salts
// =============================================
// Generate dari: https://api.wordpress.org/secret-key/1.1/salt/
define('AUTH_KEY',         'generate-unique-key-here');
define('SECURE_AUTH_KEY',  'generate-unique-key-here');
define('LOGGED_IN_KEY',    'generate-unique-key-here');
define('NONCE_KEY',        'generate-unique-key-here');
define('AUTH_SALT',        'generate-unique-key-here');
define('SECURE_AUTH_SALT', 'generate-unique-key-here');
define('LOGGED_IN_SALT',   'generate-unique-key-here');
define('NONCE_SALT',       'generate-unique-key-here');

// =============================================
// Debug (OFF di production)
// =============================================
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', true);        // Log ke wp-content/debug.log
define('WP_DEBUG_DISPLAY', false);   // Jangan tampilkan di browser
define('SCRIPT_DEBUG', false);

// =============================================
// Performance
// =============================================
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');
define('EMPTY_TRASH_DAYS', 30);
define('MEDIA_TRASH', true);
define('WP_CACHE', true);           // Enable object caching (Redis)
```

### File Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/focus/wordpress/

# Set directory permissions
sudo find /var/www/focus/wordpress/ -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /var/www/focus/wordpress/ -type f -exec chmod 644 {} \;

# Restrict wp-config.php
sudo chmod 400 /var/www/focus/wordpress/wp-config.php

# Uploads directory writable
sudo chmod 755 /var/www/focus/wordpress/wp-content/uploads/
```

---

## 4️⃣ Rate Limiting

### Nginx Rate Limiting

```nginx
# Di http block (nginx.conf)
http {
    # Rate limit zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=general:10m rate=60r/m;
    
    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=perip:10m;
}

# Di server block
server {
    # Rate limit untuk JWT login
    location = /wp-json/jwt-auth/v1/token {
        limit_req zone=login burst=3 nodelay;
        limit_req_status 429;
        try_files $uri /index.php?$args;
    }
    
    # Rate limit untuk REST API
    location /wp-json/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
        limit_conn perip 20;
        try_files $uri $uri/ /index.php?$args;
    }
    
    # Rate limit untuk wp-login.php
    location = /wp-login.php {
        limit_req zone=login burst=3 nodelay;
        limit_req_status 429;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

---

## 5️⃣ PHP & OPcache Optimization

### PHP-FPM Configuration

Edit `/etc/php/8.2/fpm/pool.d/www.conf`:

```ini
; Process management
pm = dynamic
pm.max_children = 20
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 10
pm.max_requests = 500

; Timeouts
request_terminate_timeout = 300
```

### OPcache Configuration

Edit `/etc/php/8.2/fpm/conf.d/10-opcache.ini`:

```ini
; Enable OPcache
opcache.enable=1
opcache.enable_cli=0

; Memory
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000

; Revalidation (production: higher value)
opcache.revalidate_freq=60
opcache.validate_timestamps=1

; Performance
opcache.fast_shutdown=1
opcache.enable_file_override=1
opcache.save_comments=1

; JIT (PHP 8.2+)
opcache.jit=1255
opcache.jit_buffer_size=128M
```

```bash
# Restart PHP-FPM setelah perubahan
sudo systemctl restart php8.2-fpm
```

---

## 6️⃣ MySQL Optimization

### MySQL Configuration

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# =============================================
# InnoDB Settings
# =============================================
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
innodb_file_per_table = 1

# =============================================
# Query Cache (MySQL 8.0 - deprecated, gunakan Redis)
# =============================================
# query_cache sudah dihapus di MySQL 8.0
# Gunakan Redis object cache sebagai pengganti

# =============================================
# Connection Settings
# =============================================
max_connections = 100
wait_timeout = 300
interactive_timeout = 300

# =============================================
# Temporary Tables
# =============================================
tmp_table_size = 64M
max_heap_table_size = 64M

# =============================================
# Logging
# =============================================
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# =============================================
# Character Set
# =============================================
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

```bash
# Restart MySQL
sudo systemctl restart mysql

# Optimize WordPress tables
wp db optimize
```

---

## 7️⃣ Object Cache dengan Redis

### Instalasi Redis

```bash
# Install Redis server
sudo apt install redis-server php8.2-redis -y

# Enable dan start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verifikasi
redis-cli ping
# Harus balas: PONG
```

### Konfigurasi Redis

Edit `/etc/redis/redis.conf`:

```ini
# Memory limit
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (optional untuk cache)
save ""
appendonly no

# Security
bind 127.0.0.1
requirepass your-redis-password

# Performance
tcp-keepalive 300
```

### WordPress Redis Cache

```bash
# Install Redis Object Cache plugin
wp plugin install redis-cache --activate

# Tambahkan ke wp-config.php
# define('WP_REDIS_HOST', '127.0.0.1');
# define('WP_REDIS_PORT', 6379);
# define('WP_REDIS_PASSWORD', 'your-redis-password');
# define('WP_REDIS_PREFIX', 'focus_');
# define('WP_REDIS_DATABASE', 0);
# define('WP_CACHE', true);

# Enable Redis cache
wp redis enable

# Verifikasi
wp redis status
```

---

## 8️⃣ REST API Caching

### WP REST Cache Plugin

Plugin WP REST Cache otomatis caching REST API responses.

```bash
# Sudah terinstall di step sebelumnya
wp plugin activate wp-rest-cache
```

### Konfigurasi via PHP

```php
/**
 * REST API Cache Configuration
 * 
 * File: wp-content/mu-plugins/focus-cache-config.php
 */

// Flush REST cache saat post diupdate
add_action('save_post', function ($post_id) {
    if (wp_is_post_revision($post_id)) return;
    
    // Flush cache untuk post list dan single post
    if (function_exists('wp_rest_cache_delete')) {
        wp_rest_cache_delete('/wp/v2/posts');
        wp_rest_cache_delete('/wp/v2/posts/' . $post_id);
        wp_rest_cache_delete('/focus/v1/featured');
    }
    
    // Alternative: flush all REST cache
    if (class_exists('WP_Rest_Cache_Plugin\Includes\Caching\Caching')) {
        WP_Rest_Cache_Plugin\Includes\Caching\Caching::get_instance()->delete_cache_by_endpoint('/wp/v2/posts');
    }
});

// Flush cache saat comment disubmit
add_action('wp_insert_comment', function ($id, $comment) {
    $post_id = $comment->comment_post_ID;
    if (function_exists('wp_rest_cache_delete')) {
        wp_rest_cache_delete('/wp/v2/comments?post=' . $post_id);
    }
}, 10, 2);
```

### Custom Cache Headers

```php
/**
 * Tambahkan cache headers ke REST API responses
 */
add_filter('rest_post_dispatch', function ($result, $server, $request) {
    $route = $request->get_route();
    
    // Public endpoints - cache 1 jam
    if (preg_match('#^/wp/v2/posts#', $route) && $request->get_method() === 'GET') {
        header('Cache-Control: public, max-age=3600, s-maxage=3600');
        header('X-Focus-Cache: HIT');
    }
    
    // Authenticated endpoints - no cache
    if ($request->get_header('Authorization')) {
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('X-Focus-Cache: BYPASS');
    }
    
    return $result;
}, 10, 3);
```

---

## 9️⃣ Nginx FastCGI Cache

### Setup FastCGI Cache untuk REST API

```nginx
# Di http block (/etc/nginx/nginx.conf)
http {
    # FastCGI Cache
    fastcgi_cache_path /var/cache/nginx/focus 
        levels=1:2 
        keys_zone=FOCUS:100m 
        inactive=60m 
        max_size=512m;
    
    fastcgi_cache_key "$scheme$request_method$host$request_uri";
}

# Di server block
server {
    # Set cache bypass conditions
    set $skip_cache 0;
    
    # Jangan cache authenticated requests
    if ($http_authorization) {
        set $skip_cache 1;
    }
    
    # Jangan cache POST requests
    if ($request_method = POST) {
        set $skip_cache 1;
    }
    
    # Jangan cache wp-admin
    if ($request_uri ~* "/wp-admin/") {
        set $skip_cache 1;
    }
    
    location /wp-json/ {
        # CORS headers (seperti di section 2)
        add_header Access-Control-Allow-Origin "https://focus.com" always;
        
        # FastCGI Cache
        fastcgi_cache FOCUS;
        fastcgi_cache_bypass $skip_cache;
        fastcgi_no_cache $skip_cache;
        fastcgi_cache_valid 200 1h;
        fastcgi_cache_valid 404 1m;
        
        # Cache status header (untuk debugging)
        add_header X-Cache-Status $upstream_cache_status always;
        
        try_files $uri $uri/ /index.php?$args;
    }
}
```

### Purge Cache

```bash
# Manual purge
sudo rm -rf /var/cache/nginx/focus/*
sudo systemctl reload nginx

# Atau via script
cat > /usr/local/bin/focus-cache-purge.sh << 'EOF'
#!/bin/bash
rm -rf /var/cache/nginx/focus/*
systemctl reload nginx
echo "Focus API cache purged at $(date)"
EOF
chmod +x /usr/local/bin/focus-cache-purge.sh
```

---

## 🔟 Monitoring & Maintenance

### Error Logging

```php
// wp-config.php (production)
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', true);        // Log ke wp-content/debug.log
define('WP_DEBUG_DISPLAY', false);   // JANGAN tampilkan ke browser
```

```bash
# Monitor error log secara real-time
tail -f /var/www/focus/wordpress/wp-content/debug.log

# Monitor Nginx access log
tail -f /var/log/nginx/access.log | grep "wp-json"

# Monitor Nginx error log
tail -f /var/log/nginx/error.log

# Monitor MySQL slow queries
tail -f /var/log/mysql/slow.log
```

### Uptime Monitoring

```bash
# Simple health check script
cat > /usr/local/bin/focus-health-check.sh << 'EOF'
#!/bin/bash

API_URL="https://api.focus.com/wp-json/wp/v2/posts?per_page=1"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" --max-time 10)

if [ "$RESPONSE" != "200" ]; then
    echo "ALERT: Focus API returned $RESPONSE at $(date)" >> /var/log/focus-health.log
    # Kirim notifikasi (email, Slack, etc.)
fi
EOF
chmod +x /usr/local/bin/focus-health-check.sh

# Tambahkan ke cron (setiap 5 menit)
echo "*/5 * * * * /usr/local/bin/focus-health-check.sh" | crontab -
```

### Database Maintenance

```bash
# Buat cron job untuk maintenance mingguan
cat > /usr/local/bin/focus-maintenance.sh << 'EOF'
#!/bin/bash
echo "=== Focus WP Maintenance - $(date) ==="

# Optimize database tables
wp db optimize --path=/var/www/focus/wordpress

# Hapus expired transients
wp transient delete --expired --path=/var/www/focus/wordpress

# Hapus revisions lebih dari 30 hari
wp post list --post_type=revision --date_query='[{"before":"30 days ago"}]' --format=ids --path=/var/www/focus/wordpress | xargs -r wp post delete --force --path=/var/www/focus/wordpress

# Hapus trash
wp post delete $(wp post list --post_status=trash --format=ids --path=/var/www/focus/wordpress 2>/dev/null) --force --path=/var/www/focus/wordpress 2>/dev/null

# Flush Redis cache
redis-cli -a your-redis-password FLUSHDB

# Purge Nginx cache
rm -rf /var/cache/nginx/focus/*
systemctl reload nginx

echo "=== Maintenance complete ==="
EOF
chmod +x /usr/local/bin/focus-maintenance.sh

# Jalankan setiap Minggu jam 3 pagi
echo "0 3 * * 0 /usr/local/bin/focus-maintenance.sh >> /var/log/focus-maintenance.log 2>&1" | crontab -
```

---

## 1️⃣1️⃣ Backup Strategy

### Daily Database Backup

```bash
cat > /usr/local/bin/focus-backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/focus"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="focus_wp"
DB_USER="focus_user"
DB_PASS="your-db-password"

# Buat directory jika belum ada
mkdir -p $BACKUP_DIR

# Dump database
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Hapus backup lebih dari 14 hari
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +14 -delete

echo "Database backup completed: db_$DATE.sql.gz"
EOF
chmod +x /usr/local/bin/focus-backup-db.sh

# Daily backup jam 2 pagi
echo "0 2 * * * /usr/local/bin/focus-backup-db.sh >> /var/log/focus-backup.log 2>&1" | crontab -
```

### Weekly Full Backup

```bash
cat > /usr/local/bin/focus-backup-full.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/focus"
WP_DIR="/var/www/focus/wordpress"
DATE=$(date +%Y%m%d)

# Buat directory
mkdir -p $BACKUP_DIR

# Full backup: database + files
tar -czf $BACKUP_DIR/full_$DATE.tar.gz \
    --exclude="$WP_DIR/wp-content/cache" \
    --exclude="$WP_DIR/wp-content/debug.log" \
    $WP_DIR

# Hapus full backup lebih dari 30 hari
find $BACKUP_DIR -name "full_*.tar.gz" -mtime +30 -delete

echo "Full backup completed: full_$DATE.tar.gz"
EOF
chmod +x /usr/local/bin/focus-backup-full.sh

# Weekly backup setiap Sabtu jam 1 pagi
echo "0 1 * * 6 /usr/local/bin/focus-backup-full.sh >> /var/log/focus-backup.log 2>&1" | crontab -
```

### Upload Backup ke Remote Storage (Opsional)

```bash
# Contoh sync ke S3-compatible storage (menggunakan rclone)
# Install rclone: curl https://rclone.org/install.sh | sudo bash
# Configure: rclone config

# Tambahkan ke backup script:
rclone sync $BACKUP_DIR remote:focus-backups/ --max-age 30d
```

### Restore dari Backup

```bash
# Restore database
gunzip < /var/backups/focus/db_20260210_020000.sql.gz | mysql -ufocus_user -p focus_wp

# Restore full backup
tar -xzf /var/backups/focus/full_20260210.tar.gz -C /

# Set permissions setelah restore
sudo chown -R www-data:www-data /var/www/focus/wordpress/
sudo find /var/www/focus/wordpress/ -type d -exec chmod 755 {} \;
sudo find /var/www/focus/wordpress/ -type f -exec chmod 644 {} \;
```

---

## 🔄 Update Strategy

| Komponen | Strategi | Frekuensi |
|----------|----------|-----------|
| **WordPress Core** | Auto-update minor, manual major | Minor: otomatis, Major: bulanan |
| **Plugins** | Manual update, test di staging dulu | 2 minggu sekali |
| **PHP** | Follow Ubuntu LTS schedule | Sesuai rilis LTS |
| **MySQL** | Follow Ubuntu LTS schedule | Sesuai rilis LTS |
| **Nginx** | Apt upgrade | Bulanan |
| **Redis** | Apt upgrade | Bulanan |
| **SSL Certificate** | Auto-renew via Certbot | 90 hari (otomatis) |

```bash
# Check for WordPress updates
wp core check-update
wp plugin list --update=available

# Update WordPress core
wp core update
wp core update-db

# Update plugins (satu per satu, test setelah masing-masing)
wp plugin update advanced-custom-fields
wp plugin update jwt-authentication-for-wp-rest-api
wp plugin update wordpress-seo
wp plugin update acf-to-rest-api
wp plugin update wp-rest-cache
```

---

## ✅ Security & Performance Checklist

### Security
- [ ] wp-config.php permissions 400
- [ ] DISALLOW_FILE_EDIT enabled
- [ ] Security keys & salts di-generate (unik)
- [ ] XML-RPC disabled
- [ ] User enumeration dibatasi
- [ ] Rate limiting aktif (Nginx)
- [ ] SSL/TLS configured (TLSv1.2+)
- [ ] Security headers aktif
- [ ] Sensitive files blocked
- [ ] PHP execution di uploads blocked
- [ ] Login attempts limited
- [ ] JWT secret key kuat (min 32 chars)

### Performance
- [ ] PHP OPcache enabled dan configured
- [ ] Redis object cache aktif
- [ ] WP REST Cache plugin aktif
- [ ] Nginx FastCGI cache configured
- [ ] MySQL InnoDB buffer pool sized
- [ ] Slow query log enabled
- [ ] Image upload limits set

### Maintenance
- [ ] Daily database backup (cron)
- [ ] Weekly full backup (cron)
- [ ] Remote backup storage configured
- [ ] Health check monitoring aktif
- [ ] Database maintenance weekly (cron)
- [ ] Update strategy documented
- [ ] Error logging enabled (debug.log)

---

**Selesai!** Semua 8 dokumen panduan WordPress setup untuk Focus platform sudah lengkap.

📁 **Document Structure:**
- [00. Overview](./00-overview.md)
- [01. Server Setup](./01-server-setup.md)
- [02. WordPress Headless Config](./02-wordpress-headless-config.md)
- [03. ACF Field Groups](./03-acf-field-groups.md)
- [04. REST API & JWT Auth](./04-rest-api-jwt-auth.md)
- [05. Custom Endpoints](./05-custom-endpoints.md)
- [06. User Roles & Permissions](./06-user-roles-permissions.md)
- [07. Security & Performance](./07-security-performance.md) ← You are here
