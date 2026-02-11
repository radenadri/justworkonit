# 04 - Inventory Management

## Overview

Modul Inventory adalah jantung operasional PT. Furnicraft Indonesia. Mengatur aliran barang dari penerimaan bahan baku hingga pengiriman produk jadi.

```mermaid
graph LR
    subgraph Inbound
        A[Vendor] --> B[Goods Receipt]
        B --> C[Quality Check]
        C --> D[Raw Material Stock]
    end
    
    subgraph Internal
        D --> E[Production]
        E --> F[WIP Stock]
        F --> G[Finished Goods Stock]
    end
    
    subgraph Outbound
        G --> H[Pick]
        H --> I[Pack]
        I --> J[Ship]
        J --> K[Customer]
    end
```

---

## Step 1: Warehouse Configuration

### 1.1 Struktur Warehouse PT. Furnicraft

Navigasi: `Inventory → Configuration → Warehouses`

```mermaid
graph TB
    subgraph "PT. Furnicraft Warehouses"
        WH[Main Warehouse - Jepara]
        JKT[Jakarta Warehouse]
    end
    
    subgraph "Jepara Warehouse Locations"
        WH --> RAW[Raw Materials]
        WH --> WIP[Work in Progress]
        WH --> FG[Finished Goods]
        WH --> QC[Quality Control]
        WH --> PACK[Packing Area]
        WH --> SHIP[Shipping Dock]
        
        RAW --> WOOD[Wood Storage]
        RAW --> FAB[Fabric Storage]
        RAW --> HW[Hardware Storage]
        RAW --> FIN[Finishing Materials]
        
        FG --> FG_A[Zone A - Living Room]
        FG --> FG_B[Zone B - Bedroom]
        FG --> FG_C[Zone C - Dining]
        FG --> FG_D[Zone D - Office/Outdoor]
    end
    
    subgraph "Jakarta Warehouse Locations"
        JKT --> JKT_FG[Finished Goods]
        JKT --> JKT_SHP[Shipping]
    end
```

### 1.2 Konfigurasi Main Warehouse

| Field | Value |
|-------|-------|
| **Warehouse Name** | Main Warehouse - Jepara |
| **Short Name** | JPR |
| **Company** | PT. Furnicraft Indonesia |
| **Address** | Jl. Raya Jepara - Kudus Km. 12, Jepara |

**Routes Configuration:**

| Route | Enabled | Description |
|-------|---------|-------------|
| Receipts | ✅ 3 Steps | Receive → QC → Stock |
| Deliveries | ✅ 3 Steps | Pick → Pack → Ship |
| Internal Transfers | ✅ Yes | Between locations |
| Resupply from | - | - |

### 1.3 Membuat Locations

Navigasi: `Inventory → Configuration → Locations`

| Location | Parent | Location Type | Usage |
|----------|--------|---------------|-------|
| **JPR/Stock** | JPR | Internal | Default stock |
| JPR/Stock/Raw Materials | JPR/Stock | Internal | Bahan baku |
| JPR/Stock/Raw Materials/Wood | JPR/Stock/RM | Internal | Kayu |
| JPR/Stock/Raw Materials/Fabric | JPR/Stock/RM | Internal | Kain |
| JPR/Stock/Raw Materials/Hardware | JPR/Stock/RM | Internal | Hardware |
| JPR/Stock/Raw Materials/Finishing | JPR/Stock/RM | Internal | Cat, Amplas |
| JPR/Stock/WIP | JPR/Stock | Internal | Work in Progress |
| JPR/Stock/Finished Goods | JPR/Stock | Internal | Produk jadi |
| JPR/Stock/FG/Zone A | JPR/Stock/FG | Internal | Living Room |
| JPR/Stock/FG/Zone B | JPR/Stock/FG | Internal | Bedroom |
| JPR/Stock/FG/Zone C | JPR/Stock/FG | Internal | Dining |
| JPR/Stock/FG/Zone D | JPR/Stock/FG | Internal | Office/Outdoor |
| **JPR/Input** | JPR | Internal | Receiving Area |
| **JPR/Quality Control** | JPR | Internal | QC Inspection |
| **JPR/Packing** | JPR | Internal | Packing Area |
| **JPR/Output** | JPR | Internal | Shipping Dock |

### 1.4 Alur 3-Step Receipts

```mermaid
sequenceDiagram
    participant V as Vendor
    participant IN as Input Location
    participant QC as Quality Control
    participant STK as Stock Location
    
    V->>IN: Goods Arrival
    Note over IN: Receiving (GRN Created)
    IN->>QC: Transfer to QC
    Note over QC: Quality Inspection
    alt QC Pass
        QC->>STK: Transfer to Stock
        Note over STK: Available for use
    else QC Fail
        QC->>V: Return to Vendor
    end
```

