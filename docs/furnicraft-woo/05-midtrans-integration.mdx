# 05. Midtrans Payment Gateway Integration

> Panduan integrasi pembayaran Midtrans untuk Furnicraft Commerce

---

## Midtrans Overview

### Supported Payment Methods

| Category | Payment Method | Transaction Fee |
|----------|----------------|-----------------|
| **Bank Transfer** | BCA, Mandiri, BNI, BRI, Permata | Rp 4.000/transaksi |
| **Virtual Account** | All major banks | Rp 4.000/transaksi |
| **Credit Card** | Visa, Mastercard, JCB, Amex | 2.9% + Rp 2.000 |
| **E-Wallet** | GoPay, ShopeePay, Dana, OVO, LinkAja | 2% |
| **QRIS** | All QRIS-enabled apps | 0.7% |
| **Convenience Store** | Alfamart, Indomaret | Rp 5.000/transaksi |
| **Cardless Credit** | Akulaku, Kredivo | 3% + MDR |

### Account Requirements

1. Register at [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Complete business verification
3. Submit required documents:
   - SIUP/NIB
   - Company profile
   - Bank account details
4. Obtain API keys (Sandbox & Production)

---

## Plugin Installation

### Install Midtrans WooCommerce Plugin

```bash
cd /var/www/furnicraft.co.id/public_html

# Install from WordPress repository
wp plugin install midtrans-woocommerce --activate --allow-root

# Verify installation
wp plugin list --allow-root | grep midtrans
```

### Alternative: Install from GitHub (Latest)

```bash
cd wp-content/plugins
git clone https://github.com/Midtrans/midtrans-woocommerce.git
wp plugin activate midtrans-woocommerce --allow-root
```

---

## Sandbox Configuration

### Get Sandbox API Keys

1. Login to [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com)
2. Navigate to **Settings → Access Keys**
3. Copy:
   - Merchant ID
   - Client Key
   - Server Key

### Configure WooCommerce

**WooCommerce → Settings → Payments → Midtrans**

```
General Settings:
├── Enable/Disable: ✓ Enable Midtrans Payment
├── Title: Pembayaran Online (Midtrans)
├── Description: Bayar dengan Bank Transfer, Kartu Kredit, E-Wallet, atau QRIS
│
├── Environment: Sandbox (for testing)
├── Merchant ID: G123456789
├── Client Key: SB-Mid-client-xxxxxxxxxxxx
├── Server Key: SB-Mid-server-xxxxxxxxxxxx
│
└── Production Mode: No (toggle when going live)
```

### Payment Method Settings

**Enable Payment Channels:**

```
Credit Card:
├── Enable Credit Card: ✓
├── Enable 3D Secure: ✓ (Required by regulations)
├── Save Card: ✓ (for returning customers)
├── Acquire Bank: BCA
├── One Click: ✓
└── Two Clicks: ✓

Bank Transfer:
├── Enable Bank Transfer: ✓
├── Enable BCA VA: ✓
├── Enable BNI VA: ✓
├── Enable BRI VA: ✓
├── Enable Mandiri Bill: ✓
└── Enable Permata VA: ✓

E-Wallet:
├── Enable GoPay: ✓
├── Enable ShopeePay: ✓
├── Enable Dana: ✓
├── Enable OVO: ✓
├── Enable LinkAja: ✓
└── Enable QRIS: ✓

Convenience Store:
├── Enable Alfamart: ✓
└── Enable Indomaret: ✓

Cardless Credit:
├── Enable Akulaku: ✓
└── Enable Kredivo: ✓
```

---

## Notification URL (Webhook)

### Configure Notification Handler

**Midtrans Dashboard → Settings → Configuration**

```
Payment Notification URL:
├── URL: https://www.furnicraft.co.id/?wc-api=WC_Gateway_Midtrans
└── HTTP Method: POST

Finish Redirect URL:
└── https://www.furnicraft.co.id/checkout/order-received/

Unfinish Redirect URL:
└── https://www.furnicraft.co.id/checkout/

Error Redirect URL:
└── https://www.furnicraft.co.id/checkout/?payment_error=true
```

### Verify Webhook

```bash
# Test webhook endpoint
curl -X POST https://www.furnicraft.co.id/?wc-api=WC_Gateway_Midtrans \
  -H "Content-Type: application/json" \
  -d '{"order_id": "test-123", "transaction_status": "capture"}'
```

---

## Order Status Mapping

### Midtrans → WooCommerce Status

| Midtrans Status | WooCommerce Status | Action |
|-----------------|-------------------|--------|
| `pending` | On Hold | Waiting for payment |
| `capture` | Processing | Payment captured (CC) |
| `settlement` | Processing | Payment received |
| `deny` | Failed | Payment denied |
| `cancel` | Cancelled | Transaction cancelled |
| `expire` | Cancelled | Payment expired |
| `refund` | Refunded | Full refund processed |
| `partial_refund` | Processing | Partial refund |

### Custom Status Handling

Add to child theme `functions.php`:

```php
<?php
/**
 * Custom Midtrans Status Handler
 */

// Auto-complete orders for digital products (optional)
function furnicraft_midtrans_auto_complete($order_id) {
    $order = wc_get_order($order_id);
    
    // Skip if order already completed
    if ($order->get_status() === 'completed') {
        return;
    }
    
    // Check if all products are virtual/downloadable
    $all_virtual = true;
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        if (!$product->is_virtual() && !$product->is_downloadable()) {
            $all_virtual = false;
            break;
        }
    }
    
    // Auto-complete if all virtual
    if ($all_virtual) {
        $order->update_status('completed', 'Midtrans: Auto-completed for virtual products');
    }
}
add_action('woocommerce_payment_complete', 'furnicraft_midtrans_auto_complete');

// Custom notification for pending payment
function furnicraft_midtrans_pending_notification($order_id) {
    $order = wc_get_order($order_id);
    
    // Add order note
    $order->add_order_note(
        sprintf('Menunggu pembayaran via %s. Batas waktu: 24 jam.',
            $order->get_payment_method_title()
        )
    );
}
add_action('woocommerce_order_status_on-hold', 'furnicraft_midtrans_pending_notification');
```

---

## Credit Card Configuration

### 3D Secure (3DS)

Required for Indonesian transactions:

```
Credit Card Settings:
├── 3D Secure: ✓ Enable
├── Acquire Bank: BCA (or BNI, Mandiri, etc.)
│
├── Installment:
│   ├── Enable Installment: ✓
│   ├── Minimum Amount: Rp 500.000
│   ├── Available Terms: 3, 6, 12 months
│   └── Interest: 0% (merchant absorbed)
│
└── Fraud Detection:
    ├── Enable FDS: ✓
    └── Challenge Mode: Auto (recommended)
```

### Installment Configuration

In Midtrans Dashboard → Settings → Installment:

```
BCA Installment:
├── 3 months: 0% interest
├── 6 months: 0% interest
└── 12 months: 0% interest

BNI Installment:
├── 3 months: 0% interest
├── 6 months: 0% interest
└── 12 months: 0% interest

Mandiri Installment:
├── 3 months: 0% interest
├── 6 months: 0% interest
└── 12 months: 2.5% interest
```

---

## E-Wallet Deep Links

### GoPay Configuration

```
GoPay Settings:
├── Enable GoPay: ✓
├── Enable Callback: ✓
├── Callback URL: https://www.furnicraft.co.id/gopay-callback
└── Expiry Time: 15 minutes
```

### GoPay QR vs Deep Link

```php
<?php
// GoPay displays QR on desktop, deeplink on mobile
// Handled automatically by Midtrans plugin

// Custom styling for GoPay button
function furnicraft_gopay_button_style() {
    ?>
    <style>
        .midtrans-gopay-button {
            background: linear-gradient(135deg, #00AED6 0%, #00D4AA 100%);
            border-radius: 8px;
            padding: 12px 24px;
        }
        .midtrans-gopay-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 174, 214, 0.4);
        }
    </style>
    <?php
}
add_action('wp_head', 'furnicraft_gopay_button_style');
```

---

## QRIS Configuration

### Enable QRIS

```
QRIS Settings:
├── Enable QRIS: ✓
├── Acquire: Midtrans (default)
├── QR Display Time: 15 minutes
└── Show Instructions: ✓
```

### QRIS Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant W as WooCommerce
    participant M as Midtrans
    participant B as Bank/Wallet
    
    C->>W: Checkout with QRIS
    W->>M: Create QRIS Transaction
    M->>W: Return QR Code
    W->>C: Display QR Code
    C->>B: Scan & Pay
    B->>M: Payment Notification
    M->>W: Webhook Callback
    W->>C: Order Confirmed
```

---

## Testing in Sandbox

### Test Credit Card Numbers

| Card | Number | CVV | Expiry |
|------|--------|-----|--------|
| Success | 4811 1111 1111 1114 | 123 | Any future |
| 3DS Required | 4511 1111 1111 1117 | 123 | Any future |
| Decline | 4211 1111 1111 1110 | 123 | Any future |
| Insufficient Funds | 4311 1111 1111 1119 | 123 | Any future |

### Test Bank Transfer

```
Virtual Account Testing:
├── BCA: Use any payment to VA number
├── BNI: Use any payment to VA number
├── Mandiri: Use bill key + biller code
└── All: Automatically settled in sandbox
```

### Test E-Wallet

```
E-Wallet Sandbox:
├── GoPay: Scan QR with any QR scanner
├── ShopeePay: Click simulator button
├── Dana: Click simulator button
└── All: Automatically settled
```

### Verify Test Transaction

```bash
# Check transaction via API
curl -X GET \
  'https://api.sandbox.midtrans.com/v2/ORDER_ID/status' \
  -H 'Authorization: Basic YOUR_SERVER_KEY_BASE64' \
  -H 'Content-Type: application/json'
```

---

## Production Deployment

### Pre-Production Checklist

- [ ] Business verification completed
- [ ] Production API keys obtained
- [ ] All payment methods tested in sandbox
- [ ] Notification URL verified
- [ ] Error handling tested
- [ ] Refund flow tested
- [ ] Transaction reports reviewed

### Switch to Production

**WooCommerce → Settings → Payments → Midtrans**

```
Production Settings:
├── Environment: Production
├── Merchant ID: G987654321
├── Client Key: Mid-client-xxxxxxxxxxxx
├── Server Key: Mid-server-xxxxxxxxxxxx
└── Production Mode: ✓ Yes
```

### Update Notification URL

**Midtrans Production Dashboard → Settings → Configuration**

```
Notification URL: https://www.furnicraft.co.id/?wc-api=WC_Gateway_Midtrans
```

---

## Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `401` | Invalid Server Key | Check API keys |
| `402` | Transaction denied | Check payment details |
| `404` | Order not found | Verify order ID format |
| `406` | Duplicate order ID | Use unique order ID |
| `503` | Midtrans unavailable | Retry or contact support |

### Error Logging

```php
<?php
/**
 * Log Midtrans errors
 */
function furnicraft_log_midtrans_error($error_message, $order_id = null) {
    $log = wc_get_logger();
    $context = array('source' => 'furnicraft-midtrans');
    
    $message = sprintf(
        '[%s] Order: %s | Error: %s',
        current_time('Y-m-d H:i:s'),
        $order_id,
        $error_message
    );
    
    $log->error($message, $context);
}

// Hook into Midtrans payment error
add_action('midtrans_payment_error', function($error, $order) {
    furnicraft_log_midtrans_error($error, $order->get_id());
}, 10, 2);
```

---

## Refund Process

### Manual Refund

**WooCommerce → Orders → [Order] → Refund**

1. Click "Refund" button
2. Enter refund amount
3. Select "Refund via Midtrans"
4. Add refund reason
5. Click "Refund Rp X.XXX.XXX via Midtrans"

### Refund API (Programmatic)

```php
<?php
/**
 * Process refund via Midtrans API
 */
function furnicraft_process_refund($order_id, $amount, $reason = '') {
    $order = wc_get_order($order_id);
    $transaction_id = $order->get_transaction_id();
    
    // Only works for Credit Card transactions
    if ($order->get_payment_method() !== 'midtrans_cc') {
        return new WP_Error('invalid_method', 'Refund only available for Credit Card');
    }
    
    $url = 'https://api.midtrans.com/v2/' . $transaction_id . '/refund';
    
    $args = array(
        'headers' => array(
            'Authorization' => 'Basic ' . base64_encode(MIDTRANS_SERVER_KEY . ':'),
            'Content-Type'  => 'application/json',
        ),
        'body' => json_encode(array(
            'refund_key' => $order_id . '-refund-' . time(),
            'amount'     => intval($amount),
            'reason'     => $reason,
        )),
    );
    
    $response = wp_remote_post($url, $args);
    
    if (is_wp_error($response)) {
        return $response;
    }
    
    return json_decode(wp_remote_retrieve_body($response), true);
}
```

---

## Transaction Reports

### Download Reports

**Midtrans Dashboard → Transaction → Export**

Available formats:
- CSV
- Excel
- PDF

### Automated Report via API

```bash
# Get transaction list
curl -X GET \
  'https://api.midtrans.com/v2/transactions?from=2024-01-01&to=2024-01-31' \
  -H 'Authorization: Basic YOUR_SERVER_KEY_BASE64'
```

---

## Security Best Practices

### Secure API Keys

```php
// Store keys in wp-config.php (not in database)
define('MIDTRANS_SERVER_KEY', 'your-server-key');
define('MIDTRANS_CLIENT_KEY', 'your-client-key');
define('MIDTRANS_MERCHANT_ID', 'your-merchant-id');

// Use constants in plugin settings
add_filter('woocommerce_midtrans_settings', function($settings) {
    if (defined('MIDTRANS_SERVER_KEY')) {
        $settings['server_key'] = MIDTRANS_SERVER_KEY;
    }
    return $settings;
});
```

### Validate Signatures

```php
<?php
/**
 * Validate Midtrans notification signature
 */
function furnicraft_validate_midtrans_signature($notification) {
    $order_id = $notification->order_id;
    $status_code = $notification->status_code;
    $gross_amount = $notification->gross_amount;
    $server_key = MIDTRANS_SERVER_KEY;
    $signature_key = $notification->signature_key;
    
    $expected_signature = hash('sha512', 
        $order_id . $status_code . $gross_amount . $server_key
    );
    
    return $signature_key === $expected_signature;
}
```

---

## Checklist

- [ ] Midtrans plugin installed and activated
- [ ] Sandbox API keys configured
- [ ] All payment methods enabled
- [ ] Notification URL configured
- [ ] Order status mapping verified
- [ ] Credit Card 3DS enabled
- [ ] Installment options configured
- [ ] E-wallet payments tested
- [ ] QRIS payments tested
- [ ] Bank Transfer tested
- [ ] Error handling implemented
- [ ] Refund process tested
- [ ] Production API keys ready
- [ ] Security measures implemented
- [ ] Transaction reports accessible

---

**Next Document:** [06-shipping-configuration.md](./06-shipping-configuration.md) - Indonesian Shipping Configuration
