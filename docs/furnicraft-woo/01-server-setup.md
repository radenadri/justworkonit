# 01. Server Setup & WordPress Installation

> Panduan setup server dan instalasi WordPress 6.9.1 untuk Furnicraft Commerce

---

## Server Requirements

### Minimum Requirements

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| **PHP** | 8.1 | 8.2+ | WordPress 6.9 requires PHP 7.4+, but 8.2 recommended |
| **MySQL** | 5.7 | 8.0+ | MariaDB 10.4+ also supported |
| **Web Server** | Apache/Nginx | Nginx 1.24+ | Nginx preferred for performance |
| **RAM** | 2 GB | 4 GB+ | More for caching & WooCommerce |
| **Storage** | 20 GB | 50 GB+ SSD | Product images need space |
| **SSL** | Required | Let's Encrypt / CloudFlare | HTTPS mandatory for e-commerce |

### PHP Extensions Required

```bash
# Required PHP extensions
php-bcmath      # WooCommerce calculations
php-curl        # External API calls (Midtrans, RajaOngkir)
php-dom         # XML processing
php-exif        # Image metadata
php-fileinfo    # File type detection
php-gd          # Image processing
php-intl        # Internationalization
php-json        # JSON handling
php-mbstring    # Multibyte string support
php-mysql       # MySQL database
php-opcache     # PHP bytecode caching
php-sodium      # Cryptography
php-xml         # XML processing
php-zip         # Archive handling
php-imagick     # Advanced image processing (optional but recommended)
```

### PHP Configuration (php.ini)

```ini
# php.ini optimizations for WooCommerce
memory_limit = 512M
max_execution_time = 300
max_input_time = 300
max_input_vars = 5000
post_max_size = 64M
upload_max_filesize = 64M
max_file_uploads = 50

# OPcache settings
opcache.enable = 1
opcache.memory_consumption = 256
opcache.max_accelerated_files = 20000
opcache.validate_timestamps = 0
opcache.revalidate_freq = 0
opcache.save_comments = 1
```

---

## Server Setup (Ubuntu 22.04 LTS)

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y software-properties-common curl wget git unzip
```

### Step 2: Install Nginx

```bash
sudo apt install -y nginx

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 3: Install PHP 8.2

```bash
# Add PHP repository
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP 8.2 with extensions
sudo apt install -y php8.2-fpm php8.2-common php8.2-mysql php8.2-xml \
    php8.2-curl php8.2-gd php8.2-imagick php8.2-cli php8.2-dev \
    php8.2-imap php8.2-mbstring php8.2-opcache php8.2-soap \
    php8.2-zip php8.2-intl php8.2-bcmath php8.2-redis

# Enable and start PHP-FPM
sudo systemctl enable php8.2-fpm
sudo systemctl start php8.2-fpm
```

### Step 4: Install MySQL 8.0

```bash
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -e "CREATE DATABASE furnicraft_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'furnicraft_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';"
sudo mysql -e "GRANT ALL PRIVILEGES ON furnicraft_db.* TO 'furnicraft_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### Step 5: Install Redis (Optional but Recommended)

```bash
sudo apt install -y redis-server

# Configure Redis
sudo sed -i 's/^# maxmemory.*/maxmemory 256mb/' /etc/redis/redis.conf
sudo sed -i 's/^# maxmemory-policy.*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

sudo systemctl enable redis-server
sudo systemctl restart redis-server
```

---

## Nginx Configuration

### Main Site Configuration

Create `/etc/nginx/sites-available/furnicraft.co.id`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name www.furnicraft.co.id furnicraft.co.id;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.furnicraft.co.id furnicraft.co.id;
    
    # Document root
    root /var/www/furnicraft.co.id/public_html;
    index index.php index.html;
    
    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/furnicraft.co.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/furnicraft.co.id/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/javascript
        application/json
        application/xml
        application/rss+xml
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;
    
    # Client body size (for large product images)
    client_max_body_size 64M;
    
    # WordPress Permalinks
    location / {
        try_files $uri $uri/ /index.php?$args;
    }
    
    # PHP Processing
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
        fastcgi_busy_buffers_size 256k;
    }
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /wp-config\.php {
        deny all;
    }
    
    location ~ /xmlrpc\.php {
        deny all;
    }
    
    location = /wp-admin/install.php {
        deny all;
    }
    
    # WooCommerce REST API
    location ^~ /wp-json/wc/ {
        try_files $uri $uri/ /index.php?$args;
    }
    
    # Block wp-includes PHP execution
    location ~* /wp-includes/.*\.php$ {
        deny all;
    }
    
    # Block uploads PHP execution
    location ~* /wp-content/uploads/.*\.php$ {
        deny all;
    }
    
    # Access logs
    access_log /var/log/nginx/furnicraft.access.log;
    error_log /var/log/nginx/furnicraft.error.log;
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/furnicraft.co.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d furnicraft.co.id -d www.furnicraft.co.id

# Auto-renewal (already configured by certbot)
sudo systemctl enable certbot.timer
```

---

## WordPress Installation

### Step 1: Download WordPress

```bash
# Create web directory
sudo mkdir -p /var/www/furnicraft.co.id/public_html
cd /var/www/furnicraft.co.id/public_html

# Download and extract WordPress
sudo wget https://wordpress.org/latest.tar.gz
sudo tar -xzf latest.tar.gz
sudo mv wordpress/* .
sudo rm -rf wordpress latest.tar.gz

# Set ownership
sudo chown -R www-data:www-data /var/www/furnicraft.co.id
sudo chmod -R 755 /var/www/furnicraft.co.id
```

### Step 2: Configure wp-config.php

```bash
# Create wp-config.php from sample
sudo cp wp-config-sample.php wp-config.php
sudo nano wp-config.php
```

