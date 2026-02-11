# 08. SEO & Analytics

Panduan optimasi SEO dan integrasi analytics untuk Furnicraft E-Commerce.

---

## Daftar Isi

1. [SEO Plugin Setup](#1-seo-plugin-setup)
2. [On-Page SEO](#2-on-page-seo)
3. [Technical SEO](#3-technical-seo)
4. [Structured Data](#4-structured-data)
5. [Google Analytics 4](#5-google-analytics-4)
6. [E-Commerce Tracking](#6-e-commerce-tracking)
7. [Search Console](#7-search-console)
8. [Performance Monitoring](#8-performance-monitoring)

---

## 1. SEO Plugin Setup

### 1.1 Yoast SEO (Recommended)

```
Installation:
├── Plugins → Add New
├── Search: "Yoast SEO"
├── Install & Activate
└── Complete First-time configuration wizard
```

### 1.2 Yoast Configuration

```
Yoast SEO → Settings:
│
├── SITE FEATURES
│   ├── SEO analysis: On
│   ├── Readability analysis: On
│   ├── Inclusive language analysis: Off
│   ├── Insights: On
│   ├── Enable link suggestions: On
│   ├── Admin bar menu: On
│   └── Enable security for authors: On
│
├── SITE BASICS
│   ├── Site name: Furnicraft Indonesia
│   ├── Tagline: Furniture Premium Berkualitas
│   └── Title separator: |
│
├── SITE REPRESENTATION
│   ├── Organization/Person: Organization
│   ├── Organization name: PT. Furnicraft Indonesia
│   ├── Logo: [upload logo.png]
│   │
│   └── Social profiles:
│       ├── Instagram: https://instagram.com/furnicraft_id
│       ├── Facebook: https://facebook.com/furnicraftindonesia
│       └── YouTube: https://youtube.com/furnicraft
│
└── CONTENT TYPES
    ├── Products: Show in search results
    ├── Product categories: Show in search results
    └── Product tags: noindex (avoid duplicate)
```

### 1.3 WooCommerce SEO Settings

```
Yoast SEO → Settings → Content types → Products:

Product SEO Defaults:
├── Show products in search results: Yes
├── SEO title template: %%title%% | %%sitename%%
├── Meta description template: %%excerpt%%
│
└── Schema:
    └── Schema type: Product (automatic)
```

---

## 2. On-Page SEO

### 2.1 Product SEO Checklist

```
For each product, optimize:
│
├── Product Title:
│   ├── Include primary keyword
│   ├── Keep under 60 characters
│   └── Example: "Sofa Minimalis 3 Seater Kayu Jati"
│
├── Product Description:
│   ├── Minimum 300 words
│   ├── Include keywords naturally
│   ├── Use bullet points for specs
│   └── Include benefits, not just features
│
├── Short Description:
│   ├── 2-3 sentences summary
│   ├── Include primary keyword
│   └── Compelling selling point
│
├── Product URL (slug):
│   ├── Use dashes, not underscores
│   ├── Keep short and descriptive
│   └── Example: sofa-minimalis-3-seater-jati
│
├── Product Images:
│   ├── Filename: sofa-minimalis-3-seater.jpg
│   ├── Alt text: "Sofa Minimalis 3 Seater Kayu Jati Solid"
│   ├── Title: "Sofa Minimalis Premium Furnicraft"
│   └── Compress to < 200KB
│
└── Yoast SEO Box:
    ├── Focus keyphrase: "sofa minimalis 3 seater"
    ├── SEO title: Sofa Minimalis 3 Seater Jati | Furnicraft
    └── Meta description: Beli sofa minimalis 3 seater kayu jati solid. Desain modern, nyaman, berkualitas premium. Garansi 2 tahun. Free ongkir Jabodetabek!
```

### 2.2 Category Page SEO

```
For each product category:
│
├── Category Name: Living Room
├── Category Slug: living-room
├── Category Description: (minimum 150 words)
│   "Koleksi furniture living room premium dari Furnicraft. 
│    Temukan sofa, meja kopi, rak TV, dan furniture ruang 
│    tamu berkualitas dengan desain modern minimalis..."
│
└── Yoast SEO:
    ├── SEO title: Furniture Living Room Premium | Furnicraft
    └── Meta description: Koleksi furniture living room berkualitas. Sofa, meja kopi, TV cabinet. Kayu jati solid, desain modern. Free ongkir Jabodetabek!
```

### 2.3 Internal Linking

```php
// Auto-add related product links in description
add_filter('woocommerce_short_description', 'furnicraft_auto_internal_links');
function furnicraft_auto_internal_links($description) {
    $keywords_links = array(
        'sofa' => '/product-category/living-room/sofa/',
        'meja makan' => '/product-category/dining-room/dining-table/',
        'lemari' => '/product-category/bedroom/wardrobe/',
        'tempat tidur' => '/product-category/bedroom/bed-frame/',
    );
    
    foreach ($keywords_links as $keyword => $link) {
        $description = preg_replace(
            '/\b(' . preg_quote($keyword, '/') . ')\b/i',
            '<a href="' . $link . '">$1</a>',
            $description,
            1 // Only first occurrence
        );
    }
    
    return $description;
}
```

---

## 3. Technical SEO

### 3.1 XML Sitemap

```
Yoast automatically generates sitemap at:
https://www.furnicraft.co.id/sitemap_index.xml

Sitemap includes:
├── Post sitemap
├── Page sitemap
├── Product sitemap
├── Product category sitemap
├── Product tag sitemap (if indexed)
└── Author sitemap (optional)

Submit to:
├── Google Search Console
└── Bing Webmaster Tools
```

### 3.2 Robots.txt

```
# robots.txt for Furnicraft
User-agent: *
Allow: /

# Disallow non-essential pages
Disallow: /wp-admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /my-account/
Disallow: /*?add-to-cart=*
Disallow: /*?orderby=*
Disallow: /*?filter*

# Sitemap
Sitemap: https://www.furnicraft.co.id/sitemap_index.xml
```

### 3.3 Canonical URLs

```php
// Yoast handles canonicals automatically

// For filtered/sorted pages, ensure canonical points to main page
// Yoast does this by default, but verify in HTML head:
// <link rel="canonical" href="https://www.furnicraft.co.id/product-category/sofa/" />
```

### 3.4 Breadcrumbs

```
Yoast SEO → Settings → Advanced → Breadcrumbs:

Breadcrumb Settings:
├── Enable breadcrumbs: Yes
├── Separator: >
├── Anchor text for homepage: Home
├── Prefix for breadcrumb path: (empty)
└── Show last item: Yes

Display Code (in theme):
<?php
if ( function_exists('yoast_breadcrumb') ) {
    yoast_breadcrumb('<nav class="breadcrumb">','</nav>');
}
?>
```

### 3.5 Page Speed Optimization

```
Core Web Vitals Targets:
├── LCP (Largest Contentful Paint): < 2.5s
├── FID (First Input Delay): < 100ms
├── CLS (Cumulative Layout Shift): < 0.1

Quick Wins:
├── Use WebP images
├── Enable Gzip compression
├── Minify CSS/JS
├── Use CDN (Cloudflare)
├── Enable browser caching
├── Lazy load images
└── Use Redis object caching
```

---

## 4. Structured Data

### 4.1 Product Schema (Automatic)

Yoast + WooCommerce automatically generates Product schema:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Sofa Minimalis 3 Seater",
  "image": "https://furnicraft.co.id/wp-content/uploads/sofa-3s.jpg",
  "description": "Sofa minimalis modern dengan...",
  "sku": "SOFA-3S-001",
  "brand": {
    "@type": "Brand",
    "name": "Furnicraft"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://furnicraft.co.id/product/sofa-minimalis-3-seater/",
    "priceCurrency": "IDR",
    "price": "12500000",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "PT. Furnicraft Indonesia"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "24"
  }
}
```

### 4.2 Organization Schema

```php
// functions.php - Add Organization schema
add_action('wp_head', 'furnicraft_organization_schema');
function furnicraft_organization_schema() {
    if (is_front_page()) {
        ?>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "FurnitureStore",
          "name": "PT. Furnicraft Indonesia",
          "url": "https://www.furnicraft.co.id",
          "logo": "https://www.furnicraft.co.id/wp-content/uploads/logo.png",
          "description": "Furniture premium berkualitas tinggi dengan desain modern minimalis",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Jl. Furniture No. 123",
            "addressLocality": "Jakarta Timur",
            "addressRegion": "DKI Jakarta",
            "postalCode": "13450",
            "addressCountry": "ID"
          },
          "telephone": "+62-21-123-4567",
          "email": "info@furnicraft.co.id",
          "openingHours": "Mo-Sa 09:00-18:00",
          "priceRange": "Rp 1.000.000 - Rp 50.000.000",
          "sameAs": [
            "https://www.instagram.com/furnicraft_id",
            "https://www.facebook.com/furnicraftindonesia"
          ]
        }
        </script>
        <?php
    }
}
```

### 4.3 FAQ Schema (for product pages)

```php
// Add FAQ schema for common questions
add_action('woocommerce_after_single_product_summary', 'furnicraft_product_faq');
function furnicraft_product_faq() {
    global $product;
    ?>
    <div class="product-faq">
        <h3>Pertanyaan Umum</h3>
        <div class="faq-item">
            <h4>Berapa lama estimasi pengiriman?</h4>
            <p>Untuk area Jabodetabek: 3-7 hari kerja. Luar Jabodetabek: 5-14 hari kerja.</p>
        </div>
        <div class="faq-item">
            <h4>Apakah ada garansi?</h4>
            <p>Ya, semua produk Furnicraft bergaransi 2 tahun untuk kerusakan pabrik.</p>
        </div>
    </div>
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Berapa lama estimasi pengiriman?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Untuk area Jabodetabek: 3-7 hari kerja. Luar Jabodetabek: 5-14 hari kerja."
          }
        },
        {
          "@type": "Question",
          "name": "Apakah ada garansi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ya, semua produk Furnicraft bergaransi 2 tahun untuk kerusakan pabrik."
          }
        }
      ]
    }
    </script>
    <?php
}
```

---

## 5. Google Analytics 4

### 5.1 GA4 Setup

```
Create GA4 Property:
1. Go to analytics.google.com
2. Create new property → Select "Web"
3. Enter: www.furnicraft.co.id
4. Copy Measurement ID (G-XXXXXXXXXX)
```

### 5.2 Install GA4

**Option 1: Google Site Kit Plugin (Recommended)**

```
Installation:
1. Plugins → Add New → "Site Kit by Google"
2. Activate and connect Google account
3. Connect Analytics, Search Console, PageSpeed Insights
4. Automatic GA4 installation
```

**Option 2: Manual via Header**

```php
// functions.php - Add GA4 tracking
add_action('wp_head', 'furnicraft_ga4_tracking');
function furnicraft_ga4_tracking() {
    ?>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    </script>
    <?php
}
```

### 5.3 GA4 E-Commerce Configuration

```
GA4 → Admin → Data Streams → Web → Enhanced Measurement:

Enable:
├── ✓ Page views
├── ✓ Scrolls
├── ✓ Outbound clicks
├── ✓ Site search (search_term parameter)
├── ✓ Video engagement
├── ✓ File downloads
└── ✓ Form interactions
```

---

## 6. E-Commerce Tracking

### 6.1 WooCommerce GA4 Integration

**Plugin: WooCommerce Google Analytics Integration**

```
Installation:
1. WooCommerce → Extensions → Browse → "Google Analytics"
2. Or: Plugins → Add New → "WooCommerce Google Analytics"
3. Configure with GA4 Measurement ID
```

### 6.2 E-Commerce Events Tracked

```
Automatic E-Commerce Events:
├── view_item - Product page viewed
├── view_item_list - Category page viewed
├── select_item - Product clicked
├── add_to_cart - Added to cart
├── remove_from_cart - Removed from cart
├── view_cart - Cart page viewed
├── begin_checkout - Checkout started
├── add_shipping_info - Shipping selected
├── add_payment_info - Payment method selected
├── purchase - Order completed
└── refund - Order refunded
```

### 6.3 Custom Events

```php
// Track WhatsApp button clicks
add_action('wp_footer', 'furnicraft_custom_ga_events');
function furnicraft_custom_ga_events() {
    ?>
    <script>
    document.querySelectorAll('.whatsapp-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            gtag('event', 'whatsapp_click', {
                'event_category': 'engagement',
                'event_label': 'WhatsApp CTA'
            });
        });
    });
    
    // Track add to wishlist
    document.querySelectorAll('.add-to-wishlist').forEach(function(btn) {
        btn.addEventListener('click', function() {
            gtag('event', 'add_to_wishlist', {
                'event_category': 'ecommerce',
                'event_label': this.dataset.productName
            });
        });
    });
    </script>
    <?php
}
```

### 6.4 Conversion Goals

```
GA4 → Configure → Conversions:

Mark as conversions:
├── ✓ purchase
├── ✓ add_to_cart
├── ✓ begin_checkout
├── ✓ whatsapp_click (custom)
└── ✓ form_submit (contact form)
```

---

## 7. Search Console

### 7.1 Setup Search Console

```
1. Go to search.google.com/search-console
2. Add property: www.furnicraft.co.id
3. Verify via:
   ├── DNS TXT record (recommended)
   ├── HTML file upload
   ├── HTML meta tag
   └── Google Analytics (if using Site Kit)
```

### 7.2 Submit Sitemap

```
Search Console → Sitemaps:
└── Add: https://www.furnicraft.co.id/sitemap_index.xml
```

### 7.3 Key Reports to Monitor

```
Weekly Check:
├── Performance → Total clicks, impressions, CTR, position
├── Pages → Top performing URLs
├── Queries → Top search terms
├── Coverage → Indexed pages, errors
└── Core Web Vitals → Mobile & Desktop scores

Monthly Review:
├── Compare to previous period
├── Identify declining pages
├── Find new keyword opportunities
└── Fix crawl errors
```

---

## 8. Performance Monitoring

### 8.1 PageSpeed Insights

```
Test: https://pagespeed.web.dev/

Targets:
├── Mobile Performance: > 70
├── Desktop Performance: > 85
├── Accessibility: > 90
├── Best Practices: > 90
└── SEO: > 95
```

### 8.2 Core Web Vitals Dashboard

```
Search Console → Core Web Vitals:

Monitor:
├── Mobile URLs:
│   ├── Good URLs (green)
│   ├── Need improvement (yellow)
│   └── Poor URLs (red)
│
└── Desktop URLs:
    └── (same metrics)

Common Issues for E-Commerce:
├── LCP: Large product images → Use WebP, lazy load
├── FID: Heavy JavaScript → Defer non-critical JS
└── CLS: Ads, images without dimensions → Set explicit sizes
```

### 8.3 Uptime Monitoring

```
Recommended Tools:
├── UptimeRobot (free tier available)
├── Pingdom
└── StatusCake

Monitor:
├── Homepage
├── Shop page
├── A popular product page
└── Checkout page

Alert Settings:
├── Check interval: 5 minutes
├── Alert via: Email + Slack/Telegram
└── Alert when: Down for > 2 checks
```

---

## 9. SEO & Analytics Checklist

- [ ] Install and configure Yoast SEO
- [ ] Set site representation (organization, logo, social)
- [ ] Configure product SEO defaults
- [ ] Optimize all product pages (title, description, images)
- [ ] Optimize category pages
- [ ] Submit XML sitemap to Search Console
- [ ] Configure robots.txt
- [ ] Enable breadcrumbs
- [ ] Verify Product schema (Rich Results Test)
- [ ] Add Organization schema
- [ ] Setup GA4 property
- [ ] Install WooCommerce GA4 integration
- [ ] Verify e-commerce tracking (purchase events)
- [ ] Setup conversion goals
- [ ] Verify Search Console
- [ ] Monitor Core Web Vitals
- [ ] Setup uptime monitoring

---

**Dokumen Berikutnya:** [09-security-performance.md](./09-security-performance.md) - Security & Performance
