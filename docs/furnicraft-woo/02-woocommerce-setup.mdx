# 02. WooCommerce Installation & Core Configuration

> Panduan instalasi dan konfigurasi WooCommerce 10.x untuk Furnicraft Commerce

---

## WooCommerce Overview

### What's New in WooCommerce 10.x

| Feature | Description |
|---------|-------------|
| **High-Performance Order Storage (HPOS)** | Database-optimized order storage for faster queries |
| **Cart & Checkout Blocks** | Modern Gutenberg-based checkout experience |
| **Product Collection Block** | New product display block with advanced filtering |
| **Enhanced Analytics** | Improved reporting dashboard |
| **Improved REST API** | Better API performance and new endpoints |
| **PHP 8.2 Compatibility** | Full support for latest PHP versions |

---

## Installation

### Step 1: Install via WP-CLI

```bash
cd /var/www/furnicraft.co.id/public_html

# Install and activate WooCommerce
wp plugin install woocommerce --activate --allow-root

# Verify installation
wp plugin list --allow-root | grep woocommerce
```

### Step 2: Initial Setup Wizard

Navigate to **WooCommerce → Home** and complete the setup wizard:

1. **Store Details**
   - Country: Indonesia
   - Address: Jl. Industri Raya No. 123, Cileungsi
   - City: Bogor
   - Postcode: 16820
   - Province: Jawa Barat

2. **Industry**
   - Select: Home, Furniture & Garden

3. **Product Types**
   - Physical products: ✓
   - Downloads: ✗
   - Subscriptions: ✗

4. **Business Details**
   - Number of products: 100+
   - Currently selling elsewhere: Yes (optional)

---

## Store Settings

### General Settings

**WooCommerce → Settings → General**

```
Store Address:
├── Address Line 1: Jl. Industri Raya No. 123
├── Address Line 2: Kawasan Industri Cileungsi
├── City: Bogor
├── Country / State: Indonesia - Jawa Barat
└── Postcode: 16820

General Options:
├── Selling location(s): Sell to specific countries
│   └── Indonesia only (for now)
├── Shipping location(s): Ship to specific countries only
│   └── Indonesia
├── Default customer location: Shop base address
└── Enable taxes: ✓ (PPN 11%)

Currency Options:
├── Currency: Indonesian Rupiah (Rp)
├── Currency position: Left with space (Rp 1.000.000)
├── Thousand separator: . (dot)
├── Decimal separator: , (comma)
└── Number of decimals: 0 (no decimals for IDR)
```

### Products Settings

**WooCommerce → Settings → Products**

```
Shop Pages:
├── Shop page: /shop
├── Add to cart behaviour: 
│   ├── Redirect to cart after add: ✗
│   └── Enable AJAX add to cart: ✓
└── Placeholder image: Upload Furnicraft placeholder

Measurements:
├── Weight unit: kg (kilogram)
├── Dimensions unit: cm (centimeter)

Reviews:
├── Enable product reviews: ✓
├── Show "verified owner" label: ✓
├── Reviews can only be left by verified owners: ✓
└── Enable star rating: ✓

Inventory:
├── Manage stock: ✓
├── Hold stock (minutes): 60
├── Notifications:
│   ├── Enable low stock notifications: ✓
│   ├── Enable out of stock notifications: ✓
│   └── Notification recipient: admin@furnicraft.co.id
├── Low stock threshold: 5
├── Out of stock threshold: 0
├── Out of stock visibility: Hide from catalog
└── Stock display format: Only show in stock
```

### Tax Settings

**WooCommerce → Settings → Tax**

```
Tax Options:
├── Enable taxes and tax calculations: ✓
├── Prices entered with tax: Yes, I will enter prices inclusive of tax
├── Calculate tax based on: Shop base address
├── Shipping tax class: Standard
├── Rounding: Round tax at subtotal level
├── Additional tax classes: (leave empty)
├── Display prices in the shop: Including tax
├── Display prices during cart and checkout: Including tax
└── Display tax totals: As a single total

Standard Rates:
├── Country: ID (Indonesia)
├── State: * (all states)
├── Rate %: 11.0000 (PPN)
├── Tax name: PPN
├── Priority: 1
├── Compound: No
└── Shipping: Yes
```

### Accounts & Privacy

**WooCommerce → Settings → Accounts & Privacy**

```
Guest Checkout:
├── Allow customers to place orders without an account: ✓
└── Allow customers to create an account during checkout: ✓

Account Creation:
├── Allow customers to create an account on "My account" page: ✓
├── Send password setup link instead of password in email: ✓
└── Automatically generate username from customer email: ✓

Account Erasure Requests:
├── Remove personal data from orders on request: ✗
├── Remove access to downloads on request: ✓
└── Remove download logs on request: ✓

Privacy Policy:
├── Registration privacy policy: Dengan membuat akun, Anda menyetujui...
└── Checkout privacy policy: Data Anda akan digunakan untuk...
```

---

## High-Performance Order Storage (HPOS)

### Enable HPOS

**WooCommerce → Settings → Advanced → Features**

