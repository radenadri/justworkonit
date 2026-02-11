# 06. User Roles & Permissions

> Konfigurasi user roles, capabilities, dan permission management untuk Focus platform

---

## 📋 Daftar Isi

1. [Focus User Roles](#1-focus-user-roles)
2. [Role Mapping ke WordPress](#2-role-mapping-ke-wordpress)
3. [Kustomisasi Role & Capabilities](#3-kustomisasi-role--capabilities)
4. [REST API Permission Matrix](#4-rest-api-permission-matrix)
5. [Registration & Role Assignment](#5-registration--role-assignment)
6. [Author Profile via REST API](#6-author-profile-via-rest-api)
7. [User Enumeration Security](#7-user-enumeration-security)
8. [WP-CLI User Management](#8-wp-cli-user-management)

---

## 1️⃣ Focus User Roles

Focus platform memiliki 5 level akses yang di-mapping ke WordPress roles:

| Focus Role | WP Role | Deskripsi | Akses |
|------------|---------|-----------|-------|
| **Guest** | (none) | Pengunjung tanpa login | Baca artikel, search, browse kategori |
| **Reader** | Subscriber | Pembaca terdaftar | + Bookmark sync, komentar, follow author |
| **Writer** | Author | Penulis/kontributor | + Buat/edit artikel sendiri, drafts, view stats |
| **Editor** | Editor | Tim editorial | + Approve artikel, manage featured, kelola kategori |
| **Admin** | Administrator | Pengelola teknis | + Full akses WordPress admin |

### Role Hierarchy

```
Admin (Administrator)
  └── Editor
        └── Writer (Author)
              └── Reader (Subscriber)
                    └── Guest (No Account)
```

---

## 2️⃣ Role Mapping ke WordPress

### Default WordPress Capabilities per Role

| Capability | Subscriber | Author | Editor | Admin |
|------------|:----------:|:------:|:------:|:-----:|
| `read` | ✅ | ✅ | ✅ | ✅ |
| `edit_posts` | ❌ | ✅ | ✅ | ✅ |
| `publish_posts` | ❌ | ✅ | ✅ | ✅ |
| `edit_published_posts` | ❌ | ✅ | ✅ | ✅ |
| `delete_posts` | ❌ | ✅ | ✅ | ✅ |
| `delete_published_posts` | ❌ | ✅ | ✅ | ✅ |
| `upload_files` | ❌ | ✅ | ✅ | ✅ |
| `edit_others_posts` | ❌ | ❌ | ✅ | ✅ |
| `delete_others_posts` | ❌ | ❌ | ✅ | ✅ |
| `publish_others_posts` | ❌ | ❌ | ✅ | ✅ |
| `manage_categories` | ❌ | ❌ | ✅ | ✅ |
| `moderate_comments` | ❌ | ❌ | ✅ | ✅ |
| `manage_options` | ❌ | ❌ | ❌ | ✅ |
| `edit_users` | ❌ | ❌ | ❌ | ✅ |
| `install_plugins` | ❌ | ❌ | ❌ | ✅ |

---

## 3️⃣ Kustomisasi Role & Capabilities

### Focus Custom Capabilities

Tambahkan ke `wp-content/mu-plugins/focus-roles.php`:

```php
<?php
/**
 * Focus Platform - Custom Roles & Capabilities
 * 
 * File: wp-content/mu-plugins/focus-roles.php
 */

// Jalankan sekali saat aktivasi (atau via WP-CLI)
function focus_setup_roles() {
    // =============================================
    // 1. Kustomisasi Author role (Writer)
    // =============================================
    $author = get_role('author');
    if ($author) {
        // Pastikan Writer bisa upload files
        $author->add_cap('upload_files');
        
        // Writer bisa edit dan publish post sendiri
        $author->add_cap('edit_posts');
        $author->add_cap('edit_published_posts');
        $author->add_cap('publish_posts');
        $author->add_cap('delete_posts');
        $author->add_cap('delete_published_posts');
        
        // Custom capabilities untuk Focus
        $author->add_cap('focus_view_stats');
        $author->add_cap('focus_manage_drafts');
    }

    // =============================================
    // 2. Kustomisasi Editor role
    // =============================================
    $editor = get_role('editor');
    if ($editor) {
        // Editor bisa manage featured articles
        $editor->add_cap('focus_manage_featured');
        $editor->add_cap('focus_view_stats');
        $editor->add_cap('focus_manage_drafts');
    }

    // =============================================
    // 3. Kustomisasi Subscriber role (Reader)
    // =============================================
    $subscriber = get_role('subscriber');
    if ($subscriber) {
        // Reader hanya bisa read
        $subscriber->add_cap('read');
        // Custom: bisa follow dan comment
        $subscriber->add_cap('focus_follow_authors');
        $subscriber->add_cap('focus_sync_bookmarks');
    }

    // =============================================
    // 4. Admin mendapat semua custom caps
    // =============================================
    $admin = get_role('administrator');
    if ($admin) {
        $admin->add_cap('focus_manage_featured');
        $admin->add_cap('focus_view_stats');
        $admin->add_cap('focus_manage_drafts');
        $admin->add_cap('focus_follow_authors');
        $admin->add_cap('focus_sync_bookmarks');
    }
}

// Jalankan setup roles saat theme/plugin activation
// Atau panggil manual via: wp eval 'focus_setup_roles();'
add_action('after_switch_theme', 'focus_setup_roles');

// Juga jalankan sekali jika belum pernah
if (!get_option('focus_roles_initialized')) {
    focus_setup_roles();
    update_option('focus_roles_initialized', true);
}
```

### Focus Custom Capabilities Summary

| Capability | Reader | Writer | Editor | Admin |
|------------|:------:|:------:|:------:|:-----:|
| `focus_follow_authors` | ✅ | ✅ | ✅ | ✅ |
| `focus_sync_bookmarks` | ✅ | ✅ | ✅ | ✅ |
| `focus_manage_drafts` | ❌ | ✅ | ✅ | ✅ |
| `focus_view_stats` | ❌ | ✅ | ✅ | ✅ |
| `focus_manage_featured` | ❌ | ❌ | ✅ | ✅ |

---

## 4️⃣ REST API Permission Matrix

### Core WordPress Endpoints

| Endpoint | Method | Guest | Reader | Writer | Editor | Admin |
|----------|--------|:-----:|:------:|:------:|:------:|:-----:|
| `/wp/v2/posts` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/wp/v2/posts` | POST | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/wp/v2/posts/{id}` | PUT (own) | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/wp/v2/posts/{id}` | PUT (others) | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/wp/v2/posts/{id}` | DELETE (own) | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/wp/v2/posts/{id}` | DELETE (others) | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/wp/v2/categories` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/wp/v2/categories` | POST | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/wp/v2/users/{id}` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/wp/v2/users/me` | GET | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/wp/v2/media` | POST | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/wp/v2/comments` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/wp/v2/comments` | POST | ❌ | ✅ | ✅ | ✅ | ✅ |

### Focus Custom Endpoints

| Endpoint | Method | Guest | Reader | Writer | Editor | Admin |
|----------|--------|:-----:|:------:|:------:|:------:|:-----:|
| `/focus/v1/featured` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/focus/v1/related/{id}` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/focus/v1/authors/popular` | GET | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/focus/v1/register` | POST | ✅ | - | - | - | - |
| `/focus/v1/forgot-password` | POST | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/focus/v1/follow/{id}` | POST | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/focus/v1/unfollow/{id}` | DELETE | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/focus/v1/following` | GET | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/focus/v1/my-drafts` | GET | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/focus/v1/my-stats` | GET | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/focus/v1/newsletter/subscribe` | POST | ✅ | ✅ | ✅ | ✅ | ✅ |

### Permission Callback Patterns

```php
// Public - siapa saja bisa akses
'permission_callback' => '__return_true'

// Logged in - minimal Reader
'permission_callback' => function () {
    return is_user_logged_in();
}

// Writer - bisa buat/edit artikel
'permission_callback' => function () {
    return current_user_can('edit_posts');
}

// Editor - bisa manage featured
'permission_callback' => function () {
    return current_user_can('focus_manage_featured');
}

// Admin only
'permission_callback' => function () {
    return current_user_can('manage_options');
}

// Owner only - hanya pemilik resource
'permission_callback' => function ($request) {
    $post = get_post($request['id']);
    return $post && (int) $post->post_author === get_current_user_id();
}
```

---

## 5️⃣ Registration & Role Assignment

### Default Registration Flow

```php
/**
 * User baru otomatis menjadi Subscriber (Reader)
 * 
 * Di wp-config.php atau Settings → General:
 */
define('WP_DEFAULT_ROLE', 'subscriber');
```

### Promote User ke Writer

Writer harus di-promote manual oleh Admin/Editor:

```php
/**
 * Promote user ke Writer role
 * Hanya Admin/Editor yang bisa melakukan ini
 */
add_action('rest_api_init', function () {
    register_rest_route('focus/v1', '/promote/(?P<user_id>\d+)', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $user_id = $request['user_id'];
            $new_role = sanitize_text_field($request->get_param('role'));
            
            // Validasi role yang diperbolehkan
            $allowed_roles = ['subscriber', 'author', 'editor'];
            if (!in_array($new_role, $allowed_roles)) {
                return new WP_Error('invalid_role', 'Role tidak valid', ['status' => 400]);
            }
            
            $user = get_user_by('id', $user_id);
            if (!$user) {
                return new WP_Error('user_not_found', 'User tidak ditemukan', ['status' => 404]);
            }
            
            // Hanya Admin yang bisa promote ke Editor
            if ($new_role === 'editor' && !current_user_can('manage_options')) {
                return new WP_Error('unauthorized', 'Hanya Admin yang bisa promote ke Editor', ['status' => 403]);
            }
            
            $user->set_role($new_role);
            
            return rest_ensure_response([
                'success' => true,
                'user_id' => $user_id,
                'new_role' => $new_role,
            ]);
        },
        'permission_callback' => function () {
            // Editor bisa promote ke Writer, Admin bisa promote ke apapun
            return current_user_can('edit_users') || current_user_can('manage_options');
        },
        'args' => [
            'role' => [
                'required' => true,
                'type' => 'string',
                'enum' => ['subscriber', 'author', 'editor'],
            ],
        ],
    ]);
});
```

---

## 6️⃣ Author Profile via REST API

### Expose Custom Fields di User Response

Tambahkan ACF fields ke REST API user response:

```php
/**
 * Tambahkan custom fields ke /wp/v2/users/{id} response
 * 
 * File: wp-content/mu-plugins/focus-user-fields.php
 */
add_action('rest_api_init', function () {
    // Bio extended
    register_rest_field('user', 'author_bio', [
        'get_callback' => function ($user) {
            return get_field('author_bio', 'user_' . $user['id']) ?: '';
        },
        'schema' => ['type' => 'string', 'description' => 'Author biography'],
    ]);

    // Role/Title (e.g., "Senior Writer")
    register_rest_field('user', 'author_role', [
        'get_callback' => function ($user) {
            return get_field('author_role', 'user_' . $user['id']) ?: '';
        },
        'schema' => ['type' => 'string', 'description' => 'Author role/title'],
    ]);

    // Social links
    register_rest_field('user', 'twitter_url', [
        'get_callback' => function ($user) {
            return get_field('twitter_url', 'user_' . $user['id']) ?: '';
        },
        'schema' => ['type' => 'string', 'format' => 'uri'],
    ]);

    register_rest_field('user', 'linkedin_url', [
        'get_callback' => function ($user) {
            return get_field('linkedin_url', 'user_' . $user['id']) ?: '';
        },
        'schema' => ['type' => 'string', 'format' => 'uri'],
    ]);

    register_rest_field('user', 'website_url', [
        'get_callback' => function ($user) {
            return get_field('website_url', 'user_' . $user['id']) ?: '';
        },
        'schema' => ['type' => 'string', 'format' => 'uri'],
    ]);

    // Avatar URL (dari ACF image field)
    register_rest_field('user', 'author_avatar', [
        'get_callback' => function ($user) {
            $avatar = get_field('author_avatar', 'user_' . $user['id']);
            if ($avatar) {
                return is_array($avatar) ? $avatar['url'] : $avatar;
            }
            // Fallback ke Gravatar
            return get_avatar_url($user['id'], ['size' => 256]);
        },
        'schema' => ['type' => 'string', 'format' => 'uri'],
    ]);

    // Follower count
    register_rest_field('user', 'follower_count', [
        'get_callback' => function ($user) {
            global $wpdb;
            $table = $wpdb->prefix . 'focus_follows';
            return (int) $wpdb->get_var(
                $wpdb->prepare("SELECT COUNT(*) FROM {$table} WHERE author_id = %d", $user['id'])
            );
        },
        'schema' => ['type' => 'integer'],
    ]);

    // Article count (published)
    register_rest_field('user', 'article_count', [
        'get_callback' => function ($user) {
            return (int) count_user_posts($user['id'], 'post', true);
        },
        'schema' => ['type' => 'integer'],
    ]);
});
```

### Contoh Response `/wp/v2/users/5`

```json
{
  "id": 5,
  "name": "Sarah Writer",
  "slug": "sarah-writer",
  "description": "",
  "author_bio": "Tech writer with 5 years of experience covering AI and startups.",
  "author_role": "Senior Writer",
  "twitter_url": "https://twitter.com/sarahwriter",
  "linkedin_url": "https://linkedin.com/in/sarahwriter",
  "website_url": "https://sarahwriter.com",
  "author_avatar": "https://api.focus.com/wp-content/uploads/2026/01/sarah.jpg",
  "follower_count": 342,
  "article_count": 28
}
```

### Hide Sensitive Fields

```php
/**
 * Sembunyikan email dari public REST API response
 */
add_filter('rest_prepare_user', function ($response, $user, $request) {
    // Hanya tampilkan email untuk user sendiri atau admin
    if (get_current_user_id() !== $user->ID && !current_user_can('list_users')) {
        unset($response->data['email']);
    }
    
    // Hapus field yang tidak diperlukan frontend
    unset($response->data['registered_date']);
    unset($response->data['capabilities']);
    unset($response->data['extra_capabilities']);
    unset($response->data['roles']);
    
    return $response;
}, 10, 3);
```

---

## 7️⃣ User Enumeration Security

### Batasi User Listing untuk Non-Admin

```php
/**
 * Batasi /wp/v2/users endpoint
 * - Non-admin hanya bisa lihat authors yang punya published post
 * - Admin bisa lihat semua users
 */
add_filter('rest_user_query', function ($prepared_args, $request) {
    if (!current_user_can('list_users')) {
        // Hanya tampilkan user yang punya published posts
        $prepared_args['has_published_posts'] = ['post'];
    }
    return $prepared_args;
}, 10, 2);

/**
 * Blokir /?author=N enumeration (WordPress frontend)
 * Karena headless, ini tidak terlalu critical tapi tetap best practice
 */
add_action('template_redirect', function () {
    if (is_author()) {
        wp_redirect(admin_url());
        exit;
    }
});

/**
 * Disable REST API user listing untuk non-authenticated users
 * Allow specific user ID lookups only
 */
add_filter('rest_endpoints', function ($endpoints) {
    // Jika tidak login, batasi user endpoints
    if (!is_user_logged_in()) {
        // Tetap izinkan /users/{id} untuk single lookup
        // Tapi tambahkan filter di rest_user_query untuk limit
    }
    return $endpoints;
});
```

---

## 8️⃣ WP-CLI User Management

### Perintah Umum

```bash
# =============================================
# Lihat semua users
# =============================================
wp user list --fields=ID,user_login,display_name,roles

# =============================================
# Buat user baru
# =============================================

# Buat Reader
wp user create john john@example.com --role=subscriber --display_name="John Reader"

# Buat Writer
wp user create sarah sarah@example.com --role=author --display_name="Sarah Writer"

# Buat Editor
wp user create mike mike@example.com --role=editor --display_name="Mike Editor"

# =============================================
# Promote/Demote user
# =============================================

# Promote Reader → Writer
wp user set-role john author

# Promote Writer → Editor
wp user set-role sarah editor

# Demote Editor → Writer
wp user set-role mike author

# =============================================
# Update user meta
# =============================================

# Set author bio (ACF field)
wp eval 'update_field("author_bio", "Experienced tech writer.", "user_5");'

# Set social links
wp eval 'update_field("twitter_url", "https://twitter.com/sarah", "user_5");'
wp eval 'update_field("linkedin_url", "https://linkedin.com/in/sarah", "user_5");'

# =============================================
# Delete user
# =============================================

# Delete user dan reassign posts ke user ID 1 (admin)
wp user delete john --reassign=1

# =============================================
# Reset password
# =============================================
wp user update john --user_pass=newpassword123

# Generate random password
wp user reset-password john
```

### Batch User Import

```bash
# Import users dari CSV
# Format CSV: user_login,user_email,display_name,role
wp user import-csv users.csv

# Contoh users.csv:
# user_login,user_email,display_name,role
# sarah,sarah@focus.com,Sarah Writer,author
# mike,mike@focus.com,Mike Editor,editor
# john,john@focus.com,John Reader,subscriber
```

---

## ✅ Checklist User Roles

- [ ] Custom roles & capabilities di-setup via mu-plugin
- [ ] Default registration role = subscriber (Reader)
- [ ] Writer (Author) capabilities sudah benar
- [ ] Editor capabilities termasuk `focus_manage_featured`
- [ ] REST API permission callbacks sesuai matrix
- [ ] User enumeration dibatasi untuk non-admin
- [ ] Sensitive fields (email) disembunyikan dari public API
- [ ] Author custom fields tersedia via REST API
- [ ] WP-CLI commands untuk user management siap

---

**Selanjutnya:** [07. Security & Performance →](./07-security-performance.md)
