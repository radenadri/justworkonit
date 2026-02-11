# 09. Security & Performance

Panduan keamanan dan optimasi performa untuk Furnicraft E-Commerce.

---

## Daftar Isi

1. [Security Hardening](#1-security-hardening)
2. [SSL Configuration](#2-ssl-configuration)
3. [Firewall & Protection](#3-firewall--protection)
4. [Backup Strategy](#4-backup-strategy)
5. [Caching Strategy](#5-caching-strategy)
6. [CDN Integration](#6-cdn-integration)
7. [Image Optimization](#7-image-optimization)
8. [Database Optimization](#8-database-optimization)

---

## 1. Security Hardening

### 1.1 WordPress Security Basics

```
Essential Security Measures:
├── Keep WordPress, themes, plugins updated
├── Use strong passwords (min 16 chars)
├── Limit login attempts
├── Enable 2FA for admin accounts
├── Remove default admin username
├── Disable file editing in dashboard
└── Hide WordPress version
```

### 1.2 wp-config.php Hardening

```php
// wp-config.php security additions

// Disable file editing
define('DISALLOW_FILE_EDIT', true);

// Limit post revisions
define('WP_POST_REVISIONS', 5);

// Auto-save interval (seconds)
define('AUTOSAVE_INTERVAL', 300);

// Security keys (generate at https://api.wordpress.org/secret-key/1.1/salt/)
define('AUTH_KEY',         'unique-phrase-here');
define('SECURE_AUTH_KEY',  'unique-phrase-here');
define('LOGGED_IN_KEY',    'unique-phrase-here');
define('NONCE_KEY',        'unique-phrase-here');
define('AUTH_SALT',        'unique-phrase-here');
define('SECURE_AUTH_SALT', 'unique-phrase-here');
define('LOGGED_IN_SALT',   'unique-phrase-here');
define('NONCE_SALT',       'unique-phrase-here');

// Force SSL for admin
define('FORCE_SSL_ADMIN', true);

// Block external HTTP requests (if not needed)
// define('WP_HTTP_BLOCK_EXTERNAL', true);
// define('WP_ACCESSIBLE_HOSTS', 'api.wordpress.org,downloads.wordpress.org');

// Debug settings for production
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);
```

### 1.3 .htaccess Security

```apache
# .htaccess security rules

# Protect wp-config.php
<files wp-config.php>
order allow,deny
deny from all
</files>

# Protect .htaccess
<files .htaccess>
order allow,deny
deny from all
</files>

# Disable directory browsing
Options -Indexes

# Protect wp-includes
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^wp-admin/includes/ - [F,L]
RewriteRule !^wp-includes/ - [S=3]
RewriteRule ^wp-includes/[^/]+\.php$ - [F,L]
RewriteRule ^wp-includes/js/tinymce/langs/.+\.php - [F,L]
RewriteRule ^wp-includes/theme-compat/ - [F,L]
</IfModule>

# Block suspicious queries
<IfModule mod_rewrite.c>
RewriteCond %{QUERY_STRING} (\<|%3C).*script.*(\>|%3E) [NC,OR]
RewriteCond %{QUERY_STRING} GLOBALS(=|\[|\%[0-9A-Z]{0,2}) [OR]
RewriteCond %{QUERY_STRING} _REQUEST(=|\[|\%[0-9A-Z]{0,2})
RewriteRule ^(.*)$ index.php [F,L]
</IfModule>

# Limit file upload size
LimitRequestBody 10485760

# Block author scans
<IfModule mod_rewrite.c>
RewriteCond %{QUERY_STRING} author=\d
RewriteRule ^ /? [L,R=301]
</IfModule>
```

### 1.4 Security Plugin: Wordfence

```
Installation:
├── Plugins → Add New → "Wordfence Security"
├── Activate and get free license key
└── Run initial scan

Wordfence Configuration:
│
├── FIREWALL
│   ├── Web Application Firewall: Enabled
│   ├── Protection level: Extended Protection
│   ├── Real-time IP blocklist: Enabled
│   └── Rate limiting: Enabled
│
├── SCAN
│   ├── Scan frequency: Daily
│   ├── Scan sensitivity: High
│   ├── Check for malware signatures: Yes
│   ├── Check core files against repository: Yes
│   └── Scan theme files: Yes
│
├── LOGIN SECURITY
│   ├── Limit login attempts: Yes
│   ├── Lock out after: 5 failures
│   ├── Lock out duration: 4 hours
│   ├── Immediately lock out invalid usernames: Yes
│   └── Enable reCAPTCHA: Yes (v3)
│
└── TWO-FACTOR AUTHENTICATION
    ├── Enable for Administrators: Required
    ├── Method: TOTP (Google Authenticator)
    └── Backup codes: Generate and store safely
```

---

## 2. SSL Configuration

### 2.1 Let's Encrypt SSL

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d furnicraft.co.id -d www.furnicraft.co.id

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run

# Verify auto-renewal timer
sudo systemctl status certbot.timer
```

### 2.2 Force HTTPS

```
WooCommerce → Settings → Advanced:
├── Force secure checkout: Yes
└── Force HTTP when leaving checkout: No

WordPress → Settings → General:
├── WordPress Address: https://www.furnicraft.co.id
└── Site Address: https://www.furnicraft.co.id
```

### 2.3 HSTS Header

```nginx
# Nginx - add HSTS header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 3. Firewall & Protection

### 3.1 Server Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status verbose
```

### 3.2 Fail2Ban Configuration

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Create WordPress jail
sudo nano /etc/fail2ban/jail.local
```

```ini
# /etc/fail2ban/jail.local
[wordpress]
enabled = true
port = http,https
filter = wordpress
logpath = /var/log/nginx/access.log
maxretry = 5
findtime = 600
bantime = 3600

[wordpress-xmlrpc]
enabled = true
port = http,https
filter = wordpress-xmlrpc
logpath = /var/log/nginx/access.log
maxretry = 3
findtime = 300
bantime = 86400
```

```ini
# /etc/fail2ban/filter.d/wordpress.conf
[Definition]
failregex = ^<HOST> .* "POST /wp-login.php
ignoreregex =
```

### 3.3 Cloudflare Protection

```
Cloudflare Settings:
│
├── SSL/TLS
│   ├── Mode: Full (Strict)
│   ├── Always Use HTTPS: On
│   └── Minimum TLS Version: 1.2
│
├── Firewall Rules
│   ├── Block known bots: On
│   ├── Challenge suspicious requests: On
│   └── Custom rules for wp-admin:
│       └── Allow only from specific IPs (optional)
│
├── Speed
│   ├── Auto Minify: CSS, JavaScript, HTML
│   ├── Brotli: On
│   └── Early Hints: On
│
└── Caching
    ├── Caching Level: Standard
    ├── Browser Cache TTL: 4 hours
    └── Always Online: On
```

---

## 4. Backup Strategy

### 4.1 Backup Components

```
What to Backup:
├── Database (MySQL)
│   ├── WordPress tables
│   ├── WooCommerce tables
│   └── Custom tables
│
├── Files
│   ├── wp-content/uploads/ (media)
│   ├── wp-content/themes/ (custom theme)
│   ├── wp-content/plugins/ (custom plugins)
│   └── wp-config.php
│
└── Configuration
    ├── Nginx config
    ├── PHP config
    └── SSL certificates
```

### 4.2 Automated Backups

**Option 1: UpdraftPlus Plugin (Recommended)**

```
Settings:
├── Schedule:
│   ├── Files: Daily, keep 7
│   └── Database: Every 4 hours, keep 21
│
├── Storage:
│   ├── Primary: Google Drive
│   └── Secondary: Amazon S3 (optional)
│
├── Include:
│   ├── ✓ Plugins
│   ├── ✓ Themes
│   ├── ✓ Uploads
│   └── ✓ Any other directories in wp-content
│
└── Advanced:
    ├── Encrypt database: Yes
    └── Email report: After every backup
```

**Option 2: Server-level Backup Script**

```bash
#!/bin/bash
# /opt/scripts/backup-wordpress.sh

# Variables
SITE_DIR="/var/www/furnicraft"
BACKUP_DIR="/opt/backups/wordpress"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="furnicraft_db"
DB_USER="furnicraft_user"
DB_PASS="your_db_password"

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/$DATE/database.sql.gz

# Backup files
tar -czf $BACKUP_DIR/$DATE/files.tar.gz -C $SITE_DIR wp-content wp-config.php

# Upload to cloud storage (e.g., rclone to Google Drive)
rclone copy $BACKUP_DIR/$DATE remote:furnicraft-backups/$DATE

# Keep only last 7 days locally
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

# Log
echo "Backup completed: $DATE" >> /var/log/wp-backup.log
```

```bash
# Cron job (daily at 3 AM)
0 3 * * * /opt/scripts/backup-wordpress.sh
```

### 4.3 Backup Testing

```
Monthly Backup Test:
1. Download recent backup
2. Restore to staging environment
3. Verify:
   ├── Homepage loads correctly
   ├── Products display with images
   ├── Cart/checkout works
   └── Admin login works
4. Document any issues
```

---

## 5. Caching Strategy

### 5.1 Caching Layers

```
Caching Architecture:
│
├── Browser Cache
│   └── Static assets: CSS, JS, images
│
├── CDN Cache (Cloudflare)
│   └── Static assets + HTML (with bypass for dynamic)
│
├── Page Cache (Redis/WP Super Cache)
│   └── Full HTML pages for guests
│
├── Object Cache (Redis)
│   └── Database queries, transients
│
└── OPcache
    └── PHP bytecode
```

### 5.2 Redis Object Cache

```bash
# Install Redis
sudo apt install redis-server

# Start and enable
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify
redis-cli ping
# PONG
```

```php
// wp-config.php - Redis configuration
define('WP_REDIS_HOST', '127.0.0.1');
define('WP_REDIS_PORT', 6379);
define('WP_REDIS_DATABASE', 0);
define('WP_CACHE', true);
```

**Plugin: Redis Object Cache**

```
Installation:
1. Plugins → Add New → "Redis Object Cache"
2. Activate
3. Settings → Redis → Enable Object Cache
4. Verify: Status should show "Connected"
```

### 5.3 Page Caching

**Plugin: WP Super Cache or W3 Total Cache**

```
WP Super Cache Settings:
│
├── Caching: On
├── Cache Delivery Method: Expert (mod_rewrite)
│
├── Advanced:
│   ├── Cache hits: On
│   ├── Compress pages: On
│   ├── Don't cache for logged in users: On
│   ├── Don't cache for POST requests: On
│   └── Mobile device support: On
│
├── CDN:
│   └── CDN URL: cdn.furnicraft.co.id (if using)
│
└── Preload:
    ├── Preload mode: On
    └── Refresh preloaded cache: Every 600 minutes
```

### 5.4 WooCommerce Cache Exclusions

```
Do NOT cache:
├── /cart/*
├── /checkout/*
├── /my-account/*
├── /*?add-to-cart=*
├── /*?wc-ajax=*
└── Any page with cart cookie

WP Super Cache handles this automatically.
For Nginx FastCGI cache, add rules:
```

```nginx
# Nginx cache bypass for WooCommerce
set $skip_cache 0;

# Don't cache cart, checkout, my-account
if ($request_uri ~* "/cart/|/checkout/|/my-account/") {
    set $skip_cache 1;
}

# Don't cache when WooCommerce items in cart
if ($http_cookie ~* "woocommerce_items_in_cart") {
    set $skip_cache 1;
}
```

---

## 6. CDN Integration

### 6.1 Cloudflare Setup

```
Cloudflare Configuration for WooCommerce:
│
├── DNS
│   ├── A record: furnicraft.co.id → Server IP (proxied)
│   └── CNAME: www → furnicraft.co.id (proxied)
│
├── Page Rules (Free: 3 rules)
│   │
│   ├── Rule 1: Bypass cache for dynamic pages
│   │   ├── URL: *furnicraft.co.id/cart/*
│   │   └── Setting: Cache Level: Bypass
│   │
│   ├── Rule 2: Bypass checkout
│   │   ├── URL: *furnicraft.co.id/checkout/*
│   │   └── Setting: Cache Level: Bypass
│   │
│   └── Rule 3: Cache static assets
│       ├── URL: *furnicraft.co.id/wp-content/*
│       └── Setting: Cache Level: Cache Everything, Edge TTL: 1 month
│
└── Caching
    ├── Purge: After major updates
    └── Dev mode: Enable during development
```

### 6.2 CDN for Product Images

```php
// functions.php - Serve images from CDN
define('CDN_URL', 'https://cdn.furnicraft.co.id');

add_filter('wp_get_attachment_url', 'furnicraft_cdn_url');
function furnicraft_cdn_url($url) {
    $upload_url = wp_upload_dir()['baseurl'];
    return str_replace($upload_url, CDN_URL . '/wp-content/uploads', $url);
}
```

---

## 7. Image Optimization

### 7.1 WebP Conversion

**Plugin: ShortPixel or Imagify**

```
ShortPixel Settings:
├── Compression level: Lossy (recommended for web)
├── Resize large images: Yes, max 2000px
├── WebP conversion: On
├── Serve WebP: Using <picture> tag
└── Auto-optimize new uploads: Yes
```

### 7.2 Lazy Loading

```php
// WordPress 5.5+ has native lazy loading
// Enabled by default for images

// For additional lazy loading (iframes, etc.)
add_filter('wp_lazy_loading_enabled', '__return_true');
```

### 7.3 Image Sizes for WooCommerce

```
WooCommerce → Settings → Products → Display:

Image Sizes:
├── Catalog images: 500 × 500 (cropped)
├── Single product images: 800 × 800 (cropped)
├── Product thumbnails: 150 × 150 (cropped)
│
└── After changing, regenerate thumbnails:
    └── Plugin: "Regenerate Thumbnails" → Regenerate All
```

---

## 8. Database Optimization

### 8.1 Regular Cleanup

**Plugin: WP-Optimize**

```
WP-Optimize Settings:
│
├── Database
│   ├── Clean all post revisions: Weekly
│   ├── Clean auto-draft posts: Weekly
│   ├── Clean trashed posts: Weekly
│   ├── Remove spam comments: Daily
│   ├── Remove transient options: Weekly
│   └── Optimize database tables: Weekly
│
├── Schedule:
│   └── Run optimization: Weekly on Sunday 3 AM
│
└── Settings:
    ├── Retain last: 2 weeks of data
    └── Log actions: Yes
```

### 8.2 MySQL Optimization

```sql
-- Analyze and optimize WooCommerce tables
ANALYZE TABLE wp_wc_orders;
ANALYZE TABLE wp_wc_orders_meta;
ANALYZE TABLE wp_woocommerce_sessions;
OPTIMIZE TABLE wp_options;
OPTIMIZE TABLE wp_postmeta;
```

### 8.3 Clean Transients

```php
// functions.php - Clean expired transients daily
add_action('wp_scheduled_delete', 'furnicraft_delete_expired_transients');
function furnicraft_delete_expired_transients() {
    global $wpdb;
    $wpdb->query("DELETE FROM $wpdb->options WHERE option_name LIKE '_transient_timeout_%' AND option_value < UNIX_TIMESTAMP()");
    $wpdb->query("DELETE FROM $wpdb->options WHERE option_name LIKE '_transient_%' AND option_name NOT LIKE '_transient_timeout_%' AND option_name NOT IN (SELECT REPLACE(option_name, '_transient_timeout_', '_transient_') FROM (SELECT option_name FROM $wpdb->options WHERE option_name LIKE '_transient_timeout_%') AS t)");
}
```

---

## 9. Security & Performance Checklist

### Security
- [ ] Update WordPress, themes, plugins
- [ ] Harden wp-config.php
- [ ] Configure .htaccess security rules
- [ ] Install Wordfence (or similar)
- [ ] Enable 2FA for admin accounts
- [ ] Configure login attempt limits
- [ ] Enable reCAPTCHA on forms
- [ ] Setup SSL with HSTS
- [ ] Configure server firewall (UFW)
- [ ] Install Fail2Ban
- [ ] Setup Cloudflare protection

### Backup
- [ ] Configure daily automated backups
- [ ] Backup to cloud storage (Google Drive/S3)
- [ ] Test backup restoration monthly
- [ ] Document recovery procedure

### Performance
- [ ] Install Redis for object caching
- [ ] Configure page caching
- [ ] Setup Cloudflare CDN
- [ ] Optimize and convert images to WebP
- [ ] Enable lazy loading
- [ ] Schedule database optimization
- [ ] Monitor Core Web Vitals
- [ ] Test page speed (target: > 80)

---

**Dokumen Berikutnya:** [10-odoo-integration.md](./10-odoo-integration.md) - Odoo ERP Integration