```
Order data storage:
├── ✓ Use the new high-performance order storage
└── ✓ Enable compatibility mode (for plugin compatibility)
```

### Database Migration

```bash
# Run HPOS migration via WP-CLI
wp wc hpos enable --allow-root

# Verify migration status
wp wc hpos status --allow-root

# Sync orders if needed
wp wc hpos sync --allow-root
```

### Benefits of HPOS

| Aspect | Legacy | HPOS |
|--------|--------|------|
| Storage | wp_postmeta | Custom tables |
| Query Speed | Slow (JOINs) | Fast (direct) |
| Scalability | Poor | Excellent |
| Maintenance | Complex | Simple |
| Future Support | Deprecated | Active |

---

## Essential Pages

### Create Required Pages

```bash
# Create pages via WP-CLI
wp post create --post_type=page --post_title='Shop' --post_status=publish --allow-root
wp post create --post_type=page --post_title='Cart' --post_status=publish --allow-root
wp post create --post_type=page --post_title='Checkout' --post_status=publish --allow-root
wp post create --post_type=page --post_title='My Account' --post_status=publish --allow-root
wp post create --post_type=page --post_title='Terms & Conditions' --post_status=publish --allow-root
wp post create --post_type=page --post_title='Privacy Policy' --post_status=publish --allow-root
wp post create --post_type=page --post_title='Refund Policy' --post_status=publish --allow-root
```

### Page Assignments

**WooCommerce → Settings → Advanced → Page Setup**

| Page | WordPress Page |
|------|----------------|
| Cart page | /cart |
| Checkout page | /checkout |
| My account page | /my-account |
| Terms and conditions | /terms-conditions |
| Privacy policy page | /privacy-policy |

---

## Cart & Checkout Blocks (Gutenberg)

### Enable Block Checkout

**WooCommerce 10.x uses Checkout Block by default.** If not enabled:

1. Edit the **Checkout** page
2. Replace shortcode `[woocommerce_checkout]` with:
   - Add Block → **Checkout**
3. Repeat for **Cart** page with **Cart** block

### Block Checkout Features

```
Checkout Block Configuration:
├── Fields:
│   ├── Company name: Hidden
│   ├── Address line 2: Optional
│   ├── Phone: Required
│   └── Order notes: Optional
│
├── Express Payment:
│   ├── Apple Pay: ✓ (if available)
│   ├── Google Pay: ✓ (if available)
│   └── Position: Top of form
│
├── Additional Options:
│   ├── Allow coupons: ✓
│   ├── Link to policy pages: ✓
│   └── Create account checkbox: ✓
│
└── Style:
    ├── Dark mode support: Auto
    └── Border radius: 8px
```

### Cart Block Configuration

```
Cart Block:
├── Show shipping calculator: ✓
├── Show rate selector: ✓ (if multiple rates)
├── Show proceed to checkout: ✓
├── Cross-sells position: Below cart items
└── Empty cart text: Keranjang belanja Anda kosong
```

---

## Email Configuration

### Email Settings

**WooCommerce → Settings → Emails**

```
Email Sender Options:
├── "From" name: Furnicraft Indonesia
├── "From" address: order@furnicraft.co.id
├── Header image: Logo URL
├── Footer text: © 2024 PT. Furnicraft Indonesia
├── Base color: #8B4513 (Saddle Brown)
├── Background color: #FFF8DC (Cornsilk)
├── Body background color: #FFFFFF
├── Body text color: #333333
└── Email improvement (track opens): ✓
```

### Email Templates

| Email Type | Enabled | Recipient |
|------------|---------|-----------|
| New order | ✓ | admin@furnicraft.co.id |
| Cancelled order | ✓ | admin@furnicraft.co.id |
| Failed order | ✓ | admin@furnicraft.co.id |
| Order on-hold | ✓ | Customer |
| Processing order | ✓ | Customer |
| Completed order | ✓ | Customer |
| Refunded order | ✓ | Customer |
| Customer invoice | ✓ | Customer |
| Customer note | ✓ | Customer |
| Reset password | ✓ | Customer |
| New account | ✓ | Customer |

### SMTP Configuration

Install **WP Mail SMTP** plugin for reliable email delivery:

```bash
wp plugin install wp-mail-smtp --activate --allow-root
```

Configure with transactional email service:

```
SMTP Provider Options:
├── Sendinblue (recommended for Indonesia)
├── Mailgun
├── SendGrid
├── Amazon SES
└── SMTP.com

Configuration:
├── From Email: order@furnicraft.co.id
├── From Name: Furnicraft Indonesia
├── SMTP Host: (provider specific)
├── SMTP Port: 587
├── Encryption: TLS
├── Authentication: Yes
├── Username: (API key)
└── Password: (API secret)
```

---

## Essential Plugins

### Required Plugins

```bash
# Install essential plugins
wp plugin install woocommerce-gateway-midtrans --activate --allow-root
wp plugin install woo-ongkos-kirim --activate --allow-root  # Indonesian shipping
wp plugin install yoast-seo --activate --allow-root
wp plugin install wordfence --activate --allow-root
wp plugin install wp-mail-smtp --activate --allow-root
wp plugin install redis-cache --activate --allow-root
wp plugin install query-monitor --allow-root  # Dev tool, don't activate in prod
```

