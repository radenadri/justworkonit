# 03. Theme Selection & Furnicraft Branding

> Panduan pemilihan tema dan kustomisasi branding untuk Furnicraft Commerce

---

## Theme Requirements

### Essential Features

| Feature | Required | Notes |
|---------|----------|-------|
| WooCommerce Support | ✓ | Full integration with shop features |
| Block Editor (Gutenberg) | ✓ | Modern content editing |
| Full Site Editing (FSE) | Recommended | For future-proof design |
| Mobile Responsive | ✓ | Critical for Indonesian mobile users |
| RTL Support | ✗ | Not needed for Indonesian |
| Speed Optimized | ✓ | Fast loading for conversions |
| Translation Ready | ✓ | Indonesian language support |

### Recommended Themes

| Theme | Type | Price | Best For |
|-------|------|-------|----------|
| **Flavor (flavor theme)** | Block Theme | Premium | Modern furniture store |
| **flavor theme** | Block Theme | Free | Clean e-commerce |
| **flavor theme** | Classic | Free | General WooCommerce |
| **flavor theme** | Classic | $59 | Furniture-specific |

---

## Furnicraft Branding

### Brand Colors

```css
/* Furnicraft Color Palette */
:root {
    /* Primary Colors */
    --fc-primary: #8B4513;        /* Saddle Brown - Main brand color */
    --fc-primary-light: #A0522D;  /* Sienna - Hover states */
    --fc-primary-dark: #654321;   /* Dark Brown - Active states */
    
    /* Secondary Colors */
    --fc-secondary: #D2691E;      /* Chocolate - Accent */
    --fc-secondary-light: #E07A30;
    --fc-secondary-dark: #B8541A;
    
    /* Accent Colors */
    --fc-accent: #228B22;         /* Forest Green - CTA, success */
    --fc-accent-light: #32CD32;
    --fc-accent-dark: #006400;
    
    /* Neutral Colors */
    --fc-background: #FFF8DC;     /* Cornsilk - Light background */
    --fc-surface: #FFFFFF;        /* White - Cards, modals */
    --fc-text-primary: #333333;   /* Dark gray - Primary text */
    --fc-text-secondary: #666666; /* Medium gray - Secondary text */
    --fc-text-muted: #999999;     /* Light gray - Captions */
    --fc-border: #E0D8C8;         /* Warm gray - Borders */
    
    /* Semantic Colors */
    --fc-success: #228B22;
    --fc-warning: #F59E0B;
    --fc-error: #DC2626;
    --fc-info: #3B82F6;
}
```

### Typography

```css
/* Furnicraft Typography */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap');

:root {
    /* Font Families */
    --fc-font-heading: 'Playfair Display', Georgia, serif;
    --fc-font-body: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    
    /* Font Sizes */
    --fc-text-xs: 0.75rem;    /* 12px */
    --fc-text-sm: 0.875rem;   /* 14px */
    --fc-text-base: 1rem;     /* 16px */
    --fc-text-lg: 1.125rem;   /* 18px */
    --fc-text-xl: 1.25rem;    /* 20px */
    --fc-text-2xl: 1.5rem;    /* 24px */
    --fc-text-3xl: 1.875rem;  /* 30px */
    --fc-text-4xl: 2.25rem;   /* 36px */
    --fc-text-5xl: 3rem;      /* 48px */
    
    /* Line Heights */
    --fc-leading-tight: 1.25;
    --fc-leading-normal: 1.5;
    --fc-leading-relaxed: 1.75;
}

/* Heading Styles */
h1, h2, h3, h4, h5, h6 {
    font-family: var(--fc-font-heading);
    font-weight: 600;
    line-height: var(--fc-leading-tight);
    color: var(--fc-text-primary);
}

h1 { font-size: var(--fc-text-4xl); }
h2 { font-size: var(--fc-text-3xl); }
h3 { font-size: var(--fc-text-2xl); }
h4 { font-size: var(--fc-text-xl); }
h5 { font-size: var(--fc-text-lg); }
h6 { font-size: var(--fc-text-base); }

/* Body Text */
body {
    font-family: var(--fc-font-body);
    font-size: var(--fc-text-base);
    line-height: var(--fc-leading-normal);
    color: var(--fc-text-primary);
}
```

### Logo Specifications

