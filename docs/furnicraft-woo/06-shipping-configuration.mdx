# 06. Shipping Configuration

Panduan konfigurasi pengiriman untuk Furnicraft E-Commerce dengan fokus pada pasar Indonesia.

---

## Daftar Isi

1. [Shipping Zones](#1-shipping-zones)
2. [Flat Rate Configuration](#2-flat-rate-configuration)
3. [Weight-Based Shipping](#3-weight-based-shipping)
4. [RajaOngkir Integration](#4-rajaongkir-integration)
5. [Free Shipping Setup](#5-free-shipping-setup)
6. [Local Pickup](#6-local-pickup)
7. [Shipping Classes](#7-shipping-classes)
8. [Estimasi Pengiriman](#8-estimasi-pengiriman)

---

## 1. Shipping Zones

### 1.1 Konsep Shipping Zone

WooCommerce shipping zone menentukan tarif berdasarkan lokasi customer.

```
Shipping Zones Structure:
├── Zone 1: Jabodetabek (Priority)
│   ├── Jakarta, Bogor, Depok, Tangerang, Bekasi
│   ├── Flat Rate: Rp 150.000
│   └── Free Shipping: Order ≥ Rp 10.000.000
│
├── Zone 2: Jawa (Non-Jabodetabek)
│   ├── Jawa Barat, Jawa Tengah, Jawa Timur, DIY, Banten
│   └── Weight-Based: via RajaOngkir API
│
├── Zone 3: Luar Jawa
│   ├── Sumatera, Kalimantan, Sulawesi, Bali, NTB, NTT
│   └── Weight-Based: Higher rate
│
└── Zone 4: Indonesia Timur
    ├── Papua, Maluku
    └── Weight-Based: Premium rate + Surcharge
```

### 1.2 Konfigurasi Zone

**WooCommerce → Settings → Shipping → Shipping zones**

#### Zone 1: Jabodetabek

```
Zone Name: Jabodetabek
Zone Regions:
├── DKI Jakarta (semua)
├── Jawa Barat:
│   ├── Kota Bogor
│   ├── Kabupaten Bogor
│   ├── Kota Depok
│   └── Kota Bekasi, Kabupaten Bekasi
└── Banten:
    ├── Kota Tangerang
    ├── Kota Tangerang Selatan
    └── Kabupaten Tangerang

Shipping Methods:
├── Flat Rate: Rp 150.000
├── Free Shipping (min Rp 10.000.000)
├── Local Pickup: Rp 0
└── Furnicraft Delivery: Rp 200.000 (white glove)
```

#### Zone 2: Jawa

```
Zone Name: Pulau Jawa (Non-Jabodetabek)
Zone Regions:
├── Jawa Barat (exclude Jabodetabek cities)
├── Jawa Tengah (all)
├── Jawa Timur (all)
├── DI Yogyakarta (all)
└── Banten (exclude Tangerang)

Shipping Methods:
├── JNE REG: via RajaOngkir
├── JNE YES: via RajaOngkir
├── SiCepat REG: via RajaOngkir
└── Free Shipping (min Rp 15.000.000)
```

---

## 2. Flat Rate Configuration

### 2.1 Jabodetabek Flat Rate

```php
// Flat rate calculation for furniture
Flat Rate Settings:
├── Title: Pengiriman Jabodetabek
├── Tax Status: Taxable
├── Cost: 150000
│
├── Additional Costs:
│   └── Per Item: + Rp 50.000 (untuk item tambahan)
│
└── Shipping Class Costs:
    ├── Furniture Kecil: + Rp 0
    ├── Furniture Sedang: + Rp 100.000
    └── Furniture Besar: + Rp 250.000
```

### 2.2 Cost Formula

```
Cost formula options:
├── [qty] - Number of items
├── [cost] - Base cost
├── [fee percent="10" min_fee="5000"] - Percentage fee
│
Example:
└── 150000 + (50000 * ([qty] - 1))
    = Rp 150.000 + Rp 50.000 per item tambahan
```

---

## 3. Weight-Based Shipping

### 3.1 Table Rate Shipping Plugin

**Recommended Plugin:** WooCommerce Table Rate Shipping

```
Installation:
├── Plugins → Add New
├── Search: "Table Rate Shipping for WooCommerce"
└── Install & Activate (by developer: JEM Plugins or WooCommerce)
```

### 3.2 Weight-Based Rules

```
Weight-Based Configuration:
│
├── 0-10 kg:
│   ├── Jawa: Rp 50.000
│   ├── Sumatera: Rp 100.000
│   ├── Kalimantan: Rp 120.000
│   └── Sulawesi+: Rp 150.000
│
├── 11-30 kg:
│   ├── Jawa: Rp 100.000
│   ├── Sumatera: Rp 200.000
│   ├── Kalimantan: Rp 250.000
│   └── Sulawesi+: Rp 300.000
│
├── 31-50 kg:
│   ├── Jawa: Rp 200.000
│   ├── Sumatera: Rp 350.000
│   ├── Kalimantan: Rp 450.000
│   └── Sulawesi+: Rp 550.000
│
└── 51+ kg:
    ├── Jawa: Rp 350.000
    ├── Sumatera: Rp 500.000
    └── Kalimantan+: Custom quote required
```

---

## 4. RajaOngkir Integration

### 4.1 RajaOngkir API

RajaOngkir adalah API untuk cek ongkir JNE, TIKI, POS, J&T, dll.

```
RajaOngkir Plans:
├── Starter (Free): JNE, TIKI, POS
├── Basic (Rp 50k/bulan): + JNT, Wahana, SiCepat
├── Pro (Rp 100k/bulan): All couriers + Origin detection
└── Enterprise: Custom
```

### 4.2 WooCommerce RajaOngkir Plugin

**Recommended:** Plugin "Ongkos Kirim" atau "WooCommerce RajaOngkir"

```
Setup:
1. Daftar di rajaongkir.com → Get API Key
2. Install plugin WooCommerce RajaOngkir
3. Settings → RajaOngkir:
   ├── API Key: [your-api-key]
   ├── Account Type: Pro (recommended)
   ├── Origin City: Jakarta Timur (sesuai warehouse)
   │
   ├── Available Couriers:
   │   ├── ✓ JNE (REG, YES, OKE)
   │   ├── ✓ J&T Express
   │   ├── ✓ SiCepat (REG, BEST)
   │   ├── ✓ Anteraja
   │   └── □ Pos Indonesia (optional)
   │
   └── Weight Settings:
       ├── Default Weight: 5 kg
       └── Use Volumetric: Yes (P×L×T/6000)
```

### 4.3 Volumetric Weight

```
Furniture biasanya dihitung volumetric:

Formula:
Volumetric Weight = (P × L × T) / 6000

Example - Meja Makan:
├── Dimensi: 150 × 90 × 75 cm
├── Volumetric: (150 × 90 × 75) / 6000 = 168.75 kg
├── Actual Weight: 45 kg
└── Charged Weight: 168.75 kg (yang lebih besar)

⚠️ Untuk furniture besar, lebih baik gunakan flat rate
   atau custom freight karena volumetric sangat mahal.
```

---

## 5. Free Shipping Setup

### 5.1 Free Shipping Rules

```
WooCommerce → Settings → Shipping → [Zone] → Free Shipping

Free Shipping Settings:
├── Title: Gratis Ongkir
├── Minimum order amount: 10000000 (Rp 10 juta)
├── Requires: Minimum order amount
│
├── Options:
│   ├── ○ A valid free shipping coupon
│   ├── ○ A minimum order amount
│   ├── ● A minimum order amount OR a coupon
│   └── ○ A minimum order amount AND a coupon
│
└── Coupons:
    └── Free shipping coupon code: FREEONGKIR
```

### 5.2 Free Shipping Notice

**Tampilkan progress ke free shipping di cart:**

```php
// functions.php - Free shipping progress bar
add_action('woocommerce_before_cart', 'furnicraft_free_shipping_notice');
function furnicraft_free_shipping_notice() {
    $min_amount = 10000000; // Rp 10 juta
    $current = WC()->cart->subtotal;
    
    if ($current < $min_amount) {
        $remaining = $min_amount - $current;
        $percentage = ($current / $min_amount) * 100;
        ?>
        <div class="free-shipping-notice">
            <p>Belanja <strong><?php echo wc_price($remaining); ?></strong> lagi untuk GRATIS ONGKIR!</p>
            <div class="progress-bar">
                <div class="progress" style="width: <?php echo $percentage; ?>%"></div>
            </div>
        </div>
        <?php
    } else {
        ?>
        <div class="free-shipping-notice success">
            <p>🎉 Selamat! Anda mendapat GRATIS ONGKIR!</p>
        </div>
        <?php
    }
}
```

---

## 6. Local Pickup

### 6.1 Store Locations

```
Local Pickup Locations:
│
├── Showroom Jakarta
│   ├── Address: Jl. Furniture No. 123, Jakarta Timur
│   ├── Hours: Sen-Sab 09:00-18:00
│   ├── Phone: (021) 123-4567
│   └── Pickup Window: 3-7 hari setelah order
│
└── Warehouse Cileungsi
    ├── Address: Jl. Industri No. 456, Cileungsi, Bogor
    ├── Hours: Sen-Jum 08:00-17:00
    ├── Phone: (021) 987-6543
    └── Pickup Window: 1-3 hari setelah order
```

### 6.2 Local Pickup Configuration

```
WooCommerce → Settings → Shipping → [Zone] → Local Pickup

Local Pickup Settings:
├── Title: Ambil di Showroom
├── Tax Status: Taxable
├── Cost: 0 (free)
│
└── Pickup Locations Plugin (optional):
    └── Install "Local Pickup Plus" for multiple locations
```

### 6.3 Pickup Instructions

```php
// Tampilkan instruksi pickup di thank you page
add_action('woocommerce_thankyou', 'furnicraft_pickup_instructions');
function furnicraft_pickup_instructions($order_id) {
    $order = wc_get_order($order_id);
    $shipping_method = $order->get_shipping_method();
    
    if (strpos($shipping_method, 'pickup') !== false) {
        ?>
        <div class="pickup-instructions">
            <h3>Instruksi Pengambilan</h3>
            <ol>
                <li>Tunggu email konfirmasi bahwa pesanan siap diambil (1-3 hari kerja)</li>
                <li>Bawa bukti pembayaran dan KTP saat pengambilan</li>
                <li>Pickup window: 7 hari setelah notifikasi siap</li>
            </ol>
            <p><strong>Lokasi:</strong> Showroom Jakarta<br>
            Jl. Furniture No. 123, Jakarta Timur<br>
            Jam Operasional: Sen-Sab 09:00-18:00</p>
        </div>
        <?php
    }
}
```

---

## 7. Shipping Classes

### 7.1 Furniture Shipping Classes

```
WooCommerce → Settings → Shipping → Shipping classes

Shipping Classes:
│
├── furniture-kecil
│   ├── Name: Furniture Kecil
│   ├── Slug: furniture-kecil
│   ├── Description: Nightstand, Side Table, Kursi
│   └── Typical Weight: 5-15 kg
│
├── furniture-sedang
│   ├── Name: Furniture Sedang
│   ├── Slug: furniture-sedang
│   ├── Description: Meja Kerja, Rak Buku, Lemari Kecil
│   └── Typical Weight: 16-40 kg
│
├── furniture-besar
│   ├── Name: Furniture Besar
│   ├── Slug: furniture-besar
│   ├── Description: Sofa, Meja Makan, Lemari Besar
│   └── Typical Weight: 41-80 kg
│
└── furniture-oversized
    ├── Name: Furniture Oversized
    ├── Slug: furniture-oversized
    ├── Description: Tempat Tidur King, Meja Meeting Besar
    └── Typical Weight: 80+ kg (requires freight)
```

### 7.2 Shipping Class Costs

```
Flat Rate → Shipping class costs:

├── "furniture-kecil" shipping class cost: 0
├── "furniture-sedang" shipping class cost: 100000
├── "furniture-besar" shipping class cost: 250000
├── "furniture-oversized" shipping class cost: 500000
└── No shipping class cost: 50000
```

---

## 8. Estimasi Pengiriman

### 8.1 Delivery Time Estimates

```
Estimated Delivery Times:
│
├── Jabodetabek:
│   ├── Furnicraft Delivery: 3-7 hari kerja
│   ├── White Glove Service: 5-10 hari kerja
│   └── Pickup: 1-3 hari kerja (siap ambil)
│
├── Jawa (Non-Jabodetabek):
│   ├── JNE REG: 2-4 hari kerja
│   ├── JNE YES: 1-2 hari kerja
│   └── SiCepat: 2-3 hari kerja
│
├── Sumatera:
│   ├── JNE REG: 4-7 hari kerja
│   └── Cargo/Freight: 7-14 hari kerja
│
└── Indonesia Timur:
    ├── JNE REG: 7-14 hari kerja
    └── Cargo: 14-30 hari kerja
```

### 8.2 Display Estimated Delivery

```php
// functions.php - Show delivery estimate on product page
add_action('woocommerce_single_product_summary', 'furnicraft_delivery_estimate', 25);
function furnicraft_delivery_estimate() {
    ?>
    <div class="delivery-estimate">
        <span class="icon">🚚</span>
        <span class="text">
            Estimasi pengiriman: <strong>3-7 hari kerja</strong> (Jabodetabek)
        </span>
    </div>
    <?php
}
```

---

## 9. Shipping Configuration Checklist

- [ ] Setup shipping zones (Jabodetabek, Jawa, Luar Jawa, Indo Timur)
- [ ] Configure flat rate untuk Jabodetabek
- [ ] Integrate RajaOngkir API
- [ ] Setup weight-based rates untuk luar Jabodetabek
- [ ] Configure free shipping threshold (Rp 10 juta)
- [ ] Setup local pickup locations
- [ ] Create shipping classes untuk kategori furniture
- [ ] Add delivery estimate display
- [ ] Test checkout dengan berbagai alamat
- [ ] Verify correct rates calculation

---

**Dokumen Berikutnya:** [07-checkout-optimization.md](./07-checkout-optimization.md) - Checkout & Cart Optimization