### 1.5 Alur 3-Step Delivery

```mermaid
sequenceDiagram
    participant STK as Stock Location
    participant PICK as Picking
    participant PACK as Packing
    participant OUT as Output/Dock
    participant C as Customer
    
    Note over STK: Sales Order Confirmed
    STK->>PICK: Create Picking Order
    Note over PICK: Pick products from shelves
    PICK->>PACK: Transfer to Packing
    Note over PACK: Pack products
    PACK->>OUT: Transfer to Shipping
    Note over OUT: Ready for delivery
    OUT->>C: Deliver to Customer
```

---

## Step 2: Operation Types

Navigasi: `Inventory → Configuration → Operation Types`

### 2.1 Operation Types untuk 3-Step Receipt

| Operation Type | Code | Reservation | Source | Destination |
|----------------|------|-------------|--------|-------------|
| Receipts | JPR/IN | At Confirmation | Vendors | JPR/Input |
| Quality Control | JPR/QC | At Confirmation | JPR/Input | JPR/Quality |
| Store | JPR/STR | At Confirmation | JPR/Quality | JPR/Stock |

### 2.2 Operation Types untuk 3-Step Delivery

| Operation Type | Code | Reservation | Source | Destination |
|----------------|------|-------------|--------|-------------|
| Pick | JPR/PICK | Manually | JPR/Stock | JPR/Packing |
| Pack | JPR/PACK | At Confirmation | JPR/Packing | JPR/Output |
| Delivery Orders | JPR/OUT | At Confirmation | JPR/Output | Customers |

### 2.3 Internal Operations

| Operation Type | Code | Usage |
|----------------|------|-------|
| Internal Transfers | JPR/INT | Transfer antar lokasi |
| Manufacturing | JPR/MO | Konsumsi & produksi |
| Returns | JPR/RET | Customer returns |
| Scrap | JPR/SCRAP | Barang rusak |

---

## Step 3: Routes & Rules

### 3.1 Standard Routes

```mermaid
graph TB
    subgraph "Product Routes"
        BUY[Buy]
        MTO[Make to Order]
        MTS[Make to Stock]
        MFG[Manufacture]
    end
    
    BUY --> |"Trigger: Orderpoint"| PO[Purchase Order]
    MTO --> |"Trigger: SO"| PROC[Procurement]
    MTS --> |"Trigger: Reorder Rule"| REP[Replenishment]
    MFG --> |"Trigger: MO"| PROD[Production]
```

### 3.2 Routes Configuration

| Route | Description | Products |
|-------|-------------|----------|
| **Buy** | Purchase from vendor | Raw Materials, Components |
| **Manufacture** | Produce in-house | Finished Goods |
| **Make to Order (MTO)** | Produce on demand | Custom orders |
| **Resupply from JPR to JKT** | Inter-warehouse transfer | Finished Goods |

### 3.3 Push & Pull Rules

**Pull Rule untuk Raw Materials:**

```python
# Ketika stock menipis, trigger Purchase
{
    'name': 'Buy',
    'action': 'buy',
    'picking_type_id': stock.picking_type_in.id,
    'location_src_id': supplier_location.id,
    'location_id': stock_location.id,
}
```

**Push Rule untuk Finished Goods (ke Jakarta):**

```python
# Setelah produksi, auto-transfer ke Jakarta
{
    'name': 'Push to Jakarta',
    'action': 'push',
    'picking_type_id': internal_transfer.id,
    'location_src_id': jepara_fg.id,
    'location_id': jakarta_fg.id,
    'auto': 'manual',  # atau 'transparent'
}
```

---

## Step 4: Reordering Rules (Orderpoints)

### 4.1 Konsep Reordering

```mermaid
graph LR
    subgraph "Stock Levels"
        MIN[Minimum Stock]
        MAX[Maximum Stock]
        CUR[Current Stock]
    end
    
    CUR -->|"Below MIN"| TRIGGER[Trigger Replenishment]
    TRIGGER -->|"Order Qty"| ORDER[Min to Max]
```

### 4.2 Reordering Rules untuk Raw Materials

Navigasi: `Inventory → Configuration → Reordering Rules`

