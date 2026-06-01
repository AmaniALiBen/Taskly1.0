CREATE TABLE IF NOT EXISTS SellerProfiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    country VARCHAR(100) NOT NULL,
    experience TEXT NOT NULL,
    about_me TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Gigs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    category_id INT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    delivery_days INT NOT NULL DEFAULT 1,
    revisions INT DEFAULT 0,
    status ENUM('draft', 'active', 'paused', 'pending_review', 'rejected') DEFAULT 'draft',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES SellerProfiles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS GigPackages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gig_id INT NOT NULL,
    package_type ENUM('basic', 'standard', 'premium') NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    delivery_days INT NOT NULL,
    revisions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (gig_id) REFERENCES Gigs(id) ON DELETE CASCADE,
    UNIQUE (gig_id, package_type)
);

CREATE TABLE IF NOT EXISTS GigPackageFeatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    feature_text VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (package_id) REFERENCES GigPackages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS GigImages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gig_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    is_cover BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gig_id) REFERENCES Gigs(id) ON DELETE CASCADE
);
