# 04. Product Management

> Panduan pengelolaan produk furniture di WooCommerce untuk Furnicraft

---

## Product Categories

### Category Structure

```
Product Categories:
├── Living Room
│   ├── Sofa
│   ├── Coffee Table
│   ├── TV Cabinet
│   └── Bookshelf
│
├── Bedroom
│   ├── Bed Frame
│   ├── Wardrobe
│   ├── Nightstand
│   └── Dresser
│
├── Dining Room
│   ├── Dining Table
│   ├── Dining Chair
│   └── Sideboard
│
├── Office
│   ├── Desk
│   ├── Office Chair
│   ├── Filing Cabinet
│   └── Meeting Table
│
└── Outdoor
    ├── Garden Set
    └── Outdoor Chair
```

### Create Categories via WP-CLI

```bash
# Parent categories
wp wc product_cat create --name="Living Room" --slug="living-room" --user=1 --allow-root
wp wc product_cat create --name="Bedroom" --slug="bedroom" --user=1 --allow-root
wp wc product_cat create --name="Dining Room" --slug="dining-room" --user=1 --allow-root
wp wc product_cat create --name="Office" --slug="office" --user=1 --allow-root
wp wc product_cat create --name="Outdoor" --slug="outdoor" --user=1 --allow-root

# Sub-categories (Living Room)
wp wc product_cat create --name="Sofa" --slug="sofa" --parent=<living-room-id> --user=1 --allow-root
wp wc product_cat create --name="Coffee Table" --slug="coffee-table" --parent=<living-room-id> --user=1 --allow-root
wp wc product_cat create --name="TV Cabinet" --slug="tv-cabinet" --parent=<living-room-id> --user=1 --allow-root
wp wc product_cat create --name="Bookshelf" --slug="bookshelf" --parent=<living-room-id> --user=1 --allow-root
```

### Category Configuration

**Products → Categories → Edit**

```
Category: Living Room
├── Name: Living Room
├── Slug: living-room
├── Parent category: None
├── Description: Koleksi furniture untuk ruang tamu dan keluarga
├── Display type: Default
├── Thumbnail: Upload category image (400×300px)
└── Menu order: 1
```

---

## Product Attributes

### Global Attributes

**Products → Attributes**

| Attribute | Slug | Type | Values |
|-----------|------|------|--------|
| Material | `pa_material` | Select | Kayu Jati, Mahoni, Merbau, Sonokeling, Rotan |
| Color | `pa_color` | Select | Natural, Walnut, Dark Brown, White, Custom |
| Finish | `pa_finish` | Select | Natural Oil, Lacquer, Polyurethane, Melamine |
| Style | `pa_style` | Select | Minimalis, Skandinavia, Industrial, Klasik |
| Seating Capacity | `pa_seating` | Select | 1 Seat, 2 Seat, 3 Seat, 4 Seat, 6 Seat, 8 Seat |
| Fabric | `pa_fabric` | Select | Cotton, Linen, Velvet, Leather, PU Leather |

### Create Attributes via WP-CLI

```bash
# Material attribute
wp wc product_attribute create --name="Material" --slug="pa_material" --type="select" --order_by="menu_order" --user=1 --allow-root

# Add terms to Material
wp wc product_attribute_term create <attribute_id> --name="Kayu Jati" --slug="kayu-jati" --user=1 --allow-root
wp wc product_attribute_term create <attribute_id> --name="Mahoni" --slug="mahoni" --user=1 --allow-root
wp wc product_attribute_term create <attribute_id> --name="Merbau" --slug="merbau" --user=1 --allow-root
```

### Custom Product Fields (ACF)

Install Advanced Custom Fields and create field group:

```
Field Group: Furniture Specifications
├── Location: Product Type = Simple OR Variable
│
├── Field: Dimensions Detail
│   ├── Type: Group
│   ├── Fields:
│   │   ├── Width (cm): Number
│   │   ├── Depth (cm): Number
│   │   ├── Height (cm): Number
│   │   └── Seat Height (cm): Number (conditional)
│
├── Field: Weight Capacity
│   ├── Type: Number
│   ├── Suffix: kg
│   └── Default: 100
│
├── Field: Assembly Required
│   ├── Type: True/False
│   └── Default: Yes
│
├── Field: Warranty
│   ├── Type: Select
│   ├── Choices: 1 Year, 2 Years, 3 Years, 5 Years, Lifetime
│   └── Default: 2 Years
│
├── Field: Care Instructions
│   ├── Type: Textarea
│   └── Placeholder: Petunjuk perawatan produk...
│
└── Field: Assembly Instructions
    ├── Type: File
    └── Allowed Types: PDF
```

---

## Product Types

### Simple Product (Standard Furniture)

For products without variations:

```
Product: Meja Makan Minimalis 6 Kursi
├── Type: Simple product
├── SKU: FC-DT-001
├── Price: Rp 15.000.000
├── Sale Price: Rp 12.750.000 (optional)
│
├── Inventory:
│   ├── Manage stock: Yes
│   ├── Stock quantity: 5
│   ├── Allow backorders: No
│   └── Low stock threshold: 2
│
├── Shipping:
│   ├── Weight: 85 kg
│   ├── Dimensions: 180 × 90 × 75 cm
│   └── Shipping class: Furniture Besar
│
├── Linked Products:
│   ├── Upsells: Meja Makan 8 Kursi
│   └── Cross-sells: Kursi Makan (set of 6)
│
├── Attributes:
│   ├── Material: Kayu Jati
│   ├── Seating: 6 Seat
│   ├── Finish: Natural Oil
│   └── Style: Minimalis
│
├── Images:
│   ├── Featured: meja-makan-6-main.jpg
│   └── Gallery: 4-6 additional images
│
├── Short Description:
│   └── Meja makan untuk 6 orang dengan desain minimalis modern...
│
└── Description:
    └── Full HTML description with features, materials, care...
```

### Variable Product (Multiple Options)

For products with color/size variations:

```
Product: Sofa Minimalis 3-Seater
├── Type: Variable product
├── SKU: FC-SF-001
├── Regular Price: (set per variation)
│
├── Attributes (for variations):
│   ├── Fabric: Cotton, Linen, Velvet (Used for variations: Yes)
│   └── Color: Grey, Navy, Cream (Used for variations: Yes)
│
├── Variations:
│   ├── Variation 1:
│   │   ├── Attributes: Cotton + Grey
│   │   ├── SKU: FC-SF-001-COT-GRY
│   │   ├── Price: Rp 12.500.000
│   │   ├── Stock: 3
│   │   └── Image: sofa-cotton-grey.jpg
│   │
│   ├── Variation 2:
│   │   ├── Attributes: Cotton + Navy
│   │   ├── SKU: FC-SF-001-COT-NVY
│   │   ├── Price: Rp 12.500.000
│   │   ├── Stock: 2
│   │   └── Image: sofa-cotton-navy.jpg
│   │
│   ├── Variation 3:
│   │   ├── Attributes: Velvet + Grey
│   │   ├── SKU: FC-SF-001-VLV-GRY
│   │   ├── Price: Rp 15.000.000
│   │   ├── Stock: 2
│   │   └── Image: sofa-velvet-grey.jpg
│   │
│   └── ... (more variations)
│
└── Default Form Values:
    ├── Fabric: Cotton
    └── Color: Grey
```

### Grouped Product (Furniture Sets)

For bundled products sold together:

```
Product: Set Meja Makan + 6 Kursi
├── Type: Grouped product
├── SKU: FC-SET-DT-001
│
├── Grouped Products:
│   ├── Meja Makan Minimalis 6 Kursi (FC-DT-001)
│   └── Kursi Makan Minimalis × 6 (FC-DC-001)
│
├── Description:
│   └── Set lengkap meja makan untuk 6 orang...
│
└── Note: Each product is sold separately but displayed as set
```

