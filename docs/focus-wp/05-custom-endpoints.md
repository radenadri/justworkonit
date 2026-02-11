# 05. Custom REST API Endpoints

> Implementasi custom endpoint untuk fitur Focus: featured articles, follow system, register, newsletter

---

## 📋 Daftar Isi

1. [Overview & Architecture](#1-overview--architecture)
2. [Plugin Structure](#2-plugin-structure)
3. [Database Setup](#3-database-setup)
4. [Registration & Auth Endpoints](#4-registration--auth-endpoints)
5. [Content Endpoints](#5-content-endpoints)
6. [Social Endpoints (Follow System)](#6-social-endpoints-follow-system)
7. [Writer Endpoints](#7-writer-endpoints)
8. [Newsletter Endpoint](#8-newsletter-endpoint)
9. [Testing](#9-testing)

---

## 1️⃣ Overview & Architecture

Selain endpoint bawaan WordPress REST API, Focus membutuhkan custom endpoints untuk fitur-fitur spesifik platform.

### Custom Endpoints Map

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/focus/v1/register` | POST | No | Registrasi user baru |
| `/focus/v1/forgot-password` | POST | No | Request reset password |
| `/focus/v1/featured` | GET | No | Featured/Staff picks articles |
| `/focus/v1/related/{id}` | GET | No | Artikel terkait |
| `/focus/v1/authors/popular` | GET | No | Popular authors to follow |
| `/focus/v1/follow/{author_id}` | POST | JWT | Follow author |
| `/focus/v1/unfollow/{author_id}` | DELETE | JWT | Unfollow author |
| `/focus/v1/following` | GET | JWT | Daftar followed authors |
| `/focus/v1/my-drafts` | GET | JWT | Draft articles user |
| `/focus/v1/my-stats` | GET | JWT | Statistik writer |
| `/focus/v1/newsletter/subscribe` | POST | No | Newsletter subscription |

---

## 2️⃣ Plugin Structure

Semua custom endpoints diimplementasikan sebagai **must-use plugin** agar selalu aktif dan tidak bisa dinonaktifkan secara tidak sengaja.

### File Structure

```
wp-content/mu-plugins/
├── focus-api.php              # Main loader
├── focus-api/
│   ├── class-focus-db.php     # Database setup
│   ├── class-focus-auth.php   # Registration & auth endpoints
│   ├── class-focus-content.php # Content endpoints (featured, related)
│   ├── class-focus-social.php  # Follow system
│   ├── class-focus-writer.php  # Writer dashboard endpoints
│   └── class-focus-newsletter.php # Newsletter
```

### Main Loader (focus-api.php)

```php
<?php
/**
 * Plugin Name: Focus API
 * Description: Custom REST API endpoints untuk platform Focus
 * Version: 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) exit;

// Load classes
require_once __DIR__ . '/focus-api/class-focus-db.php';
require_once __DIR__ . '/focus-api/class-focus-auth.php';
require_once __DIR__ . '/focus-api/class-focus-content.php';
require_once __DIR__ . '/focus-api/class-focus-social.php';
require_once __DIR__ . '/focus-api/class-focus-writer.php';
require_once __DIR__ . '/focus-api/class-focus-newsletter.php';

// Initialize database on activation
register_activation_hook(__FILE__, ['Focus_DB', 'create_tables']);

// Register REST routes
add_action('rest_api_init', function () {
    $auth = new Focus_Auth();
    $auth->register_routes();
    
    $content = new Focus_Content();
    $content->register_routes();
    
    $social = new Focus_Social();
    $social->register_routes();
    
    $writer = new Focus_Writer();
    $writer->register_routes();
    
    $newsletter = new Focus_Newsletter();
    $newsletter->register_routes();
});

// Create tables on plugin load (mu-plugins don't have activation hooks)
add_action('init', function () {
    Focus_DB::maybe_create_tables();
});
```

---

## 3️⃣ Database Setup

### Custom Tables

Focus membutuhkan 2 custom table:

```php
<?php
// class-focus-db.php

class Focus_DB {
    
    const DB_VERSION = '1.0';
    const DB_VERSION_OPTION = 'focus_db_version';
    
    /**
     * Create custom tables if they don't exist
     */
    public static function maybe_create_tables() {
        $installed_version = get_option(self::DB_VERSION_OPTION, '0');
        
        if (version_compare($installed_version, self::DB_VERSION, '<')) {
            self::create_tables();
            update_option(self::DB_VERSION_OPTION, self::DB_VERSION);
        }
    }
    
    /**
     * Create all custom tables
     */
    public static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Follows table
        $follows_table = $wpdb->prefix . 'focus_follows';
        $sql_follows = "CREATE TABLE $follows_table (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            follower_id BIGINT(20) UNSIGNED NOT NULL,
            author_id BIGINT(20) UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_follow (follower_id, author_id),
            KEY idx_follower (follower_id),
            KEY idx_author (author_id)
        ) $charset_collate;";
        
        // Newsletter subscribers table
        $newsletter_table = $wpdb->prefix . 'focus_newsletter';
        $sql_newsletter = "CREATE TABLE $newsletter_table (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            email VARCHAR(255) NOT NULL,
            status ENUM('active', 'unsubscribed') NOT NULL DEFAULT 'active',
            subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            unsubscribed_at DATETIME DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY unique_email (email),
            KEY idx_status (status)
        ) $charset_collate;";
        
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql_follows);
        dbDelta($sql_newsletter);
    }
}
```

---

## 4️⃣ Registration & Auth Endpoints

```php
<?php
// class-focus-auth.php

class Focus_Auth {
    
    const NAMESPACE = 'focus/v1';
    
    public function register_routes() {
        // POST /focus/v1/register
        register_rest_route(self::NAMESPACE, '/register', [
            'methods' => 'POST',
            'callback' => [$this, 'register_user'],
            'permission_callback' => '__return_true',
            'args' => [
                'username' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_user',
                    'validate_callback' => function ($value) {
                        return strlen($value) >= 3 && strlen($value) <= 60;
                    },
                ],
                'email' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_email',
                    'validate_callback' => 'is_email',
                ],
                'password' => [
                    'required' => true,
                    'type' => 'string',
                    'validate_callback' => function ($value) {
                        return strlen($value) >= 8;
                    },
                ],
                'display_name' => [
                    'required' => false,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
        
        // POST /focus/v1/forgot-password
        register_rest_route(self::NAMESPACE, '/forgot-password', [
            'methods' => 'POST',
            'callback' => [$this, 'forgot_password'],
            'permission_callback' => '__return_true',
            'args' => [
                'email' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_email',
                    'validate_callback' => 'is_email',
                ],
            ],
        ]);
    }
    
    /**
     * POST /focus/v1/register
     * Register new user (Subscriber/Reader role)
     */
    public function register_user($request) {
        $username = $request->get_param('username');
        $email = $request->get_param('email');
        $password = $request->get_param('password');
        $display_name = $request->get_param('display_name') ?: $username;
        
        // Check if username exists
        if (username_exists($username)) {
            return new WP_Error(
                'username_exists',
                'Username sudah digunakan.',
                ['status' => 400]
            );
        }
        
        // Check if email exists
        if (email_exists($email)) {
            return new WP_Error(
                'email_exists',
                'Email sudah terdaftar.',
                ['status' => 400]
            );
        }
        
        // Create user
        $user_id = wp_create_user($username, $password, $email);
        
        if (is_wp_error($user_id)) {
            return new WP_Error(
                'registration_failed',
                'Registrasi gagal: ' . $user_id->get_error_message(),
                ['status' => 500]
            );
        }
        
        // Update display name
        wp_update_user([
            'ID' => $user_id,
            'display_name' => $display_name,
        ]);
        
        // Set role to subscriber (Reader)
        $user = new WP_User($user_id);
        $user->set_role('subscriber');
        
        // Send verification email (optional)
        wp_new_user_notification($user_id, null, 'user');
        
        return rest_ensure_response([
            'success' => true,
            'message' => 'Registrasi berhasil! Silakan login.',
            'user_id' => $user_id,
        ]);
    }
    
    /**
     * POST /focus/v1/forgot-password
     * Send password reset email
     */
    public function forgot_password($request) {
        $email = $request->get_param('email');
        
        $user = get_user_by('email', $email);
        
        // Always return success to prevent email enumeration
        if (!$user) {
            return rest_ensure_response([
                'success' => true,
                'message' => 'Jika email terdaftar, link reset password telah dikirim.',
            ]);
        }
        
        // Generate reset key and send email
        $reset_key = get_password_reset_key($user);
        
        if (is_wp_error($reset_key)) {
            return rest_ensure_response([
                'success' => true,
                'message' => 'Jika email terdaftar, link reset password telah dikirim.',
            ]);
        }
        
        // Send reset email
        $reset_url = 'https://focus.com/reset-password?key=' . $reset_key . '&login=' . rawurlencode($user->user_login);
        
        $subject = 'Reset Password - Focus';
        $message = sprintf(
            "Halo %s,\n\nKlik link berikut untuk reset password:\n%s\n\nLink berlaku selama 24 jam.\n\n- Tim Focus",
            $user->display_name,
            $reset_url
        );
        
        wp_mail($user->user_email, $subject, $message);
        
        return rest_ensure_response([
            'success' => true,
            'message' => 'Jika email terdaftar, link reset password telah dikirim.',
        ]);
    }
}
```

---

## 5️⃣ Content Endpoints

```php
<?php
// class-focus-content.php

class Focus_Content {
    
    const NAMESPACE = 'focus/v1';
    
    public function register_routes() {
        // GET /focus/v1/featured
        register_rest_route(self::NAMESPACE, '/featured', [
            'methods' => 'GET',
            'callback' => [$this, 'get_featured'],
            'permission_callback' => '__return_true',
            'args' => [
                'per_page' => [
                    'default' => 5,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                    'validate_callback' => function ($value) {
                        return $value >= 1 && $value <= 20;
                    },
                ],
            ],
        ]);
        
        // GET /focus/v1/related/{id}
        register_rest_route(self::NAMESPACE, '/related/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_related'],
            'permission_callback' => '__return_true',
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
                'per_page' => [
                    'default' => 4,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
        
        // GET /focus/v1/authors/popular
        register_rest_route(self::NAMESPACE, '/authors/popular', [
            'methods' => 'GET',
            'callback' => [$this, 'get_popular_authors'],
            'permission_callback' => '__return_true',
            'args' => [
                'per_page' => [
                    'default' => 5,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
    }
    
    /**
     * GET /focus/v1/featured
     * Featured articles (staff picks)
     */
    public function get_featured($request) {
        $per_page = $request->get_param('per_page');
        
        $args = [
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => $per_page,
            'meta_query' => [
                [
                    'key' => 'featured_article',
                    'value' => '1',
                    'compare' => '=',
                ],
            ],
            'orderby' => 'date',
            'order' => 'DESC',
        ];
        
        $query = new WP_Query($args);
        $articles = [];
        
        foreach ($query->posts as $post) {
            $articles[] = $this->format_article($post);
        }
        
        return rest_ensure_response([
            'articles' => $articles,
            'total' => $query->found_posts,
        ]);
    }
    
    /**
     * GET /focus/v1/related/{id}
     * Related articles by category
     */
    public function get_related($request) {
        $post_id = $request->get_param('id');
        $per_page = $request->get_param('per_page');
        
        // Get post categories
        $categories = wp_get_post_categories($post_id);
        
        if (empty($categories)) {
            return rest_ensure_response(['articles' => []]);
        }
        
        $args = [
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => $per_page,
            'post__not_in' => [$post_id],
            'category__in' => $categories,
            'orderby' => 'date',
            'order' => 'DESC',
        ];
        
        $query = new WP_Query($args);
        $articles = [];
        
        foreach ($query->posts as $post) {
            $articles[] = $this->format_article($post);
        }
        
        return rest_ensure_response([
            'articles' => $articles,
        ]);
    }
    
    /**
     * GET /focus/v1/authors/popular
     * Popular authors (most published articles)
     */
    public function get_popular_authors($request) {
        global $wpdb;
        
        $per_page = $request->get_param('per_page');
        
        // Get authors with most published posts
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT post_author, COUNT(*) as post_count 
             FROM {$wpdb->posts} 
             WHERE post_status = 'publish' AND post_type = 'post'
             GROUP BY post_author 
             ORDER BY post_count DESC 
             LIMIT %d",
            $per_page
        ));
        
        $authors = [];
        foreach ($results as $result) {
            $user = get_user_by('ID', $result->post_author);
            if (!$user) continue;
            
            // Get follower count
            $follower_count = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}focus_follows WHERE author_id = %d",
                $user->ID
            ));
            
            $authors[] = [
                'id' => $user->ID,
                'name' => $user->display_name,
                'slug' => $user->user_nicename,
                'avatar' => get_avatar_url($user->ID, ['size' => 96]),
                'bio' => get_field('author_bio', 'user_' . $user->ID) ?: '',
                'role_title' => get_field('author_role', 'user_' . $user->ID) ?: '',
                'post_count' => (int) $result->post_count,
                'follower_count' => (int) $follower_count,
            ];
        }
        
        return rest_ensure_response([
            'authors' => $authors,
        ]);
    }
    
    /**
     * Format article for API response
     */
    private function format_article($post) {
        $categories = wp_get_post_categories($post->ID, ['fields' => 'all']);
        $primary_cat = !empty($categories) ? $categories[0] : null;
        $author = get_user_by('ID', $post->post_author);
        
        return [
            'id' => $post->ID,
            'title' => get_the_title($post),
            'slug' => $post->post_name,
            'excerpt' => get_the_excerpt($post),
            'date' => get_the_date('c', $post),
            'featured_image' => get_the_post_thumbnail_url($post->ID, 'large') ?: null,
            'reading_time' => (int) get_field('reading_time', $post->ID) ?: 1,
            'category' => $primary_cat ? [
                'id' => $primary_cat->term_id,
                'name' => $primary_cat->name,
                'slug' => $primary_cat->slug,
                'color' => get_field('category_color', 'category_' . $primary_cat->term_id) ?: '#6B7280',
            ] : null,
            'author' => $author ? [
                'id' => $author->ID,
                'name' => $author->display_name,
                'slug' => $author->user_nicename,
                'avatar' => get_avatar_url($author->ID, ['size' => 96]),
            ] : null,
        ];
    }
}
```

---

## 6️⃣ Social Endpoints (Follow System)

```php
<?php
// class-focus-social.php

class Focus_Social {
    
    const NAMESPACE = 'focus/v1';
    
    public function register_routes() {
        // POST /focus/v1/follow/{author_id}
        register_rest_route(self::NAMESPACE, '/follow/(?P<author_id>\d+)', [
            'methods' => 'POST',
            'callback' => [$this, 'follow_author'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
            'args' => [
                'author_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
        
        // DELETE /focus/v1/unfollow/{author_id}
        register_rest_route(self::NAMESPACE, '/unfollow/(?P<author_id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'unfollow_author'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
            'args' => [
                'author_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
        
        // GET /focus/v1/following
        register_rest_route(self::NAMESPACE, '/following', [
            'methods' => 'GET',
            'callback' => [$this, 'get_following'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);
    }
    
    /**
     * POST /focus/v1/follow/{author_id}
     */
    public function follow_author($request) {
        global $wpdb;
        
        $current_user_id = get_current_user_id();
        $author_id = $request->get_param('author_id');
        
        // Cannot follow yourself
        if ($current_user_id === $author_id) {
            return new WP_Error(
                'cannot_follow_self',
                'Tidak bisa follow diri sendiri.',
                ['status' => 400]
            );
        }
        
        // Check if author exists
        $author = get_user_by('ID', $author_id);
        if (!$author) {
            return new WP_Error(
                'author_not_found',
                'Author tidak ditemukan.',
                ['status' => 404]
            );
        }
        
        $table = $wpdb->prefix . 'focus_follows';
        
        // Check if already following
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM $table WHERE follower_id = %d AND author_id = %d",
            $current_user_id,
            $author_id
        ));
        
        if ($existing) {
            return rest_ensure_response([
                'success' => true,
                'message' => 'Sudah di-follow sebelumnya.',
                'following' => true,
            ]);
        }
        
        // Insert follow
        $result = $wpdb->insert($table, [
            'follower_id' => $current_user_id,
            'author_id' => $author_id,
            'created_at' => current_time('mysql'),
        ], ['%d', '%d', '%s']);
        
        if ($result === false) {
            return new WP_Error(
                'follow_failed',
                'Gagal follow author.',
                ['status' => 500]
            );
        }
        
        // Get updated follower count
        $follower_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE author_id = %d",
            $author_id
        ));
        
        return rest_ensure_response([
            'success' => true,
            'message' => 'Berhasil follow ' . $author->display_name,
            'following' => true,
            'follower_count' => (int) $follower_count,
        ]);
    }
    
    /**
     * DELETE /focus/v1/unfollow/{author_id}
     */
    public function unfollow_author($request) {
        global $wpdb;
        
        $current_user_id = get_current_user_id();
        $author_id = $request->get_param('author_id');
        
        $table = $wpdb->prefix . 'focus_follows';
        
        $result = $wpdb->delete($table, [
            'follower_id' => $current_user_id,
            'author_id' => $author_id,
        ], ['%d', '%d']);
        
        // Get updated follower count
        $follower_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE author_id = %d",
            $author_id
        ));
        
        return rest_ensure_response([
            'success' => true,
            'message' => 'Berhasil unfollow.',
            'following' => false,
            'follower_count' => (int) $follower_count,
        ]);
    }
    
    /**
     * GET /focus/v1/following
     * List authors the current user follows
     */
    public function get_following($request) {
        global $wpdb;
        
        $current_user_id = get_current_user_id();
        $table = $wpdb->prefix . 'focus_follows';
        
        $followed_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT author_id FROM $table WHERE follower_id = %d ORDER BY created_at DESC",
            $current_user_id
        ));
        
        $authors = [];
        foreach ($followed_ids as $author_id) {
            $user = get_user_by('ID', $author_id);
            if (!$user) continue;
            
            $follower_count = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $table WHERE author_id = %d",
                $author_id
            ));
            
            $authors[] = [
                'id' => $user->ID,
                'name' => $user->display_name,
                'slug' => $user->user_nicename,
                'avatar' => get_avatar_url($user->ID, ['size' => 96]),
                'bio' => get_field('author_bio', 'user_' . $user->ID) ?: '',
                'role_title' => get_field('author_role', 'user_' . $user->ID) ?: '',
                'follower_count' => (int) $follower_count,
            ];
        }
        
        return rest_ensure_response([
            'authors' => $authors,
            'total' => count($authors),
        ]);
    }
}
```

---

## 7️⃣ Writer Endpoints

```php
<?php
// class-focus-writer.php

class Focus_Writer {
    
    const NAMESPACE = 'focus/v1';
    
    public function register_routes() {
        // GET /focus/v1/my-drafts
        register_rest_route(self::NAMESPACE, '/my-drafts', [
            'methods' => 'GET',
            'callback' => [$this, 'get_my_drafts'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
            'args' => [
                'per_page' => [
                    'default' => 10,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
                'page' => [
                    'default' => 1,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
        
        // GET /focus/v1/my-stats
        register_rest_route(self::NAMESPACE, '/my-stats', [
            'methods' => 'GET',
            'callback' => [$this, 'get_my_stats'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);
    }
    
    /**
     * GET /focus/v1/my-drafts
     */
    public function get_my_drafts($request) {
        $current_user_id = get_current_user_id();
        $per_page = $request->get_param('per_page');
        $page = $request->get_param('page');
        
        $args = [
            'post_type' => 'post',
            'post_status' => 'draft',
            'author' => $current_user_id,
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'modified',
            'order' => 'DESC',
        ];
        
        $query = new WP_Query($args);
        $drafts = [];
        
        foreach ($query->posts as $post) {
            $drafts[] = [
                'id' => $post->ID,
                'title' => get_the_title($post) ?: '(Untitled)',
                'slug' => $post->post_name,
                'excerpt' => get_the_excerpt($post),
                'modified' => get_the_modified_date('c', $post),
                'created' => get_the_date('c', $post),
                'word_count' => str_word_count(strip_tags($post->post_content)),
            ];
        }
        
        return rest_ensure_response([
            'drafts' => $drafts,
            'total' => $query->found_posts,
            'total_pages' => $query->max_num_pages,
            'current_page' => $page,
        ]);
    }
    
    /**
     * GET /focus/v1/my-stats
     * Writer dashboard statistics
     */
    public function get_my_stats($request) {
        global $wpdb;
        
        $current_user_id = get_current_user_id();
        
        // Published articles count
        $published_count = count_user_posts($current_user_id, 'post', true);
        
        // Draft count
        $draft_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->posts} 
             WHERE post_author = %d AND post_status = 'draft' AND post_type = 'post'",
            $current_user_id
        ));
        
        // Total views (from post meta - requires view tracking)
        $total_views = $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(meta_value), 0) FROM {$wpdb->postmeta} pm
             INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
             WHERE p.post_author = %d AND pm.meta_key = 'post_views_count'
             AND p.post_status = 'publish' AND p.post_type = 'post'",
            $current_user_id
        ));
        
        // Followers count
        $followers_table = $wpdb->prefix . 'focus_follows';
        $follower_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $followers_table WHERE author_id = %d",
            $current_user_id
        ));
        
        // Top articles (by views)
        $top_articles = $wpdb->get_results($wpdb->prepare(
            "SELECT p.ID, p.post_title, p.post_name as slug, p.post_date,
                    COALESCE(pm.meta_value, 0) as views
             FROM {$wpdb->posts} p
             LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = 'post_views_count'
             WHERE p.post_author = %d AND p.post_status = 'publish' AND p.post_type = 'post'
             ORDER BY CAST(COALESCE(pm.meta_value, 0) AS UNSIGNED) DESC
             LIMIT 5",
            $current_user_id
        ));
        
        $top = [];
        foreach ($top_articles as $article) {
            $top[] = [
                'id' => (int) $article->ID,
                'title' => $article->post_title,
                'slug' => $article->slug,
                'date' => $article->post_date,
                'views' => (int) $article->views,
                'reading_time' => (int) get_field('reading_time', $article->ID) ?: 1,
            ];
        }
        
        return rest_ensure_response([
            'published_count' => (int) $published_count,
            'draft_count' => (int) $draft_count,
            'total_views' => (int) $total_views,
            'follower_count' => (int) $follower_count,
            'top_articles' => $top,
        ]);
    }
}
```

---

## 8️⃣ Newsletter Endpoint

```php
<?php
// class-focus-newsletter.php

class Focus_Newsletter {
    
    const NAMESPACE = 'focus/v1';
    
    public function register_routes() {
        // POST /focus/v1/newsletter/subscribe
        register_rest_route(self::NAMESPACE, '/newsletter/subscribe', [
            'methods' => 'POST',
            'callback' => [$this, 'subscribe'],
            'permission_callback' => '__return_true',
            'args' => [
                'email' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_email',
                    'validate_callback' => 'is_email',
                ],
            ],
        ]);
    }
    
    /**
     * POST /focus/v1/newsletter/subscribe
     */
    public function subscribe($request) {
        global $wpdb;
        
        $email = $request->get_param('email');
        $table = $wpdb->prefix . 'focus_newsletter';
        
        // Check if already subscribed
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id, status FROM $table WHERE email = %s",
            $email
        ));
        
        if ($existing) {
            if ($existing->status === 'active') {
                return rest_ensure_response([
                    'success' => true,
                    'message' => 'Email sudah terdaftar di newsletter.',
                ]);
            }
            
            // Re-subscribe
            $wpdb->update($table, [
                'status' => 'active',
                'subscribed_at' => current_time('mysql'),
                'unsubscribed_at' => null,
            ], ['id' => $existing->id], ['%s', '%s', null], ['%d']);
            
            return rest_ensure_response([
                'success' => true,
                'message' => 'Berhasil subscribe kembali ke newsletter!',
            ]);
        }
        
        // New subscription
        $result = $wpdb->insert($table, [
            'email' => $email,
            'status' => 'active',
            'subscribed_at' => current_time('mysql'),
        ], ['%s', '%s', '%s']);
        
        if ($result === false) {
            return new WP_Error(
                'subscribe_failed',
                'Gagal subscribe. Silakan coba lagi.',
                ['status' => 500]
            );
        }
        
        return rest_ensure_response([
            'success' => true,
            'message' => 'Berhasil subscribe ke newsletter Focus!',
        ]);
    }
}
```

---

## 9️⃣ Testing

### Test Script

```bash
#!/bin/bash
# test-custom-api.sh

