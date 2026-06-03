CREATE DATABASE IF NOT EXISTS taskly
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE taskly;

-- ========================================================
-- 1. جدول الدول (تم تقديمه هنا منطقياً ليتم الربط به)
-- ========================================================
CREATE TABLE countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150)
);

-- ========================================================
-- 2. جدول المستخدمين (المشترين والبائعين)
-- ========================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('buyer', 'seller', 'admin') NOT NULL DEFAULT 'buyer',
    picture_name VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- ========================================================
-- 3. جدول تفاصيل البائعين
-- ========================================================
CREATE TABLE seller_details (
    seller_id INT PRIMARY KEY,
    country_id INT NOT NULL,
    experience VARCHAR(255) NOT NULL,
    about_me TEXT NOT NULL,
    level ENUM('raising star', 'top rated', 'pro') NOT NULL DEFAULT 'raising star',
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

-- ========================================================
-- 4. جدول اللغات واللغات الخاصة بالبائع
-- ========================================================
CREATE TABLE languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE seller_languages (
    seller_id INT,
    language_id INT,
    PRIMARY KEY (seller_id, language_id),
    FOREIGN KEY (seller_id) REFERENCES seller_details(seller_id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
);

-- ========================================================
-- 5. جداول التصنيفات والتصنيفات الفرعية
-- ========================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_url VARCHAR(255) NULL
);

CREATE TABLE sub_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ========================================================
-- 6. جدول الخدمات المعروضة (Gigs)
-- ========================================================
CREATE TABLE gigs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    sub_category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    rating INT NULL,
    FOREIGN KEY (seller_id) REFERENCES seller_details(seller_id) ON DELETE CASCADE,
    FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE RESTRICT
);

-- ========================================================
-- 7. جدول صور الخدمات المعروضة
-- ========================================================
CREATE TABLE gig_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    is_cover BOOLEAN NOT NULL,
    gig_id INT NOT NULL,
    extension VARCHAR(10) NOT NULL,
    uploaded_at DATETIME(6) NOT NULL,
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE
);

-- ========================================================
-- 8. جدول باقات الخدمة وميزاتها
-- ========================================================
CREATE TABLE gig_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gig_id INT NOT NULL,
    package_type ENUM('basic', 'standard', 'premium') NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0), 
    delivery_time_days INT NOT NULL CHECK (delivery_time_days > 0),
    revisions_allowed INT NOT NULL DEFAULT 0,
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE
);

CREATE TABLE package_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    feature_text VARCHAR(255) NOT NULL,
    FOREIGN KEY (package_id) REFERENCES gig_packages(id) ON DELETE CASCADE
);

-- ========================================================
-- 9. جدول الطلبات (Orders)
-- ========================================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    package_id INT NOT NULL,
    status ENUM('awaiting_requirements', 'in_progress', 'delivered', 'in_revision', 'completed', 'cancelled') NOT NULL DEFAULT 'awaiting_requirements',
    requirements_text TEXT NULL,
    left_revisions INT NOT NULL,
    rating_score INT NULL CHECK (rating_score BETWEEN 1 AND 5), 
    started_at DATETIME NULL,
    deadline DATETIME NULL,  
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_id) REFERENCES seller_details(seller_id) ON DELETE RESTRICT,
    FOREIGN KEY (package_id) REFERENCES gig_packages(id) ON DELETE RESTRICT
);

-- ========================================================
-- 10. جدول ملفات الطلبات
-- ========================================================
CREATE TABLE order_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    file_type ENUM('requirement', 'delivery') NOT NULL,
    extension VARCHAR(10) NOT NULL,
    uploaded_at DATETIME(6) NOT NULL,
    file_name VARCHAR(150) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ========================================================
-- 11. جدول الرسائل والمحادثات
-- ========================================================
CREATE TABLE order_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at DATETIME(6) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ========================================================
-- 12. جدول الشكاوى والبلاغات
-- ========================================================
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    sender_id INT NOT NULL,
    complaint_type VARCHAR(100) NOT NULL,
    complaint_text TEXT NOT NULL,
    status ENUM('pending', 'under_investigation', 'resolved') NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gig_id INT NOT NULL,
    reporter_id INT NOT NULL,
    reason TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ========================================================
-- 13. جدول المحفظة المالية (Wallet) لكل مستخدم
-- ========================================================
CREATE TABLE wallets (
    user_id INT PRIMARY KEY,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    wallet_pin_hash VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول تذاكر "تذكرني"
CREATE TABLE IF NOT EXISTS user_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token)
);
-- ========================================================
-- 14. الفهارس (Indexes)
-- ========================================================
CREATE INDEX idx_gigs_seller ON gigs(seller_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_messages_order ON order_messages(order_id);