| Product | Location | Min Qty | Max Qty | To Order | Route |
|---------|----------|---------|---------|----------|-------|
| Kayu Jati Grade A | JPR/Stock/RM/Wood | 5 m³ | 20 m³ | Multiple of 1 | Buy |
| Kayu Jati Grade B | JPR/Stock/RM/Wood | 3 m³ | 15 m³ | Multiple of 1 | Buy |
| MDF 18mm | JPR/Stock/RM/Wood | 50 lembar | 200 lembar | Multiple of 10 | Buy |
| Velvet Premium Grey | JPR/Stock/RM/Fabric | 100 m | 500 m | Multiple of 50 | Buy |
| Foam Density 32 | JPR/Stock/RM/Fabric | 200 m² | 800 m² | Multiple of 100 | Buy |
| Engsel Pintu Kuningan | JPR/Stock/RM/HW | 500 pcs | 2000 pcs | Multiple of 100 | Buy |
| NC Lacquer Clear | JPR/Stock/RM/Fin | 50 liter | 200 liter | Multiple of 20 | Buy |

### 4.3 Scheduler Configuration

```
Settings → Inventory → Run Scheduler Automatically
✅ Run scheduler every: 1 Day
```

### 4.4 Manual Scheduler Run

Navigasi: `Inventory → Operations → Run Scheduler`

---

## Step 5: Inventory Operations

### 5.1 Goods Receipt (Penerimaan Barang)

```mermaid
sequenceDiagram
    participant PO as Purchase Order
    participant IN as Receiving
    participant WH as Warehouse Staff
    participant QC as Quality Control
    participant STK as Stock
    
    PO->>IN: PO Status = To Receive
    IN->>WH: Create Receipt (GRN)
    WH->>WH: Verify: Qty, Condition
    WH->>IN: Validate Receipt
    IN->>QC: Auto-create QC Transfer
    QC->>QC: Inspect Materials
    alt Passed
        QC->>STK: Move to Stock
    else Failed
        QC->>IN: Return to Vendor
    end
```

**Langkah-langkah:**

1. **Buka Receipt:** `Inventory → Operations → Receipts`
2. **Verify items:** Cek quantity dan kondisi
3. **Edit jika perlu:** Qty received berbeda dari ordered
4. **Validate:** Confirm receipt
5. **QC Transfer:** Auto-created, inspect materials
6. **Store:** Move to final location

### 5.2 Delivery Order (Pengiriman)

```mermaid
sequenceDiagram
    participant SO as Sales Order
    participant WH as Warehouse
    participant PICK as Picker
    participant PACK as Packer
    participant DRV as Driver
    
    SO->>WH: SO Confirmed
    WH->>PICK: Create Pick List
    PICK->>PICK: Pick items from shelves
    PICK->>PACK: Transfer to Packing
    PACK->>PACK: Pack & Label
    PACK->>DRV: Transfer to Dock
    DRV->>SO: Deliver to Customer
    DRV->>WH: Update: Delivered
```

**Langkah-langkah:**

1. **Check Pickings:** `Inventory → Operations → Delivery Orders`
2. **Pick products:** Scan/select products from locations
3. **Validate pick:** Move to packing area
4. **Pack products:** Add packaging, labels
5. **Validate pack:** Move to output dock
6. **Deliver:** Mark as delivered

### 5.3 Internal Transfer

**Use Cases:**
- Move between zones (Zone A → Zone B)
- Move to QC for inspection
- Replenish from warehouse to production

**Langkah-langkah:**

1. Navigasi: `Inventory → Operations → Internal Transfers`
2. Create new transfer
3. Select source & destination locations
4. Add products & quantities
5. Validate

### 5.4 Inventory Adjustment

```mermaid
graph TB
    subgraph "Inventory Count"
        PLAN[Plan Count]
        COUNT[Physical Count]
        DIFF[Identify Difference]
        ADJ[Apply Adjustment]
    end
    
    PLAN --> COUNT
    COUNT --> DIFF
    DIFF -->|"Difference exists"| ADJ
    ADJ --> |"System = Physical"| DONE[Completed]
```

**Langkah-langkah:**

1. Navigasi: `Inventory → Operations → Inventory Adjustments`
2. Create adjustment for location/category
3. Start inventory
4. Input actual quantities
5. Apply adjustments

---

## Step 6: Lot & Serial Number Tracking

### 6.1 Traceability Configuration

| Product Type | Tracking | Why |
|--------------|----------|-----|
| Raw Materials - Wood | By Lot | Track supplier, quality per batch |
| Raw Materials - Fabric | By Lot | Track dye lot, supplier |
| Finished Goods | By Serial | Track individual unit for warranty |
| Components | No Tracking | High volume, low value |

### 6.2 Enable Lot/Serial Tracking

1. Product form → Inventory tab
2. **Tracking:** 
   - No Tracking
   - By Unique Serial Number
   - By Lots

### 6.3 Lot Number Format

