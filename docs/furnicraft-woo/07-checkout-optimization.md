# 07. Checkout Optimization

Panduan optimasi checkout untuk meningkatkan conversion rate Furnicraft E-Commerce.

---

## Daftar Isi

1. [Block Checkout vs Classic](#1-block-checkout-vs-classic)
2. [Checkout Fields Customization](#2-checkout-fields-customization)
3. [Cart Page Optimization](#3-cart-page-optimization)
4. [Abandoned Cart Recovery](#4-abandoned-cart-recovery)
5. [Guest Checkout](#5-guest-checkout)
6. [Express Checkout](#6-express-checkout)
7. [Order Confirmation](#7-order-confirmation)
8. [Mobile Checkout UX](#8-mobile-checkout-ux)

---

## 1. Block Checkout vs Classic

### 1.1 WooCommerce Block Checkout

WooCommerce 8.3+ menggunakan Block Checkout sebagai default.

```
Block Checkout Advantages:
├── Modern, responsive design
├── Better mobile experience
├── Built-in address validation
├── Faster load time (React-based)
├── Extension-friendly API
└── Future-proof (WooCommerce direction)

Block Checkout Limitations:
├── Some legacy plugins incompatible
├── Custom checkout fields need block API
└── Learning curve for customization
```

### 1.2 Menggunakan Block Checkout

```
Setup Block Checkout:
1. Pages → Checkout
2. Delete classic shortcode [woocommerce_checkout]
3. Add block: "Checkout" (WooCommerce block)
4. Configure block settings in sidebar
5. Save & test
```

### 1.3 Block Checkout Configuration

```
Checkout Block Settings (sidebar):
│
├── CONTACT INFORMATION
│   ├── ✓ Allow customers to log in
│   └── ✓ Allow customers to create an account
│
├── SHIPPING ADDRESS
│   ├── ✓ Company field: Hidden
│   ├── ✓ Apartment field: Optional
│   └── ✓ Phone field: Required
│
├── BILLING ADDRESS
│   └── ✓ Use same address for billing
│
├── SHIPPING OPTIONS
│   └── ✓ Show shipping calculator
│
└── PAYMENT OPTIONS
    ├── ✓ Show payment method icons
    └── ✓ Enable express payment buttons
```

---

## 2. Checkout Fields Customization

### 2.1 Indonesian Checkout Fields

```
Required Fields for Indonesia:
├── Nama Lengkap (billing_first_name + billing_last_name)
├── Email
├── No. HP (required, dengan validasi +62)
├── Alamat Lengkap
├── Provinsi (dropdown)
├── Kota/Kabupaten (dropdown, dependent)
├── Kecamatan (untuk RajaOngkir)
├── Kode Pos
└── Catatan Pesanan (optional)
```

### 2.2 Customize Checkout Fields

```php
// functions.php - Customize checkout fields
add_filter('woocommerce_checkout_fields', 'furnicraft_checkout_fields');
function furnicraft_checkout_fields($fields) {
    
    // Make phone required
    $fields['billing']['billing_phone']['required'] = true;
    $fields['billing']['billing_phone']['label'] = 'No. HP (WhatsApp)';
    $fields['billing']['billing_phone']['placeholder'] = '08xxxxxxxxxx';
    
    // Remove company field
    unset($fields['billing']['billing_company']);
    unset($fields['shipping']['shipping_company']);
    
    // Reorder fields
    $fields['billing']['billing_first_name']['priority'] = 10;
    $fields['billing']['billing_last_name']['priority'] = 20;
    $fields['billing']['billing_phone']['priority'] = 30;
    $fields['billing']['billing_email']['priority'] = 40;
    $fields['billing']['billing_address_1']['priority'] = 50;
    $fields['billing']['billing_state']['priority'] = 60;
    $fields['billing']['billing_city']['priority'] = 70;
    $fields['billing']['billing_postcode']['priority'] = 80;
    
    // Custom labels
    $fields['billing']['billing_address_1']['label'] = 'Alamat Lengkap';
    $fields['billing']['billing_address_1']['placeholder'] = 'Nama jalan, nomor rumah, RT/RW';
    $fields['billing']['billing_state']['label'] = 'Provinsi';
    $fields['billing']['billing_city']['label'] = 'Kota/Kabupaten';
    
    return $fields;
}

// Validate Indonesian phone number
add_action('woocommerce_checkout_process', 'furnicraft_validate_phone');
function furnicraft_validate_phone() {
    $phone = $_POST['billing_phone'];
    
    // Remove spaces and dashes
    $phone = preg_replace('/[\s\-]/', '', $phone);
    
    // Check if valid Indonesian phone
    if (!preg_match('/^(\+62|62|0)8[1-9][0-9]{7,10}$/', $phone)) {
        wc_add_notice('Mohon masukkan nomor HP Indonesia yang valid (contoh: 081234567890)', 'error');
    }
}
```

### 2.3 Add Kecamatan Field (for RajaOngkir)

```php
// Add subdistrict field for RajaOngkir
add_filter('woocommerce_checkout_fields', 'furnicraft_add_subdistrict');
function furnicraft_add_subdistrict($fields) {
    $fields['shipping']['shipping_subdistrict'] = array(
        'label'       => 'Kecamatan',
        'placeholder' => 'Pilih Kecamatan',
        'required'    => true,
        'class'       => array('form-row-wide'),
        'priority'    => 75,
    );
    return $fields;
}

// Save subdistrict to order
add_action('woocommerce_checkout_update_order_meta', 'furnicraft_save_subdistrict');
function furnicraft_save_subdistrict($order_id) {
    if (!empty($_POST['shipping_subdistrict'])) {
        update_post_meta($order_id, '_shipping_subdistrict', 
            sanitize_text_field($_POST['shipping_subdistrict']));
    }
}
```

---

## 3. Cart Page Optimization

### 3.1 Cart Block Configuration

```
Cart Block Features:
├── Quantity controls
├── Remove item button
├── Subtotal display
├── Coupon field
├── Shipping calculator
├── Cross-sells
└── Proceed to checkout CTA
```

### 3.2 Persistent Cart

```php
// functions.php - Enable persistent cart for logged-in users
// Already enabled by default in WooCommerce 8+

// For guests, use cookies (30 days)
add_filter('woocommerce_persistent_cart_expiration', function() {
    return 30 * DAY_IN_SECONDS;
});
```

### 3.3 Cart Notices

```php
// Show minimum order notice
add_action('woocommerce_before_cart', 'furnicraft_minimum_order_notice');
function furnicraft_minimum_order_notice() {
    $minimum = 1000000; // Rp 1 juta minimum
    $cart_total = WC()->cart->subtotal;
    
    if ($cart_total < $minimum && $cart_total > 0) {
        $remaining = wc_price($minimum - $cart_total);
        wc_print_notice(
            sprintf('Minimum order Rp %s. Belanja %s lagi untuk melanjutkan.', 
                number_format($minimum, 0, ',', '.'), 
                $remaining
            ), 
            'notice'
        );
    }
}

// Enforce minimum order
add_action('woocommerce_check_cart_items', 'furnicraft_enforce_minimum_order');
function furnicraft_enforce_minimum_order() {
    $minimum = 1000000;
    $cart_total = WC()->cart->subtotal;
    
    if ($cart_total < $minimum && $cart_total > 0) {
        wc_add_notice(
            sprintf('Minimum order adalah Rp %s. Silakan tambah produk lain.', 
                number_format($minimum, 0, ',', '.')
            ), 
            'error'
        );
    }
}
```

### 3.4 Cross-Sells & Upsells

```php
// Customize cross-sells on cart
add_filter('woocommerce_cross_sells_columns', function() { return 4; });
add_filter('woocommerce_cross_sells_total', function() { return 4; });

// Custom cross-sell title
add_filter('woocommerce_product_cross_sells_products_heading', function() {
    return 'Lengkapi Ruangan Anda';
});
```

---

## 4. Abandoned Cart Recovery

### 4.1 Plugin Recommendation

```
Recommended Plugins:
├── WooCommerce AutomateWoo (premium, powerful)
├── Abandoned Cart Lite for WooCommerce (free)
├── Retainful - WooCommerce Abandoned Cart (freemium)
└── CartBounty – Save and recover abandoned carts (free)
```

### 4.2 Abandoned Cart Lite Configuration

```
Settings → Abandoned Carts:
│
├── CART TRACKING
│   ├── Start tracking after: 15 minutes
│   ├── Delete abandoned carts after: 30 days
│   └── Track guest carts: Yes
│
├── EMAIL SEQUENCE
│   ├── Email 1:
│   │   ├── Send after: 1 hour
│   │   ├── Subject: "Pesanan Anda menunggu di keranjang"
│   │   └── Content: Reminder + cart contents
│   │
│   ├── Email 2:
│   │   ├── Send after: 24 hours
│   │   ├── Subject: "Jangan lewatkan! Stok terbatas"
│   │   └── Content: Urgency + social proof
│   │
│   └── Email 3:
│       ├── Send after: 72 hours
│       ├── Subject: "Diskon 10% khusus untuk Anda"
│       └── Content: Discount code + cart link
│
└── COUPON SETTINGS
    ├── Generate unique coupons: Yes
    ├── Discount type: Percentage
    ├── Discount amount: 10%
    └── Expiry: 7 days
```

### 4.3 Abandoned Cart Email Template

```html
<!-- Email 1: Gentle Reminder -->
<h2>Hai {{customer_name}},</h2>

<p>Sepertinya ada yang tertinggal di keranjang belanja Anda:</p>

{{cart_contents}}

<p><strong>Total: {{cart_total}}</strong></p>

<a href="{{cart_recovery_link}}" class="button">
    Lanjutkan Belanja
</a>

<p>Butuh bantuan? Hubungi kami di WhatsApp: 
   <a href="https://wa.me/6281234567890">0812-3456-7890</a>
</p>

<p>Salam,<br>Tim Furnicraft</p>
```

---

## 5. Guest Checkout

### 5.1 Enable Guest Checkout

```
WooCommerce → Settings → Accounts & Privacy:

├── Guest checkout
│   └── ✓ Allow customers to place orders without an account
│
├── Account creation
│   ├── ✓ Allow customers to create an account during checkout
│   ├── ✓ Allow customers to create an account on "My Account" page
│   └── ✓ Send password setup link (instead of auto-generating)
│
└── Privacy policy
    ├── Registration: Link to privacy policy
    └── Checkout: Show privacy policy text
```

### 5.2 Optional Account Creation

```php
// Auto-create account for guests (opt-in)
add_action('woocommerce_checkout_update_order_meta', 'furnicraft_maybe_create_account');
function furnicraft_maybe_create_account($order_id) {
    if (!is_user_logged_in() && isset($_POST['createaccount']) && $_POST['createaccount']) {
        // WooCommerce handles this automatically when enabled
        // This hook is for additional custom logic if needed
    }
}
```

---

## 6. Express Checkout

### 6.1 Express Payment Buttons

```
Block Checkout supports:
├── Apple Pay (via Stripe)
├── Google Pay (via Stripe)
├── PayPal Express
├── Shop Pay
└── Midtrans QRIS Snap
```

### 6.2 Enable Express Checkout

```
Enable via Stripe:
1. WooCommerce → Settings → Payments → Stripe
2. Enable Apple Pay / Google Pay
3. Verify domain for Apple Pay
4. Express buttons appear at top of checkout
```

### 6.3 WhatsApp Order Button

```php
// Alternative: WhatsApp Order button for complex orders
add_action('woocommerce_review_order_before_submit', 'furnicraft_whatsapp_order');
function furnicraft_whatsapp_order() {
    ?>
    <div class="whatsapp-order-option">
        <p>Butuh bantuan? Pesan via WhatsApp:</p>
        <a href="https://wa.me/6281234567890?text=<?php echo urlencode('Halo, saya ingin memesan dari website Furnicraft'); ?>" 
           class="button alt whatsapp-btn" 
           target="_blank">
            💬 Order via WhatsApp
        </a>
    </div>
    <?php
}
```

---

## 7. Order Confirmation

### 7.1 Thank You Page

```php
// Customize thank you page
add_action('woocommerce_thankyou', 'furnicraft_thankyou_content', 5);
function furnicraft_thankyou_content($order_id) {
    $order = wc_get_order($order_id);
    ?>
    <div class="furnicraft-thankyou">
        <div class="thankyou-header">
            <span class="checkmark">✓</span>
            <h2>Terima Kasih atas Pesanan Anda!</h2>
            <p>Order #<?php echo $order->get_order_number(); ?></p>
        </div>
        
        <div class="next-steps">
            <h3>Langkah Selanjutnya:</h3>
            <ol>
                <li>Cek email untuk konfirmasi pesanan</li>
                <li>Lakukan pembayaran sesuai metode yang dipilih</li>
                <li>Kirim bukti pembayaran via WhatsApp jika bank transfer</li>
                <li>Pesanan akan diproses setelah pembayaran dikonfirmasi</li>
            </ol>
        </div>
        
        <?php if ($order->get_payment_method() === 'bacs'): ?>
        <div class="bank-transfer-info">
            <h3>Informasi Transfer:</h3>
            <p>Bank: BCA<br>
            No. Rek: 123-456-7890<br>
            A/N: PT. Furnicraft Indonesia</p>
            <p><strong>Jumlah Transfer: <?php echo $order->get_formatted_order_total(); ?></strong></p>
        </div>
        <?php endif; ?>
        
        <div class="contact-support">
            <p>Ada pertanyaan? Hubungi kami:</p>
            <a href="https://wa.me/6281234567890" class="whatsapp-btn">
                💬 WhatsApp Customer Service
            </a>
        </div>
    </div>
    <?php
}
```

### 7.2 Order Confirmation Email

```
WooCommerce → Settings → Emails → Processing order:

Email Settings:
├── Enable: Yes
├── Subject: [Furnicraft] Pesanan #{order_number} sedang diproses
├── Heading: Terima kasih atas pesanan Anda!
├── Email type: HTML
│
└── Content additions:
    ├── Order details
    ├── Payment instructions (if bank transfer)
    ├── Estimated delivery
    ├── Customer service contact
    └── WhatsApp link for support
```

---

## 8. Mobile Checkout UX

### 8.1 Mobile Optimization

```css
/* Additional mobile checkout styles */
@media (max-width: 768px) {
    .wc-block-checkout {
        padding: 0 15px;
    }
    
    .wc-block-checkout__form {
        display: flex;
        flex-direction: column;
    }
    
    /* Larger touch targets */
    .wc-block-components-text-input input,
    .wc-block-components-select select {
        min-height: 48px;
        font-size: 16px; /* Prevents iOS zoom */
    }
    
    /* Sticky order summary on mobile */
    .wc-block-checkout__sidebar {
        position: sticky;
        top: 0;
        background: #fff;
        z-index: 10;
    }
    
    /* Full-width CTA button */
    .wc-block-components-checkout-place-order-button {
        width: 100%;
        min-height: 56px;
        font-size: 18px;
    }
}
```

### 8.2 Mobile Payment UX

```
Mobile Payment Considerations:
├── Show QR code for QRIS (scannable)
├── Deep link for e-wallet apps (GoPay, ShopeePay)
├── One-tap saved payment methods
├── Fingerprint/Face ID authentication
└── Clear loading states for payment processing
```

---

## 9. Checkout Optimization Checklist

- [ ] Implement Block Checkout
- [ ] Customize checkout fields for Indonesia
- [ ] Add phone validation (+62 format)
- [ ] Setup minimum order enforcement (Rp 1 juta)
- [ ] Configure free shipping progress bar
- [ ] Install abandoned cart recovery plugin
- [ ] Setup 3-email abandoned cart sequence
- [ ] Enable guest checkout
- [ ] Customize thank you page
- [ ] Add WhatsApp support button
- [ ] Optimize mobile checkout UX
- [ ] Test full checkout flow on mobile

---

**Dokumen Berikutnya:** [08-seo-analytics.md](./08-seo-analytics.md) - SEO & Analytics
