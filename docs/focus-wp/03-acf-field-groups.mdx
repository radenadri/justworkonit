# 03. ACF Field Groups Setup

> Konfigurasi Advanced Custom Fields (Free) untuk artikel, author, dan kategori

---

## 📋 Daftar Isi

1. [ACF Free Overview](#1-acf-free-overview)
2. [Register Custom Post Type: Author](#2-register-custom-post-type-author)
3. [Field Group 1: Article Fields](#3-field-group-1-article-fields)
4. [Field Group 2: Author Fields](#4-field-group-2-author-fields)
5. [Field Group 3: Category Fields](#5-field-group-3-category-fields)
6. [ACF to REST API Integration](#6-acf-to-rest-api-integration)
7. [Auto-Calculate Reading Time](#7-auto-calculate-reading-time)
8. [Setup Default Categories](#8-setup-default-categories)

---

## 1️⃣ ACF Free Overview

### Versi yang Digunakan

| Item | Detail |
|------|--------|
| Plugin | Advanced Custom Fields (Free) |
| Minimum Version | 6.1+ |
| Source | WordPress Plugin Directory |
| License | GPL v2 |
| Cost | Gratis |

### Field Types yang Digunakan (Semua Free)

| Field Type | Kegunaan di Focus |
|-----------|-------------------|
| Text | Role/Title author, SEO meta title |
| Textarea | Bio author, SEO meta description |
| Number | Reading time (menit) |
| True/False | Featured article flag |
| URL | Social links (Twitter, LinkedIn, Website) |
| Image | Author avatar, category icon |
| Color Picker | Category badge color |

### Field Types yang TIDAK Digunakan (Pro Only)

| Field Type | Status | Alternatif di Focus |
|-----------|--------|---------------------|
| Repeater | ❌ Pro Only | Individual URL fields untuk social links |
| Flexible Content | ❌ Pro Only | Tidak diperlukan |
| Gallery | ❌ Pro Only | Tidak diperlukan |
| Clone | ❌ Pro Only | Tidak diperlukan |
| Options Page | ❌ Pro Only | Menggunakan wp_options |

---

## 2️⃣ Register Custom Post Type: Author

Focus menggunakan Custom Post Type "Author" untuk profil penulis yang lebih lengkap dari default WordPress user profile.

### Buat Must-Use Plugin

**File: `wp-content/mu-plugins/focus-post-types.php`**

```php
<?php
/**
 * Plugin Name: Focus Custom Post Types
 * Description: Register custom post types untuk Focus platform
 * Version: 1.0
 */

/**
 * Register Author CPT
 * Digunakan untuk profil penulis dengan custom fields
 */
function focus_register_post_types() {
    // Author CPT
    register_post_type('author', [
        'labels' => [
            'name'               => 'Authors',
            'singular_name'      => 'Author',
            'add_new'            => 'Add New Author',
            'add_new_item'       => 'Add New Author',
            'edit_item'          => 'Edit Author',
            'new_item'           => 'New Author',
            'view_item'          => 'View Author',
            'search_items'       => 'Search Authors',
            'not_found'          => 'No authors found',
            'not_found_in_trash' => 'No authors found in trash',
            'menu_name'          => 'Authors',
        ],
        'public'             => true,
        'publicly_queryable' => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'show_in_rest'       => true,    // CRITICAL: Enable REST API
        'rest_base'          => 'authors',
        'supports'           => ['title', 'editor', 'thumbnail', 'excerpt'],
        'menu_icon'          => 'dashicons-admin-users',
        'menu_position'      => 5,
        'has_archive'        => true,
        'rewrite'            => ['slug' => 'author'],
        'capability_type'    => 'post',
    ]);
}
add_action('init', 'focus_register_post_types');

/**
 * Flush rewrite rules saat plugin pertama kali dimuat
 */
function focus_flush_rewrite() {
    focus_register_post_types();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'focus_flush_rewrite');
```

### Verifikasi CPT via REST API

```bash
# List authors
curl https://api.focus.com/wp-json/wp/v2/authors

# Harus return JSON array (kosong jika belum ada data)
# []
```

---

## 3️⃣ Field Group 1: Article Fields

### Spesifikasi

| Field Name | Field Type | Key | Required | Notes |
|------------|-----------|-----|----------|-------|
| Reading Time | Number | `reading_time` | No | Auto-calculated, satuan menit |
| Featured Article | True/False | `featured_article` | No | Default: false, untuk Staff Picks |
| SEO Meta Title | Text | `seo_meta_title` | No | Max 60 karakter |
| SEO Meta Description | Textarea | `seo_meta_description` | No | Max 160 karakter |

### PHP Registration

**File: `wp-content/mu-plugins/focus-acf-fields.php`**

```php
<?php
/**
 * Plugin Name: Focus ACF Field Groups
 * Description: Register ACF field groups untuk Focus platform
 * Version: 1.0
 */

// Pastikan ACF sudah loaded
add_action('acf/init', 'focus_register_acf_field_groups');

function focus_register_acf_field_groups() {

    // ================================================
    // FIELD GROUP 1: Article Fields (assigned to Posts)
    // ================================================
    acf_add_local_field_group([
        'key'      => 'group_focus_article',
        'title'    => 'Article Fields',
        'fields'   => [
            [
                'key'           => 'field_reading_time',
                'label'         => 'Reading Time',
                'name'          => 'reading_time',
                'type'          => 'number',
                'instructions'  => 'Estimated reading time in minutes (auto-calculated on save)',
                'required'      => 0,
                'default_value' => 1,
                'min'           => 1,
                'max'           => 120,
                'step'          => 1,
                'prepend'       => '',
                'append'        => 'minutes',
            ],
            [
                'key'           => 'field_featured_article',
                'label'         => 'Featured Article',
                'name'          => 'featured_article',
                'type'          => 'true_false',
                'instructions'  => 'Mark as Staff Pick / Featured article on homepage',
                'required'      => 0,
                'default_value' => 0,
                'ui'            => 1,
                'ui_on_text'    => 'Featured',
                'ui_off_text'   => 'Normal',
            ],
            [
                'key'           => 'field_seo_meta_title',
                'label'         => 'SEO Meta Title',
                'name'          => 'seo_meta_title',
                'type'          => 'text',
                'instructions'  => 'Custom meta title for SEO (max 60 characters). Leave empty to use post title.',
                'required'      => 0,
                'maxlength'     => 60,
                'placeholder'   => 'Custom SEO title...',
            ],
            [
                'key'           => 'field_seo_meta_description',
                'label'         => 'SEO Meta Description',
                'name'          => 'seo_meta_description',
                'type'          => 'textarea',
                'instructions'  => 'Meta description for search engines (max 160 characters). Leave empty to use excerpt.',
                'required'      => 0,
                'maxlength'     => 160,
                'rows'          => 3,
                'placeholder'   => 'Brief description for search results...',
            ],
        ],
        'location' => [
            [
                [
                    'param'    => 'post_type',
                    'operator' => '==',
                    'value'    => 'post',
                ],
            ],
        ],
        'position'              => 'normal',
        'style'                 => 'default',
        'label_placement'       => 'top',
        'instruction_placement' => 'label',
        'active'                => true,
        'show_in_rest'          => 1,
    ]);

    // ================================================
    // FIELD GROUP 2: Author Fields (assigned to Author CPT)
    // ================================================
    // ... (lihat section 4)

    // ================================================
    // FIELD GROUP 3: Category Fields (assigned to Category taxonomy)
    // ================================================
    // ... (lihat section 5)
}
```

---

## 4️⃣ Field Group 2: Author Fields

### Spesifikasi

| Field Name | Field Type | Key | Required | Notes |
|------------|-----------|-----|----------|-------|
| Role/Title | Text | `author_role` | Yes | e.g., "Senior Writer", "Editor" |
| Bio | Textarea | `author_bio` | No | Biografi singkat penulis |
| Twitter URL | URL | `twitter_url` | No | URL profil Twitter/X |
| LinkedIn URL | URL | `linkedin_url` | No | URL profil LinkedIn |
| Website URL | URL | `website_url` | No | URL website personal |
| Avatar | Image | `author_avatar` | No | Return format: URL |

> **Catatan**: Social links menggunakan individual URL fields (bukan Repeater yang memerlukan ACF Pro). Ini cukup karena platform sosial yang umum terbatas (Twitter, LinkedIn, Website).

### PHP Registration

Tambahkan ke fungsi `focus_register_acf_field_groups()` di file yang sama:

```php
    // ================================================
    // FIELD GROUP 2: Author Fields (assigned to Author CPT)
    // ================================================
    acf_add_local_field_group([
        'key'      => 'group_focus_author',
        'title'    => 'Author Profile',
        'fields'   => [
            [
                'key'          => 'field_author_role',
                'label'        => 'Role / Title',
                'name'         => 'author_role',
                'type'         => 'text',
                'instructions' => 'Author role or title (e.g., "Senior Writer", "Tech Editor")',
                'required'     => 1,
                'placeholder'  => 'Senior Writer',
            ],
            [
                'key'          => 'field_author_bio',
                'label'        => 'Bio',
                'name'         => 'author_bio',
                'type'         => 'textarea',
                'instructions' => 'Short biography (displayed on author page and article footer)',
                'required'     => 0,
                'rows'         => 4,
                'maxlength'    => 500,
                'placeholder'  => 'Tell readers about yourself...',
            ],
            [
                'key'          => 'field_twitter_url',
                'label'        => 'Twitter / X URL',
                'name'         => 'twitter_url',
                'type'         => 'url',
                'instructions' => 'Full Twitter/X profile URL',
                'required'     => 0,
                'placeholder'  => 'https://twitter.com/username',
            ],
            [
                'key'          => 'field_linkedin_url',
                'label'        => 'LinkedIn URL',
                'name'         => 'linkedin_url',
                'type'         => 'url',
                'instructions' => 'Full LinkedIn profile URL',
                'required'     => 0,
                'placeholder'  => 'https://linkedin.com/in/username',
            ],
            [
                'key'          => 'field_website_url',
                'label'        => 'Website URL',
                'name'         => 'website_url',
                'type'         => 'url',
                'instructions' => 'Personal website or blog URL',
                'required'     => 0,
                'placeholder'  => 'https://example.com',
            ],
            [
                'key'           => 'field_author_avatar',
                'label'         => 'Avatar',
                'name'          => 'author_avatar',
                'type'          => 'image',
                'instructions'  => 'Author profile photo (recommended: 400x400px, square)',
                'required'      => 0,
                'return_format' => 'url',
                'preview_size'  => 'thumbnail',
                'min_width'     => 200,
                'min_height'    => 200,
                'mime_types'    => 'jpg, jpeg, png, webp',
            ],
        ],
        'location' => [
            [
                [
                    'param'    => 'post_type',
                    'operator' => '==',
                    'value'    => 'author',
                ],
            ],
        ],
        'position'              => 'normal',
        'style'                 => 'default',
        'label_placement'       => 'top',
        'instruction_placement' => 'label',
        'active'                => true,
        'show_in_rest'          => 1,
    ]);
```

---

## 5️⃣ Field Group 3: Category Fields

### Spesifikasi

| Field Name | Field Type | Key | Required | Notes |
|------------|-----------|-----|----------|-------|
| Color | Color Picker | `category_color` | No | Hex color untuk badge (e.g., #3B82F6) |
| Icon | Image | `category_icon` | No | Icon kecil untuk kategori |

### PHP Registration

```php
    // ================================================
    // FIELD GROUP 3: Category Fields (assigned to Category taxonomy)
    // ================================================
    acf_add_local_field_group([
        'key'      => 'group_focus_category',
        'title'    => 'Category Display Settings',
        'fields'   => [
            [
                'key'           => 'field_category_color',
                'label'         => 'Badge Color',
                'name'          => 'category_color',
                'type'          => 'color_picker',
                'instructions'  => 'Color for category badge on articles',
                'required'      => 0,
                'default_value' => '#6B7280',
                'enable_opacity' => 0,
            ],
            [
                'key'           => 'field_category_icon',
                'label'         => 'Category Icon',
                'name'          => 'category_icon',
                'type'          => 'image',
                'instructions'  => 'Small icon for category (recommended: 64x64px)',
                'required'      => 0,
                'return_format' => 'url',
                'preview_size'  => 'thumbnail',
                'mime_types'    => 'jpg, jpeg, png, svg, webp',
            ],
        ],
        'location' => [
            [
                [
                    'param'    => 'taxonomy',
                    'operator' => '==',
                    'value'    => 'category',
                ],
            ],
        ],
        'position'              => 'normal',
        'style'                 => 'default',
        'label_placement'       => 'top',
        'instruction_placement' => 'label',
        'active'                => true,
        'show_in_rest'          => 1,
    ]);
```

---

## 6️⃣ ACF to REST API Integration

### Cara Kerja

Plugin **ACF to REST API** otomatis menambahkan field ACF ke REST API response. Setelah plugin diaktifkan, field tersedia di:

| Content Type | Endpoint | ACF Fields Endpoint |
|-------------|----------|---------------------|
| Posts | `/wp-json/wp/v2/posts/{id}` | `/wp-json/acf/v3/posts/{id}` |
| Authors (CPT) | `/wp-json/wp/v2/authors/{id}` | `/wp-json/acf/v3/authors/{id}` |
| Categories | `/wp-json/wp/v2/categories/{id}` | `/wp-json/acf/v3/categories/{id}` |

### Contoh Response

**GET `/wp-json/acf/v3/posts/1`**

```json
{
  "acf": {
    "reading_time": 5,
    "featured_article": true,
    "seo_meta_title": "Memahami Arsitektur Microservices",
    "seo_meta_description": "Panduan lengkap tentang arsitektur microservices untuk developer modern."
  }
}
```

**GET `/wp-json/acf/v3/authors/1`**

```json
{
  "acf": {
    "author_role": "Senior Writer",
    "author_bio": "Tech writer specializing in software architecture and cloud computing.",
    "twitter_url": "https://twitter.com/johndoe",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "website_url": "https://johndoe.dev",
    "author_avatar": "https://api.focus.com/wp-content/uploads/2026/02/john-avatar.jpg"
  }
}
```

**GET `/wp-json/acf/v3/categories/3`**

```json
{
  "acf": {
    "category_color": "#3B82F6",
    "category_icon": "https://api.focus.com/wp-content/uploads/2026/02/tech-icon.png"
  }
}
```

### Embed ACF dalam Standard Response

Untuk menghindari request tambahan, embed ACF fields langsung ke standard WP REST response:

**Tambahkan ke `focus-acf-fields.php`:**

```php
/**
 * Embed ACF fields ke standard REST API response
 * Menghindari kebutuhan request terpisah ke /acf/v3/ endpoint
 */
add_action('rest_api_init', function () {

    // Add ACF fields ke Post response
    register_rest_field('post', 'focus_meta', [
        'get_callback' => function ($post) {
            return [
                'reading_time'    => (int) get_field('reading_time', $post['id']) ?: 1,
                'featured'        => (bool) get_field('featured_article', $post['id']),
                'seo_title'       => get_field('seo_meta_title', $post['id']) ?: '',
                'seo_description' => get_field('seo_meta_description', $post['id']) ?: '',
            ];
        },
        'schema' => [
            'type'        => 'object',
            'description' => 'Focus article metadata',
        ],
    ]);

    // Add ACF fields ke Author CPT response
    register_rest_field('author', 'focus_profile', [
        'get_callback' => function ($post) {
            return [
                'role'         => get_field('author_role', $post['id']) ?: '',
                'bio'          => get_field('author_bio', $post['id']) ?: '',
                'twitter_url'  => get_field('twitter_url', $post['id']) ?: '',
                'linkedin_url' => get_field('linkedin_url', $post['id']) ?: '',
                'website_url'  => get_field('website_url', $post['id']) ?: '',
                'avatar'       => get_field('author_avatar', $post['id']) ?: '',
            ];
        },
        'schema' => [
            'type'        => 'object',
            'description' => 'Focus author profile data',
        ],
    ]);

    // Add ACF fields ke Category response
    register_rest_field('category', 'focus_display', [
        'get_callback' => function ($category) {
            $term_id = 'category_' . $category['id'];
            return [
                'color' => get_field('category_color', $term_id) ?: '#6B7280',
                'icon'  => get_field('category_icon', $term_id) ?: '',
            ];
        },
        'schema' => [
            'type'        => 'object',
            'description' => 'Focus category display settings',
        ],
    ]);
});
```

### Hasil Response dengan Embedded Fields

**GET `/wp-json/wp/v2/posts/1`**

```json
{
  "id": 1,
  "title": { "rendered": "Memahami Arsitektur Microservices" },
  "slug": "memahami-arsitektur-microservices",
  "excerpt": { "rendered": "..." },
  "content": { "rendered": "..." },
  "author": 1,
  "categories": [3],
  "featured_media": 42,
  "focus_meta": {
    "reading_time": 5,
    "featured": true,
    "seo_title": "Memahami Arsitektur Microservices",
    "seo_description": "Panduan lengkap tentang arsitektur microservices."
  }
}
```

---

## 7️⃣ Auto-Calculate Reading Time

Tambahkan fungsi untuk otomatis menghitung reading time setiap kali post disimpan:

```php
/**
 * Auto-calculate reading time berdasarkan word count
 * Asumsi: rata-rata orang membaca 200 kata per menit
 */
function focus_calculate_reading_time($post_id) {
    // Skip autosave dan revision
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (wp_is_post_revision($post_id)) {
        return;
    }

    // Hanya untuk post type 'post'
    if (get_post_type($post_id) !== 'post') {
        return;
    }

    $content    = get_post_field('post_content', $post_id);
    $word_count = str_word_count(strip_tags($content));

    // 200 words per minute, minimum 1 menit
    $reading_time = max(1, ceil($word_count / 200));

    update_field('reading_time', $reading_time, $post_id);
}
add_action('save_post', 'focus_calculate_reading_time');
```

---

## 8️⃣ Setup Default Categories

Focus menggunakan 5 kategori default:

```bash
# Buat default categories via WP-CLI
wp term create category "Politics" --slug=politics
wp term create category "Technology" --slug=technology
wp term create category "Culture" --slug=culture
wp term create category "Business" --slug=business
wp term create category "Opinion" --slug=opinion

# Hapus default "Uncategorized" (ganti default ke "Technology" dulu)
wp option update default_category $(wp term list category --slug=technology --field=term_id)
wp term delete category 1  # Delete "Uncategorized"

# Set category colors via ACF (manual di admin atau via WP-CLI)
# Ini harus dilakukan via WP Admin → Categories → Edit masing-masing
```

### Recommended Category Colors

| Category | Slug | Color | Hex |
|----------|------|-------|-----|
| Politics | politics | Red | `#EF4444` |
| Technology | technology | Blue | `#3B82F6` |
| Culture | culture | Purple | `#8B5CF6` |
| Business | business | Green | `#10B981` |
| Opinion | opinion | Orange | `#F59E0B` |

---

## ✅ Checklist ACF Setup

| Item | Verifikasi | Expected |
|------|-----------|----------|
| ACF plugin aktif | `wp plugin list --name=advanced-custom-fields` | active |
| ACF to REST API aktif | `wp plugin list --name=acf-to-rest-api` | active |
| Author CPT registered | `curl .../wp-json/wp/v2/authors` | JSON response |
| Article fields | Create test post, check ACF metabox | 4 fields visible |
| Author fields | Create test author, check ACF metabox | 6 fields visible |
| Category fields | Edit category, check ACF fields | 2 fields visible |
| REST API response | `curl .../wp-json/wp/v2/posts/1` | focus_meta present |
| Reading time auto-calc | Save post with content | reading_time updated |
| Categories created | `wp term list category` | 5 categories |

---

## 📌 Langkah Selanjutnya

Setelah ACF field groups dikonfigurasi, lanjutkan ke:
- **[04. REST API & JWT Authentication](04-rest-api-jwt-auth.md)** - Konfigurasi lengkap REST API dan JWT auth
