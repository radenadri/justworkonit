# DOCS KNOWLEDGE BASE

## OVERVIEW

Four independent documentation collections covering ERP, e-commerce, headless CMS, and algorithm practice.

## STRUCTURE

| Directory | Project | Files | Coverage |
|-----------|---------|-------|----------|
| `furnicraft-odoo/` | PT. Furnicraft Indonesia — Odoo 16 CE ERP | 15 (00–14) | Full implementation guide |
| `furnicraft-woo/` | Furnicraft E-Commerce — WordPress + WooCommerce | 11 (00–10) | Full implementation guide |
| `focus-wp/` | Focus Reading Platform — Headless WordPress CMS | 8 (00–07) | Full setup guide |
| `blind75/` | Blind 75 — LeetCode Algorithm Problems | 5 (01–05) | Array/Hashing category |

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Odoo module development patterns | `furnicraft-odoo/03-module-structure.md` |
| Odoo security (ACL, record rules) | `furnicraft-odoo/12-security-access.md` |
| WooCommerce payment gateway (Midtrans) | `furnicraft-woo/05-midtrans-integration.md` |
| WooCommerce + Odoo sync | `furnicraft-woo/10-odoo-integration.md` |
| Headless WP REST API + JWT auth | `focus-wp/04-rest-api-jwt-auth.md` |
| Custom WP REST endpoints | `focus-wp/05-custom-endpoints.md` |
| ACF field group definitions | `focus-wp/03-acf-field-groups.md` |
| Server setup (Ubuntu, Nginx, PHP, MySQL) | Any `01-server-setup.md` |
| Algorithm solutions (arrays/hashing) | `blind75/` |

## CONVENTIONS

- **Numbering**: Zero-padded sequential (`00-overview.md` → `NN-topic.md`)
- **First file**: Always `00-overview.md` — project summary, architecture, prerequisites
- **Server setup**: Always `01-server-setup.md` — infrastructure, dependencies
- **Self-contained**: Each collection is independent — no cross-references between projects
- **Format**: Implementation guides with code blocks, config snippets, CLI commands

## NOTES

- All docs are **implementation guides**, not API references — they walk through setup step-by-step
- `furnicraft-odoo/` uses community alternatives for Enterprise features: `om_account_accountant` (Odoo Mates), OCA modules
- `furnicraft-woo/` tech stack: WordPress 6.9.1, WooCommerce 10.5.0, Midtrans payment gateway, IDR currency
- `focus-wp/` is headless WordPress (no frontend theme) — designed for REST API consumption with JWT auth
- `blind75/` only covers Array/Hashing category so far (5 of 75 problems)