### Recommended Plugins

| Plugin | Purpose | Priority |
|--------|---------|----------|
| **Midtrans WooCommerce** | Payment gateway | Required |
| **Ongkos Kirim ID** | Indonesian shipping | Required |
| **Yoast SEO** | SEO optimization | Required |
| **Wordfence** | Security | Required |
| **Redis Object Cache** | Performance | Recommended |
| **WP Mail SMTP** | Email delivery | Recommended |
| **WooCommerce PDF Invoices** | Invoice generation | Recommended |
| **YITH WooCommerce Wishlist** | Customer wishlist | Optional |
| **Abandoned Cart for WooCommerce** | Cart recovery | Optional |
| **TrustPulse** | Social proof | Optional |

---

## REST API Configuration

### Enable REST API

**WooCommerce → Settings → Advanced → REST API**

Create API keys for integrations:

```
API Key: Odoo Integration
├── Description: Odoo ERP Sync
├── User: admin
├── Permissions: Read/Write
├── Consumer Key: ck_xxxxxxxxxxxxxxx
└── Consumer Secret: cs_xxxxxxxxxxxxxxx
```

### API Endpoints

```
Base URL: https://www.furnicraft.co.id/wp-json/wc/v3/

Endpoints:
├── Products: /products
├── Orders: /orders
├── Customers: /customers
├── Coupons: /coupons
├── Reports: /reports
├── Shipping: /shipping
├── Payment Gateways: /payment_gateways
└── Webhooks: /webhooks
```

### Webhook Configuration

Set up webhooks for Odoo sync:

| Webhook | Event | Delivery URL |
|---------|-------|--------------|
| Order Created | order.created | https://odoo.furnicraft.co.id/wc/webhook |
| Order Updated | order.updated | https://odoo.furnicraft.co.id/wc/webhook |
| Product Updated | product.updated | https://odoo.furnicraft.co.id/wc/webhook |

---

## Status & Logs

### System Status Check

**WooCommerce → Status**

Ensure all checks pass:

```
Environment:
├── WordPress Version: ✓ 6.9.1
├── WooCommerce Version: ✓ 10.5.0
├── PHP Version: ✓ 8.2.x
├── MySQL Version: ✓ 8.0.x
├── WP Memory Limit: ✓ 512 MB
├── WP Debug Mode: ✓ Disabled
├── Language: ✓ id_ID
├── External object cache: ✓ Yes (Redis)
└── HTTPS: ✓ Yes

Database:
├── HPOS Enabled: ✓ Yes
├── Total Database Size: X MB
└── All tables present: ✓

Security:
├── Secure connection (HTTPS): ✓
├── Hide errors from visitors: ✓
└── wp-config.php writable: ✓ No

Theme:
├── Theme: (Your theme)
├── Parent theme: (if child theme)
├── WooCommerce support: ✓
└── Templates overriding: (none or list)
```

### Log Locations

```bash
# WooCommerce logs
/var/www/furnicraft.co.id/public_html/wp-content/uploads/wc-logs/

# View fatal errors
wp wc tool run clear_expired_transients --allow-root

# Regenerate thumbnails
wp media regenerate --allow-root
```

---

## Cron Jobs

### WordPress Cron

```bash
# Disable WP Cron in wp-config.php (already done)
define('DISABLE_WP_CRON', true);

# Add system cron job
crontab -e

# Add this line (every 5 minutes)
*/5 * * * * cd /var/www/furnicraft.co.id/public_html && wp cron event run --due-now --allow-root > /dev/null 2>&1
```

### WooCommerce Scheduled Actions

Monitor at **WooCommerce → Status → Scheduled Actions**:

| Action | Schedule | Purpose |
|--------|----------|---------|
| wc_admin_process_orders_milestone | Hourly | Order milestones |
| wc_admin_unsnooze_admin_notes | Daily | Admin notifications |
| woocommerce_cleanup_logs | Daily | Log maintenance |
| woocommerce_cleanup_sessions | Twice daily | Session cleanup |
| wc_update_product_lookup_tables | Async | Search optimization |

---

## Checklist

- [ ] WooCommerce installed and activated
- [ ] Setup wizard completed with correct store details
- [ ] Currency set to IDR with Indonesian formatting
- [ ] Tax rates configured (PPN 11%)
- [ ] HPOS enabled for better performance
- [ ] All required pages created and assigned
- [ ] Cart & Checkout blocks enabled (Gutenberg)
- [ ] Email settings configured with SMTP
- [ ] Essential plugins installed
- [ ] REST API keys generated
- [ ] Webhooks configured for integrations
- [ ] System status shows all green
- [ ] WP Cron replaced with system cron
- [ ] Logs accessible and writable

---

**Next Document:** [03-theme-customization.md](./03-theme-customization.md) - Theme Selection & Furnicraft Branding