---

## Product Images

### Image Requirements

| Image Type | Size | Aspect Ratio | Format |
|------------|------|--------------|--------|
| Featured Image | 1200 × 1200 px | 1:1 (square) | JPEG/WebP |
| Gallery Images | 1200 × 1200 px | 1:1 | JPEG/WebP |
| Thumbnail | 300 × 300 px | 1:1 | JPEG/WebP |
| Zoom Image | 2000 × 2000 px | 1:1 | JPEG |

### Image Optimization

```bash
# Install image optimization plugin
wp plugin install imagify --activate --allow-root

# Or use WP-CLI for bulk optimization
wp media regenerate --allow-root
```

### Image Naming Convention

```
Naming: [product-slug]-[angle/variant].jpg

Examples:
├── sofa-minimalis-3-seater-front.jpg
├── sofa-minimalis-3-seater-side.jpg
├── sofa-minimalis-3-seater-detail-fabric.jpg
├── sofa-minimalis-3-seater-grey.jpg
├── sofa-minimalis-3-seater-navy.jpg
└── sofa-minimalis-3-seater-lifestyle.jpg
```

---

## Product Description Template

```html
<!-- Product Description Template -->

<h2>Deskripsi Produk</h2>
<p>[Opening paragraph about the product - 2-3 sentences highlighting main benefits]</p>

<h3>Fitur Utama</h3>
<ul>
    <li><strong>Material Premium:</strong> Dibuat dari kayu jati grade A pilihan</li>
    <li><strong>Desain Minimalis:</strong> Cocok untuk interior modern dan kontemporer</li>
    <li><strong>Konstruksi Kokoh:</strong> Menggunakan teknik joinery tradisional</li>
    <li><strong>Finishing Natural:</strong> Menggunakan finishing oil food-safe</li>
</ul>

<h3>Spesifikasi</h3>
<table class="fc-specs-table">
    <tr>
        <th>Dimensi</th>
        <td>200 × 85 × 80 cm (P × L × T)</td>
    </tr>
    <tr>
        <th>Material</th>
        <td>Kayu Jati Solid (Frame), High-density Foam (Cushion)</td>
    </tr>
    <tr>
        <th>Finishing</th>
        <td>Natural Oil Finish</td>
    </tr>
    <tr>
        <th>Kapasitas</th>
        <td>3 orang duduk (max 250 kg)</td>
    </tr>
    <tr>
        <th>Garansi</th>
        <td>2 tahun untuk frame kayu</td>
    </tr>
</table>

<h3>Perawatan</h3>
<ul>
    <li>Bersihkan dengan kain lembab secara berkala</li>
    <li>Hindari paparan sinar matahari langsung</li>
    <li>Gunakan furniture polish khusus kayu setiap 3 bulan</li>
    <li>Jaga kelembaban ruangan antara 40-60%</li>
</ul>

<h3>Pengiriman & Perakitan</h3>
<p>Produk dikirim dalam kondisi semi-assembled. Perakitan sederhana diperlukan (estimasi 30 menit). Panduan perakitan disertakan dalam paket.</p>

<h3>Catatan</h3>
<p>Warna dan tekstur kayu alami dapat sedikit berbeda dari foto karena karakteristik natural kayu jati.</p>
```

---

## Shipping Classes

### Configure Shipping Classes

**WooCommerce → Settings → Shipping → Shipping Classes**

| Class | Slug | Description |
|-------|------|-------------|
| Furniture Kecil | `furniture-kecil` | < 20 kg (kursi, nightstand) |
| Furniture Sedang | `furniture-sedang` | 20-50 kg (meja kecil, lemari kecil) |
| Furniture Besar | `furniture-besar` | 50-100 kg (meja makan, sofa) |
| Furniture Sangat Besar | `furniture-xl` | > 100 kg (tempat tidur, lemari besar) |