| Product Type | Format | Example |
|--------------|--------|---------|
| Wood | WOOD-YYYYMM-XXX | WOOD-202401-001 |
| Fabric | FAB-YYYYMM-XXX | FAB-202401-015 |
| Finished Goods | SN-PRODUCT-XXXXXX | SN-FGSF001-000123 |

---

## Step 7: Barcode Operations

### 7.1 Barcode Configuration

Navigasi: `Inventory → Configuration → Settings`

```
✅ Barcodes
```

### 7.2 Barcode Types

| Usage | Barcode Type | Length |
|-------|--------------|--------|
| Products | EAN-13 | 13 digits |
| Locations | Internal | Custom |
| Lot/Serial | Internal | Custom |
| Packages | Internal | Custom |

### 7.3 Scanning Workflow

```mermaid
sequenceDiagram
    participant S as Scanner
    participant O as Odoo
    participant L as Location
    
    S->>O: Scan Source Location
    O-->>S: Confirm Location
    S->>O: Scan Product Barcode
    O-->>S: Show Product & Qty
    S->>O: Scan Destination Location
    O-->>S: Confirm Transfer
    S->>O: Validate
    O-->>S: Transfer Complete
```

### 7.4 Mobile Barcode App

Install module: `stock_barcode`

**Features:**
- Scan to receive
- Scan to pick
- Scan for inventory count
- Scan for transfers

---

## Step 8: Reporting & Analytics

### 8.1 Stock Reports

| Report | Navigation | Purpose |
|--------|------------|---------|
| Stock Valuation | Inventory → Reporting → Valuation | Total inventory value |
| Stock Moves | Inventory → Reporting → Moves History | All stock movements |
| Stock Forecast | Inventory → Reporting → Forecast | Expected stock levels |
| Inventory Report | Inventory → Reporting → Inventory | Current on-hand |

### 8.2 Stock Valuation Report

```mermaid
pie title Stock Valuation by Category
    "Raw Materials" : 450000000
    "Work in Progress" : 120000000
    "Finished Goods" : 850000000
    "Components" : 80000000
```

### 8.3 Key Metrics Dashboard

| KPI | Formula | Target |
|-----|---------|--------|
| Stock Accuracy | (Correct Items / Total Items) × 100 | > 98% |
| Inventory Turnover | COGS / Average Inventory | > 6x/year |
| Days of Inventory | 365 / Inventory Turnover | < 60 days |
| Fill Rate | Orders Fulfilled Complete / Total Orders | > 95% |
| Stockout Rate | Stockout Events / Total SKUs | < 2% |

---

## Step 9: Integration dengan Modul Lain

### 9.1 Purchase Integration

```mermaid
graph LR
    PO[Purchase Order<br/>Confirmed] --> GRN[Goods Receipt<br/>Created]
    GRN --> STK[Stock Updated]
    STK --> BILL[Vendor Bill<br/>Created]
```

### 9.2 Sales Integration

```mermaid
graph LR
    SO[Sales Order<br/>Confirmed] --> DO[Delivery Order<br/>Created]
    DO --> PICK[Pick & Pack]
    PICK --> SHIP[Shipped]
    SHIP --> INV[Invoice Created]
```

### 9.3 Manufacturing Integration

```mermaid
graph LR
    MO[Manufacturing Order] --> CONS[Consume RM]
    CONS --> PROD[Produce FG]
    PROD --> STK[Stock FG Updated]
```

---

## Checklist Inventory Setup

### Warehouse Configuration
- [ ] Main warehouse created dengan lokasi lengkap
- [ ] 3-step receipt configured
- [ ] 3-step delivery configured
- [ ] Operation types sesuai kebutuhan

### Products
- [ ] Routes assigned ke setiap product
- [ ] Lot/Serial tracking enabled untuk product yang perlu
- [ ] Barcodes assigned

### Automation
- [ ] Reordering rules untuk raw materials
- [ ] Scheduler dikonfigurasi
- [ ] Push/Pull rules sesuai alur

### Operations
- [ ] Receiving SOP documented
- [ ] Delivery SOP documented
- [ ] Inventory count schedule defined

---

## Troubleshooting

### Transfer tidak bisa di-validate

1. Check stock availability di source location
2. Check product tracking (lot/serial required?)
3. Check user access rights

### Reordering rule tidak trigger

1. Check min/max quantities
2. Check product routes
3. Run scheduler manual: `Inventory → Run Scheduler`

### Stock mismatch

1. Lakukan inventory adjustment
2. Check pending transfers
3. Review stock moves history

---

*Sebelumnya: [03-master-data.md](03-master-data.md)*

*Lanjut ke: [05-purchase.md](05-purchase.md)*