```
Logo Requirements:
├── Primary Logo:
│   ├── Format: SVG (preferred), PNG with transparency
│   ├── Size: 300 × 80px (header)
│   ├── Background: Transparent
│   └── Color: Full color on light background
│
├── Logo Variations:
│   ├── Light version: For dark backgrounds
│   ├── Dark version: For light backgrounds
│   ├── Icon only: 64 × 64px (favicon, mobile)
│   └── Stacked: For narrow spaces
│
├── Clear Space:
│   └── Minimum padding: 20px around logo
│
└── Files Needed:
    ├── logo-full-color.svg
    ├── logo-white.svg
    ├── logo-dark.svg
    ├── logo-icon.svg
    ├── favicon.ico (16×16, 32×32, 48×48)
    └── apple-touch-icon.png (180×180)
```

---

## Theme Installation & Setup

### Step 1: Install Theme

```bash
# For flavor theme theme (recommended)
cd /var/www/furnicraft.co.id/public_html
wp theme install flavor theme --activate --allow-root

# Or install premium theme via ZIP upload
wp theme install /path/to/theme.zip --activate --allow-root
```

### Step 2: Create Child Theme

Create child theme for customizations:

```bash
mkdir -p wp-content/themes/flavor theme-child
```

Create `wp-content/themes/flavor theme-child/style.css`:

```css
/*
Theme Name: Flavor Theme Child - Furnicraft
Theme URI: https://www.furnicraft.co.id
Template: flavor theme
Author: Furnicraft Dev Team
Description: Custom child theme for Furnicraft Indonesia
Version: 1.0.0
Text Domain: flavor theme-child-furnicraft
*/

/* Import parent theme styles */
@import url('../flavor theme/style.css');

/* Furnicraft Custom Styles */
@import url('css/variables.css');
@import url('css/components.css');
@import url('css/woocommerce.css');
```

Create `wp-content/themes/flavor theme-child/functions.php`:

```php
<?php
/**
 * Flavor Theme Child - Furnicraft Functions
 */

// Enqueue parent and child theme styles
function flavor theme_child_enqueue_styles() {
    $parent_style = 'flavor theme-style';
    
    wp_enqueue_style($parent_style, 
        get_template_directory_uri() . '/style.css'
    );
    
    wp_enqueue_style('flavor theme-child-style',
        get_stylesheet_directory_uri() . '/style.css',
        array($parent_style),
        wp_get_theme()->get('Version')
    );
    
    // Google Fonts
    wp_enqueue_style('furnicraft-fonts',
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap',
        array(),
        null
    );
    
    // Custom CSS
    wp_enqueue_style('furnicraft-custom',
        get_stylesheet_directory_uri() . '/css/furnicraft.css',
        array('flavor theme-child-style'),
        filemtime(get_stylesheet_directory() . '/css/furnicraft.css')
    );
}
add_action('wp_enqueue_scripts', 'flavor theme_child_enqueue_styles');

// Add theme support
function furnicraft_theme_setup() {
    // WooCommerce support
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
    
    // Custom logo
    add_theme_support('custom-logo', array(
        'height'      => 80,
        'width'       => 300,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    
    // Title tag
    add_theme_support('title-tag');
    
    // Post thumbnails
    add_theme_support('post-thumbnails');
    
    // Custom image sizes for furniture
    add_image_size('product-thumbnail', 300, 300, true);
    add_image_size('product-medium', 600, 600, true);
    add_image_size('product-large', 1200, 1200, false);
    add_image_size('product-gallery', 800, 800, true);
    add_image_size('hero-banner', 1920, 800, true);
    add_image_size('category-thumb', 400, 300, true);
}
add_action('after_setup_theme', 'furnicraft_theme_setup');

// WooCommerce customizations
require_once get_stylesheet_directory() . '/inc/woocommerce.php';
```

### Step 3: Activate Child Theme

```bash
wp theme activate flavor theme-child --allow-root
```

---

## WooCommerce Customizations

Create `wp-content/themes/flavor theme-child/inc/woocommerce.php`:

