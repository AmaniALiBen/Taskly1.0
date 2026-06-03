<?php
require_once __DIR__ . '/../config/db.php';

class Gig {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    // =========================================================================
    // 1. GIGS
    // =========================================================================

    public function create($seller_id, $sub_category_id, $title, $description) {
        $stmt = $this->db->prepare(
            "INSERT INTO gigs (seller_id, sub_category_id, title, description, is_active, is_deleted)
             VALUES (?, ?, ?, ?, TRUE, FALSE)"
        );
        if ($stmt->execute([$seller_id, $sub_category_id, $title, $description])) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function update($id, $sub_category_id, $title, $description, $is_active) {
        $stmt = $this->db->prepare(
            "UPDATE gigs
             SET sub_category_id = ?, title = ?, description = ?, is_active = ?
             WHERE id = ? AND is_deleted = FALSE"
        );
        return $stmt->execute([$sub_category_id, $title, $description, $is_active ? 1 : 0, $id]);
    }

    public function delete($id) {
        $stmt = $this->db->prepare("UPDATE gigs SET is_deleted = TRUE WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM gigs WHERE id = ? AND is_deleted = FALSE");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function toggleStatus($id, $is_active) {
        $stmt = $this->db->prepare(
            "UPDATE gigs SET is_active = ? WHERE id = ? AND is_deleted = FALSE"
        );
        return $stmt->execute([$is_active ? 1 : 0, $id]);
    }

    // =========================================================================
    // 2. PACKAGES
    // =========================================================================

    public function addPackage($gig_id, $package_type, $price, $delivery_time_days, $revisions_allowed) {
        $stmt = $this->db->prepare(
            "INSERT INTO gig_packages (gig_id, package_type, price, delivery_time_days, revisions_allowed)
             VALUES (?, ?, ?, ?, ?)"
        );
        if ($stmt->execute([$gig_id, $package_type, $price, $delivery_time_days, $revisions_allowed])) {
            return $this->db->lastInsertId();
        }
        return false;
    }
// =========================================================================
// UPDATE SELLER LEVEL BASED ON AVERAGE GIGS RATING ONLY
// =========================================================================
public function updateSellerLevel($seller_id) {
    try {
        // حساب متوسط تقييمات جميع خدمات البائع
        $stmt = $this->db->prepare("
            SELECT 
                AVG(g.rating) as avg_rating
            FROM gigs g
            WHERE g.seller_id = ? AND g.is_deleted = FALSE
        ");
        $stmt->execute([$seller_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $avgRating = $result['avg_rating'] ? round($result['avg_rating']) : 0;
        
        // تحديد المستوى بناءً على متوسط التقييمات فقط
        $newLevel = 'raising star';
        
        if ($avgRating == 5) {
            $newLevel = 'pro';
        } elseif ($avgRating >= 3) {
            $newLevel = 'top rated';
        } else {
            $newLevel = 'raising star';
        }
        
        // تحديث مستوى البائع في جدول seller_details
        $stmt = $this->db->prepare("
            UPDATE seller_details 
            SET level = ? 
            WHERE seller_id = ?
        ");
        $stmt->execute([$newLevel, $seller_id]);
        
        return [
            'success' => true,
            'new_level' => $newLevel,
            'avg_rating' => $avgRating
        ];
        
    } catch (PDOException $e) {
        error_log("Error updating seller level: " . $e->getMessage());
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

    public function updatePackage($gig_id, $package_type, $price, $delivery_time_days, $revisions_allowed) {
        $stmt = $this->db->prepare(
            "UPDATE gig_packages
             SET price = ?, delivery_time_days = ?, revisions_allowed = ?
             WHERE gig_id = ? AND package_type = ?"
        );
        return $stmt->execute([$price, $delivery_time_days, $revisions_allowed, $gig_id, $package_type]);
    }

    public function getPackagesByGigId($gig_id) {
        $stmt = $this->db->prepare("SELECT * FROM gig_packages WHERE gig_id = ?");
        $stmt->execute([$gig_id]);
        return $stmt->fetchAll();
    }

    // =========================================================================
    // 3. PACKAGE FEATURES
    // =========================================================================

    public function addFeatures($package_id, array $features) {
        $stmt = $this->db->prepare(
            "INSERT INTO package_features (package_id, feature_text) VALUES (?, ?)"
        );
        foreach ($features as $feature) {
            $feature = trim($feature);
            if ($feature !== '') $stmt->execute([$package_id, $feature]);
        }
    }

    public function updateFeatures($gig_id, $package_type, array $features) {
        $stmt = $this->db->prepare(
            "SELECT id FROM gig_packages WHERE gig_id = ? AND package_type = ?"
        );
        $stmt->execute([$gig_id, $package_type]);
        $package = $stmt->fetch();
        if (!$package) return false;

        $package_id = $package['id'];
        $this->db->prepare("DELETE FROM package_features WHERE package_id = ?")->execute([$package_id]);

        $insertStmt = $this->db->prepare(
            "INSERT INTO package_features (package_id, feature_text) VALUES (?, ?)"
        );
        foreach ($features as $feature) {
            $feature = trim($feature);
            if ($feature !== '') $insertStmt->execute([$package_id, $feature]);
        }
        return true;
    }

    // =========================================================================
    // 4. IMAGES
    // =========================================================================

    public function uploadGigImage($gig_id, $file, $is_cover = false) {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExtensions)) return false;

        $finfo        = finfo_open(FILEINFO_MIME_TYPE);
        $realMimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($realMimeType, $allowedMimeTypes)) return false;
        if ($file['size'] > 5 * 1024 * 1024) return false;

        $stmt = $this->db->prepare(
            "INSERT INTO gig_images (is_cover, gig_id, extension, uploaded_at) VALUES (?, ?, ?, NOW(6))"
        );
        $stmt->execute([$is_cover ? 1 : 0, $gig_id, $ext]);
        $imageId = $this->db->lastInsertId();
        if (!$imageId) return false;

        $targetDir = __DIR__ . '/../uploads/gig-images/';
        if (!file_exists($targetDir)) mkdir($targetDir, 0755, true);

        $targetFilePath = $targetDir . $imageId . '.' . $ext;
        if (move_uploaded_file($file['tmp_name'], $targetFilePath)) return $imageId;

        $this->db->prepare("DELETE FROM gig_images WHERE id = ?")->execute([$imageId]);
        return false;
    }

    public function getImagesByGigId($gig_id) {
        $stmt = $this->db->prepare(
            "SELECT * FROM gig_images WHERE gig_id = ? ORDER BY is_cover DESC, id ASC"
        );
        $stmt->execute([$gig_id]);
        return $stmt->fetchAll();
    }

    public function deleteImage($image_id) {
        $stmt = $this->db->prepare("SELECT * FROM gig_images WHERE id = ?");
        $stmt->execute([$image_id]);
        $image = $stmt->fetch();
        if ($image) {
            $filePath = __DIR__ . '/../uploads/gig-images/' . $image['id'] . '.' . $image['extension'];
            if (file_exists($filePath)) unlink($filePath);
            $this->db->prepare("DELETE FROM gig_images WHERE id = ?")->execute([$image_id]);
            return true;
        }
        return false;
    }

    // =========================================================================
    // 5. DASHBOARD & EDIT
    // =========================================================================

    public function getSellerGigs($seller_id) {
        $stmt = $this->db->prepare("
            SELECT
                g.id, g.title, g.description, g.is_active,
                (SELECT MIN(price) FROM gig_packages WHERE gig_id = g.id) as price,
                c.name as category_name,
                (SELECT CONCAT('/Taskly/uploads/gig-images/', gi.id, '.', gi.extension)
                 FROM gig_images gi WHERE gi.gig_id = g.id
                 ORDER BY gi.is_cover DESC, gi.id ASC LIMIT 1) as image
            FROM gigs g
            JOIN sub_categories sc ON sc.id = g.sub_category_id
            JOIN categories c ON c.id = sc.category_id
            WHERE g.seller_id = ? AND g.is_deleted = 0
            ORDER BY g.id DESC
        ");
        $stmt->execute([$seller_id]);
        return $stmt->fetchAll();
    }

    public function getCompleteGigForEdit($gig_id) {
        $stmt = $this->db->prepare("
            SELECT g.*, sc.name as sub_category_name, c.id as category_id, c.name as category_name
            FROM gigs g
            JOIN sub_categories sc ON sc.id = g.sub_category_id
            JOIN categories c ON c.id = sc.category_id
            WHERE g.id = ? AND g.is_deleted = 0
        ");
        $stmt->execute([$gig_id]);
        $gig = $stmt->fetch();
        if (!$gig) return null;

        $packagesStmt = $this->db->prepare("SELECT * FROM gig_packages WHERE gig_id = ?");
        $packagesStmt->execute([$gig_id]);
        $packages = $packagesStmt->fetchAll();

        $formattedPackages = [];
        foreach ($packages as $pkg) {
            $type        = $pkg['package_type'];
            $featuresStmt = $this->db->prepare(
                "SELECT feature_text FROM package_features WHERE package_id = ? ORDER BY id ASC"
            );
            $featuresStmt->execute([$pkg['id']]);
            $features    = $featuresStmt->fetchAll(PDO::FETCH_COLUMN);
            $isUnlimited = (int)$pkg['revisions_allowed'] >= 999;
            $formattedPackages[$type] = [
                'price'    => (float)$pkg['price'],
                'delivery' => (int)$pkg['delivery_time_days'],
                'unit'     => 'days',
                'revs'     => $isUnlimited ? 0 : (int)$pkg['revisions_allowed'],
                'revType'  => $isUnlimited ? 'unlimited' : 'limited',
                'features' => $features
            ];
        }

        $imagesStmt = $this->db->prepare("
            SELECT CONCAT('/Taskly/uploads/gig-images/', id, '.', extension) as url
            FROM gig_images WHERE gig_id = ? ORDER BY is_cover DESC, id ASC
        ");
        $imagesStmt->execute([$gig_id]);
        $images = $imagesStmt->fetchAll(PDO::FETCH_COLUMN);

        return [
            'id'              => $gig['id'],
            'title'           => $gig['title'],
            'description'     => $gig['description'],
            'category_id'     => $gig['category_id'],
            'sub_category_id' => $gig['sub_category_id'],
            'images'          => $images,
            'basic'           => $formattedPackages['basic']    ?? null,
            'standard'        => $formattedPackages['standard'] ?? null,
            'premium'         => $formattedPackages['premium']  ?? null
        ];
    }

    // =========================================================================
    // 6. PUBLIC GIGS FOR HOMEPAGE & GIGS PAGE
    // =========================================================================

    public function getPublicGigs($limit = 8) {
        $limit = (int)$limit;
        if ($limit < 1) $limit = 8;

        $stmt = $this->db->prepare("
            SELECT
                g.id, g.title, g.description,
                COALESCE((SELECT MIN(price) FROM gig_packages WHERE gig_id = g.id), 0) as price,
                c.id as category_id, c.name as category,
                sc.id as sub_category_id, sc.name as sub_category,
                u.name as freelancer,
                CONCAT('/Taskly/avatars/sellers/', u.picture_name) as avatar,
                sd.level as seller_level,
                (SELECT CONCAT('/Taskly/uploads/gig-images/', gi.id, '.', gi.extension)
                 FROM gig_images gi WHERE gi.gig_id = g.id
                 ORDER BY gi.is_cover DESC LIMIT 1) as image,
                COALESCE(g.rating, 0) as rating
            FROM gigs g
            JOIN sub_categories sc ON sc.id = g.sub_category_id
            JOIN categories c ON c.id = sc.category_id
            JOIN users u ON u.id = g.seller_id
            JOIN seller_details sd ON sd.seller_id = g.seller_id
            WHERE g.is_active = 1 AND g.is_deleted = 0
            ORDER BY g.rating DESC, g.id DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =========================================================================
    // 7. GIG DETAILS PAGE
    // =========================================================================

   public function getPublicGigDetails($gig_id) {
    $stmt = $this->db->prepare("
        SELECT
            g.id, g.title, g.description,
            g.seller_id,
            u.name as seller_name,
            CONCAT('/Taskly/avatars/sellers/', u.picture_name) as avatar,
            sd.level as seller_level,
            COALESCE(g.rating, 0) as rating,
            (
                SELECT COUNT(DISTINCT o.id)
                FROM orders o
                JOIN gig_packages gp ON o.package_id = gp.id
                WHERE gp.gig_id = g.id 
                AND o.status = 'completed' 
                AND o.rating_score IS NOT NULL
            ) as review_count
        FROM gigs g
        JOIN users u ON u.id = g.seller_id
        JOIN seller_details sd ON sd.seller_id = g.seller_id
        WHERE g.id = ? AND g.is_active = 1 AND g.is_deleted = 0
    ");
    $stmt->execute([$gig_id]);
    $gig = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$gig) return null;

    $packagesStmt = $this->db->prepare("
        SELECT * FROM gig_packages
        WHERE gig_id = ?
        ORDER BY FIELD(package_type, 'basic', 'standard', 'premium')
    ");
    $packagesStmt->execute([$gig_id]);
    $packages = $packagesStmt->fetchAll();

    $formattedPackages = [];
    foreach ($packages as $pkg) {
        $type = $pkg['package_type'];

        $featuresStmt = $this->db->prepare(
            "SELECT feature_text FROM package_features WHERE package_id = ? ORDER BY id ASC"
        );
        $featuresStmt->execute([$pkg['id']]);
        $features    = $featuresStmt->fetchAll(PDO::FETCH_COLUMN);
        $isUnlimited = (int)$pkg['revisions_allowed'] >= 999;

        $days     = (int)$pkg['delivery_time_days'];
        $delivery = $days === 1 ? '1 Day Delivery' : "{$days} Days Delivery";

        $revisions = $isUnlimited
            ? 'Unlimited Revisions'
            : ((int)$pkg['revisions_allowed'] === 0
                ? 'No Revisions'
                : $pkg['revisions_allowed'] . ' Revision' . ($pkg['revisions_allowed'] > 1 ? 's' : ''));

        $formattedPackages[$type] = [
            'id'        => (int)$pkg['id'],
            'name'      => ucfirst($type),
            'price'     => (float)$pkg['price'],
            'desc'      => '',
            'delivery'  => $delivery,
            'revisions' => $revisions,
            'features'  => $features
        ];
    }

    $imagesStmt = $this->db->prepare("
        SELECT CONCAT('/Taskly/uploads/gig-images/', id, '.', extension) as url
        FROM gig_images WHERE gig_id = ? ORDER BY is_cover DESC, id ASC
    ");
    $imagesStmt->execute([$gig_id]);
    $images = $imagesStmt->fetchAll(PDO::FETCH_COLUMN);

    $levelMap = [
        'raising star' => 1,
        'top rated'    => 2,
        'pro'          => 3
    ];

    return [
        'id'             => (int)$gig['id'],
        'title'          => $gig['title'],
        'desc'           => $gig['description'],
        'sellerId'       => (int)$gig['seller_id'],
        'seller'         => $gig['seller_name'],
        'avatar'          => $gig['avatar'] ?? null,
        'sellerLevel'    => $levelMap[$gig['seller_level']] ?? 1,
        'gigRating'      => (float)$gig['rating'],
        'gigReviewCount' => (int)$gig['review_count'],
        'images'         => $images,
        'packages'       => $formattedPackages
    ];
}
    // =========================================================================
    // 8. REPORTS
    // =========================================================================

    public function submitReport($gig_id, $reporter_id, $reason) {
        $checkStmt = $this->db->prepare(
            "SELECT id FROM reports WHERE gig_id = ? AND reporter_id = ?"
        );
        $checkStmt->execute([$gig_id, $reporter_id]);
        if ($checkStmt->fetch()) return 'already_reported';

        $stmt = $this->db->prepare(
            "INSERT INTO reports (gig_id, reporter_id, reason, is_resolved)
             VALUES (?, ?, ?, 0)"
        );
        return $stmt->execute([$gig_id, $reporter_id, $reason]) ? 'ok' : 'error';
    }
    
    // =========================================================================
// 9. SELLER PROFILE PAGE
// =========================================================================

public function getSellerProfile($seller_id) {
    $stmt = $this->db->prepare("
        SELECT
            u.id, u.name, u.email,
            CONCAT('/Taskly/avatars/sellers/', u.picture_name) as avatar,
            sd.about_me, sd.experience, sd.level,
            co.name as country,
            COALESCE(AVG(g.rating), 0) as rating,
            COUNT(DISTINCT g.id) as total_gigs
        FROM users u
        JOIN seller_details sd ON sd.seller_id = u.id
       LEFT JOIN countries co ON co.id = sd.country_id
        LEFT JOIN gigs g ON g.seller_id = u.id AND g.is_deleted = 0
        WHERE u.id = ? AND u.is_deleted = 0
        GROUP BY u.id
    ");
    $stmt->execute([$seller_id]);
    $seller = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$seller) return null;

    // Get languages
    $langStmt = $this->db->prepare("
        SELECT l.name FROM seller_languages sl
        JOIN languages l ON l.id = sl.language_id
        WHERE sl.seller_id = ?
    ");
    $langStmt->execute([$seller_id]);
    $seller['languages'] = $langStmt->fetchAll(PDO::FETCH_COLUMN);

    return $seller;
}

public function getPublicSellerGigs($seller_id, $limit = 10) {
    $limit = (int)$limit;
    $stmt = $this->db->prepare("
        SELECT
            g.id, g.title,
            COALESCE((SELECT MIN(price) FROM gig_packages WHERE gig_id = g.id), 0) as price,
            c.name as category,
            COALESCE(g.rating, 0) as rating,
            (SELECT CONCAT('/Taskly/uploads/gig-images/', gi.id, '.', gi.extension)
             FROM gig_images gi WHERE gi.gig_id = g.id
             ORDER BY gi.is_cover DESC LIMIT 1) as image
        FROM gigs g
        JOIN sub_categories sc ON sc.id = g.sub_category_id
        JOIN categories c ON c.id = sc.category_id
        WHERE g.seller_id = ? AND g.is_active = 1 AND g.is_deleted = 0
        ORDER BY g.id DESC
        LIMIT ?
    ");
    $stmt->bindValue(1, $seller_id, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit,     PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
}
?>