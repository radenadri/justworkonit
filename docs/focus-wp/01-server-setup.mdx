# 01. Server Setup & WordPress Installation

> Panduan setup server Ubuntu dan instalasi WordPress untuk Headless CMS

---

## 📋 Server Requirements

| Komponen | Minimum | Recommended | Catatan |
|----------|---------|-------------|---------|
| **OS** | Ubuntu 20.04 | Ubuntu 22.04 LTS | Server edition |
| **RAM** | 1 GB | 2 GB+ | Untuk WordPress + MySQL + Redis |
| **CPU** | 1 vCPU | 2 vCPU | Untuk handle API requests |
| **Storage** | 20 GB SSD | 40 GB SSD | Termasuk media uploads |
| **PHP** | 8.1 | 8.2 | Dengan ekstensi yang diperlukan |
| **MySQL** | 8.0 | 8.0 | Atau MariaDB 10.6+ |
| **Nginx** | 1.20 | 1.24+ | Web server |
| **Node.js** | - | - | Tidak diperlukan (frontend di Vercel) |

---

## Step 1: Update System

```bash
# Update package list dan upgrade
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget unzip git software-properties-common
```

---

## Step 2: Install PHP 8.2

```bash
# Tambahkan PHP repository
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP 8.2 dan ekstensi yang diperlukan
sudo apt install -y \
    php8.2-fpm \
    php8.2-mysql \
    php8.2-xml \
    php8.2-mbstring \
    php8.2-curl \
    php8.2-zip \
    php8.2-gd \
    php8.2-intl \
    php8.2-imagick \
    php8.2-redis \
    php8.2-bcmath \
    php8.2-soap

# Verifikasi instalasi
php -v
php -m | grep -E "(mysql|xml|mbstring|curl|zip|gd|intl|imagick|redis)"
```

### Konfigurasi PHP

Edit file `/etc/php/8.2/fpm/php.ini`:

```ini
; Memory & Execution
memory_limit = 256M
max_execution_time = 300
max_input_time = 300
max_input_vars = 3000

; Upload
upload_max_filesize = 64M
post_max_size = 64M

; Security
expose_php = Off
allow_url_fopen = On

; Session
session.cookie_httponly = 1
session.cookie_secure = 1
session.use_strict_mode = 1

; OPcache
opcache.enable = 1
opcache.memory_consumption = 256
opcache.max_accelerated_files = 10000
opcache.revalidate_freq = 60
opcache.validate_timestamps = 1
```

Edit file `/etc/php/8.2/fpm/pool.d/www.conf`:

```ini
; Process Manager
pm = dynamic
pm.max_children = 25
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 10
pm.max_requests = 500
```

Restart PHP-FPM:

```bash
sudo systemctl restart php8.2-fpm
sudo systemctl enable php8.2-fpm
```

---

## Step 3: Install MySQL 8.0

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure installation
sudo mysql_secure_installation
# - Set root password
# - Remove anonymous users: Y
# - Disallow root login remotely: Y
# - Remove test database: Y
# - Reload privilege tables: Y

# Buat database dan user untuk Focus
sudo mysql -u root -p << 'EOF'
CREATE DATABASE focus_wp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;
CREATE USER 'focus_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON focus_wp.* TO 'focus_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

### Konfigurasi MySQL

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# InnoDB Settings
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Query Cache (MySQL 8.0 deprecated, gunakan Redis sebagai gantinya)
# query_cache_type = 0

# Connection
max_connections = 150
wait_timeout = 600
interactive_timeout = 600

# Character Set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_520_ci

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

Restart MySQL:

```bash
sudo systemctl restart mysql
sudo systemctl enable mysql
```

---

## Step 4: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Enable dan start
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Konfigurasi Virtual Host

Buat file `/etc/nginx/sites-available/focus-api`:

```nginx
server {
    listen 80;
    server_name api.focus.com;

    # Redirect HTTP ke HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.focus.com;

    # SSL (akan dikonfigurasi oleh Certbot)
    # ssl_certificate /etc/letsencrypt/live/api.focus.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.focus.com/privkey.pem;

    root /var/www/focus-wp;
    index index.php;

    # Logging
    access_log /var/log/nginx/focus-api-access.log;
    error_log /var/log/nginx/focus-api-error.log;

    # Max upload size
    client_max_body_size 64M;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # CORS Headers untuk Next.js Frontend
    set $cors_origin "";
    if ($http_origin ~* "^https://focus\.com$") {
        set $cors_origin $http_origin;
    }
    if ($http_origin ~* "^http://localhost:3000$") {
        set $cors_origin $http_origin;
    }

    # Block akses ke file sensitif
    location ~* /(\.env|wp-config\.php|readme\.html|license\.txt|xmlrpc\.php) {
        deny all;
        return 404;
    }

    # Block akses ke hidden files
    location ~ /\. {
        deny all;
        return 404;
    }

    # WordPress REST API dengan CORS
    location /wp-json/ {
        add_header Access-Control-Allow-Origin $cors_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Max-Age 86400 always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 86400 always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        try_files $uri $uri/ /index.php?$args;
    }

    # WordPress admin
    location /wp-admin/ {
        try_files $uri $uri/ /index.php?$args;
    }

    # PHP handling
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;

        # Pass Authorization header ke PHP (penting untuk JWT)
        fastcgi_param HTTP_AUTHORIZATION $http_authorization;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # WordPress uploads
    location /wp-content/uploads/ {
        expires 30d;
        add_header Cache-Control "public";
        # CORS untuk media files
        add_header Access-Control-Allow-Origin $cors_origin always;
    }

    # Default
    location / {
        try_files $uri $uri/ /index.php?$args;
    }
}
```

Aktifkan konfigurasi:

```bash
# Symlink ke sites-enabled
sudo ln -s /etc/nginx/sites-available/focus-api /etc/nginx/sites-enabled/

# Hapus default config jika ada
sudo rm -f /etc/nginx/sites-enabled/default

# Test konfigurasi
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 5: Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d api.focus.com

# Auto-renewal sudah dikonfigurasi otomatis
# Verifikasi renewal
sudo certbot renew --dry-run
```

---

## Step 6: Install WP-CLI

```bash
# Download WP-CLI
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar

# Buat executable
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp

# Verifikasi
wp --info
```

---

## Step 7: Download & Install WordPress

```bash
# Buat directory
sudo mkdir -p /var/www/focus-wp
sudo chown -R www-data:www-data /var/www/focus-wp

# Download WordPress sebagai www-data
sudo -u www-data wp core download --path=/var/www/focus-wp

# Buat wp-config.php
sudo -u www-data wp config create \
    --path=/var/www/focus-wp \
    --dbname=focus_wp \
    --dbuser=focus_user \
    --dbpass='StrongPassword123!' \
    --dbhost=localhost \
    --dbcharset=utf8mb4 \
    --dbcollate=utf8mb4_unicode_520_ci

# Install WordPress
sudo -u www-data wp core install \
    --path=/var/www/focus-wp \
    --url="https://api.focus.com" \
    --title="Focus CMS" \
    --admin_user=admin \
    --admin_password='AdminPassword123!' \
    --admin_email=admin@focus.com

# Verifikasi instalasi
sudo -u www-data wp core version --path=/var/www/focus-wp
```

---

## Step 8: File Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/focus-wp

# Set directory permissions
sudo find /var/www/focus-wp -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /var/www/focus-wp -type f -exec chmod 644 {} \;

# Secure wp-config.php
sudo chmod 400 /var/www/focus-wp/wp-config.php
```

---

## Step 9: Install Redis (Opsional - Recommended)

```bash
# Install Redis Server
sudo apt install -y redis-server

# Konfigurasi Redis
sudo sed -i 's/^# maxmemory .*/maxmemory 128mb/' /etc/redis/redis.conf
sudo sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

# Start & enable Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Verifikasi
redis-cli ping  # Harus return PONG
```

---

## ✅ Verifikasi

Setelah semua langkah selesai, verifikasi:

```bash
# 1. PHP berjalan
php -v

# 2. MySQL berjalan
sudo systemctl status mysql

# 3. Nginx berjalan
sudo systemctl status nginx

# 4. WordPress terinstall
sudo -u www-data wp core version --path=/var/www/focus-wp

# 5. WordPress REST API bisa diakses
curl -s https://api.focus.com/wp-json/wp/v2/posts | head -c 100

# 6. WP-Admin bisa diakses
# Buka browser: https://api.focus.com/wp-admin

# 7. Redis berjalan (jika diinstall)
redis-cli ping
```

---

## 🔍 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| 502 Bad Gateway | Pastikan PHP-FPM running: `sudo systemctl restart php8.2-fpm` |
| Permission denied | Fix ownership: `sudo chown -R www-data:www-data /var/www/focus-wp` |
| MySQL connection refused | Pastikan MySQL running: `sudo systemctl restart mysql` |
| REST API 404 | Set permalink: `sudo -u www-data wp rewrite flush --path=/var/www/focus-wp` |
| SSL error | Jalankan ulang certbot: `sudo certbot --nginx -d api.focus.com` |

---

**Selanjutnya:** [02. WordPress Headless Configuration →](02-wordpress-headless-config.md)