```php
<?php
/**
 * WooCommerce customizations for Furnicraft
 */

// Remove default WooCommerce styles and use custom
function furnicraft_dequeue_wc_styles($enqueue_styles) {
    // Keep only essential styles
    unset($enqueue_styles['woocommerce-general']);
    return $enqueue_styles;
}
add_filter('woocommerce_enqueue_styles', 'furnicraft_dequeue_wc_styles');

// Custom product gallery columns
function furnicraft_product_thumbnails_columns() {
    return 4; // 4 thumbnails per row
}
add_filter('woocommerce_product_thumbnails_columns', 'furnicraft_product_thumbnails_columns');

// Related products count
function furnicraft_related_products_args($args) {
    $args['posts_per_page'] = 4;
    $args['columns'] = 4;
    return $args;
}
add_filter('woocommerce_output_related_products_args', 'furnicraft_related_products_args');

// Products per page
function furnicraft_products_per_page() {
    return 12;
}
add_filter('loop_shop_per_page', 'furnicraft_products_per_page');

// Shop columns
function furnicraft_shop_columns() {
    return 3; // 3 products per row on desktop
}
add_filter('loop_shop_columns', 'furnicraft_shop_columns');

// Add custom product badges
function furnicraft_product_badges() {
    global $product;
    
    if ($product->is_on_sale()) {
        $regular = $product->get_regular_price();
        $sale = $product->get_sale_price();
        $discount = round((($regular - $sale) / $regular) * 100);
        echo '<span class="fc-badge fc-badge-sale">-' . $discount . '%</span>';
    }
    
    if ($product->is_featured()) {
        echo '<span class="fc-badge fc-badge-featured">Best Seller</span>';
    }
    
    // New product (added in last 30 days)
    $post_date = get_the_date('U');
    $thirty_days_ago = strtotime('-30 days');
    if ($post_date > $thirty_days_ago) {
        echo '<span class="fc-badge fc-badge-new">New</span>';
    }
}
add_action('woocommerce_before_shop_loop_item_title', 'furnicraft_product_badges', 10);

// Custom Add to Cart button text
function furnicraft_add_to_cart_text($text) {
    return __('Tambah ke Keranjang', 'flavor theme-child-furnicraft');
}
add_filter('woocommerce_product_single_add_to_cart_text', 'furnicraft_add_to_cart_text');
add_filter('woocommerce_product_add_to_cart_text', 'furnicraft_add_to_cart_text');

// Add product dimensions to shop loop
function furnicraft_show_dimensions_shop() {
    global $product;
    
    if ($product->has_dimensions()) {
        $dimensions = wc_format_dimensions($product->get_dimensions(false));
        echo '<p class="fc-product-dimensions">' . $dimensions . '</p>';
    }
}
add_action('woocommerce_after_shop_loop_item_title', 'furnicraft_show_dimensions_shop', 15);

// Add WhatsApp button to single product
function furnicraft_whatsapp_button() {
    global $product;
    
    $phone = '6281234567890'; // Furnicraft WhatsApp
    $message = urlencode('Halo, saya tertarik dengan produk: ' . $product->get_name() . ' - ' . get_permalink());
    
    echo '<a href="https://wa.me/' . $phone . '?text=' . $message . '" 
          class="fc-whatsapp-btn" 
          target="_blank">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Tanya via WhatsApp
        </a>';
}
add_action('woocommerce_single_product_summary', 'furnicraft_whatsapp_button', 35);

// Custom breadcrumb
function furnicraft_breadcrumb_defaults($args) {
    $args['delimiter'] = ' <span class="fc-breadcrumb-sep">›</span> ';
    $args['wrap_before'] = '<nav class="fc-breadcrumb" aria-label="Breadcrumb">';
    $args['wrap_after'] = '</nav>';
    $args['home'] = 'Beranda';
    return $args;
}
add_filter('woocommerce_breadcrumb_defaults', 'furnicraft_breadcrumb_defaults');

// Remove sidebar from product pages
function furnicraft_remove_sidebar_product() {
    if (is_product()) {
        remove_action('woocommerce_sidebar', 'woocommerce_get_sidebar', 10);
    }
}
add_action('template_redirect', 'furnicraft_remove_sidebar_product');
```

---

## Custom CSS

Create `wp-content/themes/flavor theme-child/css/furnicraft.css`:

```css
/* ================================
   Furnicraft Custom Styles
   ================================ */

/* CSS Variables */
:root {
    --fc-primary: #8B4513;
    --fc-primary-light: #A0522D;
    --fc-secondary: #D2691E;
    --fc-accent: #228B22;
    --fc-background: #FFF8DC;
    --fc-surface: #FFFFFF;
    --fc-text: #333333;
    --fc-border: #E0D8C8;
    --fc-radius: 8px;
    --fc-shadow: 0 2px 8px rgba(0,0,0,0.08);
    --fc-transition: all 0.3s ease;
}

/* Global Styles */
body {
    background-color: var(--fc-background);
}

/* Header */
.site-header {
    background: var(--fc-surface);
    box-shadow: var(--fc-shadow);
    position: sticky;
    top: 0;
    z-index: 1000;
}

/* Navigation */
.main-navigation a {
    color: var(--fc-text);
    font-weight: 500;
    transition: var(--fc-transition);
}

.main-navigation a:hover {
    color: var(--fc-primary);
}

/* Buttons */
.button,
.wp-element-button,
.woocommerce .button,
button[type="submit"] {
    background: var(--fc-primary);
    color: #fff;
    border: none;
    border-radius: var(--fc-radius);
    padding: 12px 24px;
    font-weight: 600;
    transition: var(--fc-transition);
    cursor: pointer;
}

.button:hover,
.woocommerce .button:hover {
    background: var(--fc-primary-light);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139,69,19,0.3);
}

.button.alt,
.woocommerce .button.alt {
    background: var(--fc-accent);
}

.button.alt:hover,
.woocommerce .button.alt:hover {
    background: #1e7a1e;
}

/* Product Cards */
.woocommerce ul.products li.product {
    background: var(--fc-surface);
    border-radius: var(--fc-radius);
    box-shadow: var(--fc-shadow);
    padding: 0;
    transition: var(--fc-transition);
    overflow: hidden;
}

.woocommerce ul.products li.product:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.woocommerce ul.products li.product img {
    border-radius: 0;
}

.woocommerce ul.products li.product .woocommerce-loop-product__title {
    font-family: var(--fc-font-heading);
    font-size: 1rem;
    font-weight: 600;
    padding: 12px 16px 4px;
    color: var(--fc-text);
}

.woocommerce ul.products li.product .price {
    padding: 0 16px 16px;
    color: var(--fc-primary);
    font-weight: 700;
}

/* Product Badges */
.fc-badge {
    position: absolute;
    top: 10px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 4px;
    z-index: 10;
}

.fc-badge-sale {
    left: 10px;
    background: #DC2626;
    color: #fff;
}

.fc-badge-new {
    right: 10px;
    background: var(--fc-accent);
    color: #fff;
}

.fc-badge-featured {
    right: 10px;
    top: 40px;
    background: var(--fc-secondary);
    color: #fff;
}

/* Product Dimensions */
.fc-product-dimensions {
    font-size: 13px;
    color: #666;
    padding: 0 16px 8px;
    margin: 0;
}

/* WhatsApp Button */
.fc-whatsapp-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #25D366;
    color: #fff !important;
    padding: 12px 20px;
    border-radius: var(--fc-radius);
    font-weight: 600;
    transition: var(--fc-transition);
    margin-top: 10px;
}

.fc-whatsapp-btn:hover {
    background: #128C7E;
    transform: translateY(-2px);
}

/* Single Product */
.single-product .product .summary {
    padding: 24px;
}

.single-product .product .price {
    font-size: 1.5rem;
    color: var(--fc-primary);
    font-weight: 700;
}

/* Breadcrumb */
.fc-breadcrumb {
    font-size: 14px;
    padding: 16px 0;
    color: #666;
}

.fc-breadcrumb a {
    color: var(--fc-primary);
}

.fc-breadcrumb-sep {
    margin: 0 8px;
    color: #ccc;
}

/* Cart & Checkout */
.woocommerce-cart .cart-collaterals,
.woocommerce-checkout .woocommerce-checkout {
    background: var(--fc-surface);
    padding: 24px;
    border-radius: var(--fc-radius);
    box-shadow: var(--fc-shadow);
}

/* Footer */
.site-footer {
    background: var(--fc-text);
    color: #fff;
    padding: 60px 0 30px;
}

.site-footer a {
    color: var(--fc-border);
    transition: var(--fc-transition);
}

.site-footer a:hover {
    color: #fff;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .woocommerce ul.products li.product {
        width: 48% !important;
        margin-right: 4% !important;
    }
    
    .woocommerce ul.products li.product:nth-child(2n) {
        margin-right: 0 !important;
    }
}

@media (max-width: 480px) {
    .woocommerce ul.products li.product {
        width: 100% !important;
        margin-right: 0 !important;
    }
}
```

---

## Customizer Settings

### Site Identity

**Appearance → Customize → Site Identity**