Edit wp-config.php:

```php
<?php
// Database settings
define( 'DB_NAME', 'furnicraft_db' );
define( 'DB_USER', 'furnicraft_user' );
define( 'DB_PASSWORD', 'STRONG_PASSWORD_HERE' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

// Authentication Keys and Salts
// Get from: https://api.wordpress.org/secret-key/1.1/salt/
define('AUTH_KEY',         'put your unique phrase here');
define('SECURE_AUTH_KEY',  'put your unique phrase here');
define('LOGGED_IN_KEY',    'put your unique phrase here');
define('NONCE_KEY',        'put your unique phrase here');
define('AUTH_SALT',        'put your unique phrase here');
define('SECURE_AUTH_SALT', 'put your unique phrase here');
define('LOGGED_IN_SALT',   'put your unique phrase here');
define('NONCE_SALT',       'put your unique phrase here');

// Table prefix
$table_prefix = 'fc_';

// Security settings
define( 'DISALLOW_FILE_EDIT', true );     // Disable theme/plugin editor
define( 'DISALLOW_UNFILTERED_HTML', true );
define( 'FORCE_SSL_ADMIN', true );        // Force HTTPS for admin

// Performance settings
define( 'WP_MEMORY_LIMIT', '512M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );
define( 'WP_POST_REVISIONS', 5 );         // Limit post revisions
define( 'AUTOSAVE_INTERVAL', 120 );       // Autosave every 2 minutes
define( 'EMPTY_TRASH_DAYS', 7 );          // Empty trash after 7 days

// WooCommerce optimizations
define( 'WC_LOG_DIR', '/var/www/furnicraft.co.id/logs/woocommerce/' );

// Redis Object Cache (if using Redis)
define( 'WP_REDIS_HOST', '127.0.0.1' );
define( 'WP_REDIS_PORT', 6379 );
define( 'WP_REDIS_DATABASE', 0 );

// Debug (disable in production)
define( 'WP_DEBUG', false );
define( 'WP_DEBUG_LOG', false );
define( 'WP_DEBUG_DISPLAY', false );
define( 'SCRIPT_DEBUG', false );

/* That's all, stop editing! */
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
```

### Step 3: Complete Installation via Browser

1. Navigate to `https://www.furnicraft.co.id`
2. Select language: **Bahasa Indonesia**
3. Fill in site information:
   - **Site Title**: PT. Furnicraft Indonesia
   - **Username**: admin (or custom admin username)
   - **Password**: Strong password (save securely)
   - **Email**: admin@furnicraft.co.id
4. Click **Install WordPress**

---

## Post-Installation Security

### Secure File Permissions

```bash
# Set correct permissions
sudo find /var/www/furnicraft.co.id/public_html -type d -exec chmod 755 {} \;
sudo find /var/www/furnicraft.co.id/public_html -type f -exec chmod 644 {} \;

# Secure wp-config.php
sudo chmod 440 /var/www/furnicraft.co.id/public_html/wp-config.php

# Make uploads writable
sudo chmod -R 775 /var/www/furnicraft.co.id/public_html/wp-content/uploads
```

### Create .htaccess Backup (for Apache compatibility)

```bash
# If ever switching to Apache, prepare .htaccess
cat > /var/www/furnicraft.co.id/public_html/.htaccess << 'EOF'
# WordPress Permalinks
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>

# Security
<Files wp-config.php>
order allow,deny
deny from all
</Files>

<Files xmlrpc.php>
order allow,deny
deny from all
</Files>
EOF
```

### Install WP-CLI

```bash
# Download WP-CLI
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp

# Verify installation
wp --info
```

---

## Backup Configuration

### Automated Daily Backup Script

Create `/opt/scripts/backup-furnicraft.sh`:

```bash
#!/bin/bash

# Configuration
SITE_DIR="/var/www/furnicraft.co.id/public_html"
BACKUP_DIR="/var/backups/furnicraft"
DB_NAME="furnicraft_db"
DB_USER="furnicraft_user"
DB_PASS="STRONG_PASSWORD_HERE"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup WordPress files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C $SITE_DIR .

# Remove old backups
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

# Log
echo "Backup completed: $DATE" >> $BACKUP_DIR/backup.log
```

```bash
# Make executable
sudo chmod +x /opt/scripts/backup-furnicraft.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/scripts/backup-furnicraft.sh") | crontab -
```

---

## Server Monitoring

### Install Basic Monitoring Tools

```bash
# Install htop, netstat, etc.
sudo apt install -y htop iotop nethogs sysstat

# Install fail2ban for brute force protection
sudo apt install -y fail2ban

# Configure fail2ban for WordPress
cat > /etc/fail2ban/jail.local << 'EOF'
[wordpress]
enabled = true
port = http,https
filter = wordpress
logpath = /var/log/nginx/furnicraft.access.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

sudo systemctl restart fail2ban
```

---

## Checklist

- [ ] Server meets minimum requirements (PHP 8.2, MySQL 8.0, Nginx)
- [ ] All required PHP extensions installed
- [ ] php.ini optimized for WooCommerce
- [ ] MySQL database created with proper charset
- [ ] Redis installed and configured (optional)
- [ ] Nginx configured with SSL and security headers
- [ ] Let's Encrypt SSL certificate installed
- [ ] WordPress downloaded and configured
- [ ] wp-config.php secured with proper settings
- [ ] File permissions set correctly
- [ ] WP-CLI installed
- [ ] Backup script configured
- [ ] fail2ban configured for brute force protection
- [ ] Test site loads over HTTPS

---

**Next Document:** [02-woocommerce-setup.md](./02-woocommerce-setup.md) - WooCommerce Installation & Core Configuration