### Assign to Products

```
Product → Shipping → Shipping class
├── Nightstand → Furniture Kecil
├── Coffee Table → Furniture Sedang
├── 3-Seater Sofa → Furniture Besar
└── King Size Bed → Furniture Sangat Besar
```

---

## Stock Management

### Inventory Settings

**WooCommerce → Settings → Products → Inventory**

```
Stock Management:
├── Enable stock management: Yes
├── Hold stock (minutes): 60
├── Notifications:
│   ├── Low stock threshold: 3
│   ├── Out of stock threshold: 0
│   └── Recipient: inventory@furnicraft.co.id
├── Out of stock visibility: Hide out of stock items
└── Stock display format: Only show in stock text
```

### Bulk Stock Update

```bash
# Update stock via WP-CLI
wp wc product update <product_id> --stock_quantity=10 --user=1 --allow-root

# Bulk import via CSV
# columns: sku, stock_quantity
```

---

## Product Import/Export

### Export Products

**Products → Export**

```
Export Fields:
├── ID
├── SKU
├── Name
├── Description
├── Short description
├── Categories
├── Tags
├── Images
├── Regular price
├── Sale price
├── Stock
├── Weight
├── Dimensions
├── Attributes
└── Meta data
```

### Import Products

**Products → Import**

CSV format example:

```csv
SKU,Name,Regular price,Categories,Images,Stock,Weight,Length,Width,Height,Attribute 1 name,Attribute 1 value(s)
FC-SF-001,Sofa Minimalis 3-Seater,12500000,Living Room > Sofa,"https://example.com/sofa1.jpg,https://example.com/sofa2.jpg",5,45,200,85,80,Material,Kayu Jati
```

---

## Product Reviews

### Review Settings

**WooCommerce → Settings → Products → Reviews**

```
Reviews:
├── Enable reviews: Yes
├── Show "verified owner" label: Yes
├── Reviews can only be left by verified owners: Yes
├── Enable star rating: Yes
└── Star ratings required: Yes
```

### Moderate Reviews

```bash
# List pending reviews
wp comment list --status=hold --type=review --allow-root

# Approve review
wp comment approve <comment_id> --allow-root
```

---

## SEO for Products

### Product SEO Settings (Yoast)

```
Yoast SEO → Product:
├── SEO Title: %title% | Furnicraft Indonesia
├── Meta Description: %excerpt% - Beli %title% dengan harga terbaik...
├── Schema:
│   ├── Product type: Product
│   ├── Brand: Furnicraft
│   └── Manufacturer: PT. Furnicraft Indonesia
│
└── Social:
    ├── Facebook image: Product featured image
    └── Twitter image: Product featured image
```

### Structured Data (JSON-LD)

Products automatically get Product schema. Verify with Google Rich Results Test.

```json
{
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Sofa Minimalis 3-Seater",
    "image": "https://www.furnicraft.co.id/product-image.jpg",
    "description": "Sofa minimalis modern...",
    "sku": "FC-SF-001",
    "brand": {
        "@type": "Brand",
        "name": "Furnicraft"
    },
    "offers": {
        "@type": "Offer",
        "price": "12500000",
        "priceCurrency": "IDR",
        "availability": "https://schema.org/InStock"
    }
}
```

---

## Checklist

- [ ] Product categories created with hierarchy
- [ ] Global attributes configured (Material, Color, etc.)
- [ ] Custom fields added via ACF (dimensions, warranty)
- [ ] Simple products created with full details
- [ ] Variable products created with variations
- [ ] Product images uploaded and optimized
- [ ] Shipping classes assigned to products
- [ ] Stock management configured
- [ ] Product descriptions follow template
- [ ] SEO settings configured for products
- [ ] Reviews enabled with moderation
- [ ] Import/export tested
- [ ] Sample products visible on frontend

---

**Next Document:** [05-midtrans-integration.md](./05-midtrans-integration.md) - Payment Gateway with Midtrans