```
Site Identity:
├── Logo: Upload logo-full-color.svg
├── Site Title: PT. Furnicraft Indonesia
├── Tagline: Furniture Berkualitas untuk Hunian Modern
├── Site Icon (Favicon): Upload favicon.ico
└── Display Site Title and Tagline: No (logo only)
```

### Header Settings

```
Header:
├── Header Layout: Logo left, menu right
├── Sticky Header: Yes
├── Search Icon: Yes
├── Cart Icon: Yes
├── Account Icon: Yes
└── Mobile Menu: Hamburger
```

### Footer Settings

```
Footer:
├── Columns: 4
├── Column 1: About Furnicraft (text widget)
├── Column 2: Products (menu widget)
├── Column 3: Customer Service (menu widget)
├── Column 4: Contact Info (custom HTML)
├── Copyright: © 2024 PT. Furnicraft Indonesia
└── Social Links: Instagram, Facebook, YouTube
```

---

## Block Patterns (FSE)

Create custom block patterns in `wp-content/themes/flavor theme-child/inc/block-patterns.php`:

```php
<?php
/**
 * Custom Block Patterns for Furnicraft
 */

function furnicraft_register_block_patterns() {
    // Hero Banner Pattern
    register_block_pattern(
        'furnicraft/hero-banner',
        array(
            'title'       => 'Furnicraft Hero Banner',
            'description' => 'Hero section with background image and CTA',
            'categories'  => array('furnicraft'),
            'content'     => '<!-- wp:cover {"url":"","dimRatio":50,"overlayColor":"fc-primary"} -->
                <div class="wp-block-cover">
                    <span aria-hidden="true" class="wp-block-cover__background has-fc-primary-background-color has-background-dim-50 has-background-dim"></span>
                    <div class="wp-block-cover__inner-container">
                        <!-- wp:heading {"textAlign":"center","level":1} -->
                        <h1 class="has-text-align-center">Furniture Berkualitas untuk Hunian Modern</h1>
                        <!-- /wp:heading -->
                        <!-- wp:paragraph {"align":"center"} -->
                        <p class="has-text-align-center">Temukan koleksi furniture kayu jati premium dengan desain minimalis modern.</p>
                        <!-- /wp:paragraph -->
                        <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
                        <div class="wp-block-buttons">
                            <!-- wp:button {"backgroundColor":"fc-accent"} -->
                            <div class="wp-block-button"><a class="wp-block-button__link has-fc-accent-background-color has-background">Lihat Koleksi</a></div>
                            <!-- /wp:button -->
                        </div>
                        <!-- /wp:buttons -->
                    </div>
                </div>
                <!-- /wp:cover -->',
        )
    );
    
    // Featured Categories Pattern
    register_block_pattern(
        'furnicraft/category-grid',
        array(
            'title'       => 'Furnicraft Category Grid',
            'description' => 'Grid of product categories',
            'categories'  => array('furnicraft'),
            'content'     => '<!-- wp:group {"style":{"spacing":{"padding":{"top":"60px","bottom":"60px"}}}} -->
                <div class="wp-block-group" style="padding-top:60px;padding-bottom:60px">
                    <!-- wp:heading {"textAlign":"center"} -->
                    <h2 class="has-text-align-center">Kategori Produk</h2>
                    <!-- /wp:heading -->
                    <!-- wp:woocommerce/product-categories {"columns":5,"hasCount":false} /-->
                </div>
                <!-- /wp:group -->',
        )
    );
}
add_action('init', 'furnicraft_register_block_patterns');

// Register block pattern category
function furnicraft_register_pattern_category() {
    register_block_pattern_category('furnicraft', array(
        'label' => 'Furnicraft'
    ));
}
add_action('init', 'furnicraft_register_pattern_category');
```

---

## Checklist

- [ ] Theme selected and installed
- [ ] Child theme created and activated
- [ ] Brand colors configured in CSS variables
- [ ] Typography (Google Fonts) loaded
- [ ] Logo uploaded in all variations
- [ ] Favicon and app icons configured
- [ ] WooCommerce support enabled in theme
- [ ] Custom image sizes registered
- [ ] WooCommerce customizations applied
- [ ] Custom CSS added for branding
- [ ] Customizer settings configured
- [ ] Block patterns registered (optional)
- [ ] Mobile responsive tested
- [ ] Cross-browser tested

---

**Next Document:** [04-product-management.md](./04-product-management.md) - Product Types, Categories & Attributes