API="https://api.focus.com/wp-json"

echo "=== Testing Focus Custom Endpoints ==="

# Login first
echo "1. Login..."
TOKEN=$(curl -s -X POST $API/jwt-auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{"username":"writer","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token','FAILED'))")
echo "   Token: ${TOKEN:0:30}..."

# Test public endpoints
echo "2. Featured articles:"
curl -s $API/focus/v1/featured | python3 -m json.tool | head -5

echo "3. Related articles (post 1):"
curl -s $API/focus/v1/related/1 | python3 -m json.tool | head -5

echo "4. Popular authors:"
curl -s $API/focus/v1/authors/popular | python3 -m json.tool | head -5

# Test authenticated endpoints
echo "5. My drafts:"
curl -s $API/focus/v1/my-drafts \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -5

echo "6. My stats:"
curl -s $API/focus/v1/my-stats \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo "7. Follow author (ID 2):"
curl -s -X POST $API/focus/v1/follow/2 \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo "8. Following list:"
curl -s $API/focus/v1/following \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo "9. Newsletter subscribe:"
curl -s -X POST $API/focus/v1/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | python3 -m json.tool

echo "=== Done ==="
```

---

## ✅ Checklist

- [ ] Directory `wp-content/mu-plugins/focus-api/` dibuat
- [ ] Semua class files sudah di-copy
- [ ] `focus-api.php` loader ada di `mu-plugins/`
- [ ] Custom tables `wp_focus_follows` dan `wp_focus_newsletter` terbuat
- [ ] Registration endpoint berfungsi (POST /focus/v1/register)
- [ ] Featured articles menampilkan post dengan `featured_article = true`
- [ ] Follow/Unfollow berfungsi dengan JWT auth
- [ ] My-drafts hanya menampilkan draft user yang login
- [ ] My-stats mengembalikan statistik yang benar
- [ ] Newsletter subscribe menyimpan email ke database
- [ ] Semua input di-sanitize dan divalidasi
- [ ] Error responses konsisten format `{ code, message, status }`

---

**Selanjutnya**: [06. User Roles & Permissions →](./06-user-roles-permissions.md)
