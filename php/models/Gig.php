<?php
function tableExists($conn, $tableName) {
    $stmt = mysqli_prepare($conn, 'SHOW TABLES LIKE ?');
    mysqli_stmt_bind_param($stmt, 's', $tableName);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    return mysqli_num_rows($result) > 0;
}

function getPublicGigs($conn) {
    if (!tableExists($conn, 'gigs')) {
        return [];
    }

    $sql = "
        SELECT
            g.id,
            g.title,
            g.description,
            g.rating,
            COALESCE(sc.name, c.name, 'General') AS category,
            COALESCE(u.name, 'Taskly Seller') AS freelancer,
            COALESCE(u.picture_name, '') AS avatar,
            COALESCE(sd.level, 'raising star') AS seller_level,
            COALESCE(MIN(gp.price), 0) AS price,
            COALESCE(MIN(gp.delivery_time_days), 0) AS delivery_days,
            (
                SELECT CONCAT('uploads/gigs/', gi.id, '.', gi.extension)
                FROM gig_images gi
                WHERE gi.gig_id = g.id
                ORDER BY gi.is_cover DESC, gi.uploaded_at ASC, gi.id ASC
                LIMIT 1
            ) AS image
        FROM gigs g
        INNER JOIN seller_details sd ON sd.seller_id = g.seller_id
        INNER JOIN users u ON u.id = sd.seller_id
        INNER JOIN sub_categories sc ON sc.id = g.sub_category_id
        INNER JOIN categories c ON c.id = sc.category_id
        LEFT JOIN gig_packages gp ON gp.gig_id = g.id
        WHERE g.is_active = TRUE AND g.is_deleted = FALSE
        GROUP BY g.id
        ORDER BY g.id DESC
    ";

    $result = mysqli_query($conn, $sql);
    if (!$result) {
        return false;
    }

    $gigs = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $gigs[] = normalizeGigListRow($row);
    }

    return $gigs;
}

function getGigById($conn, $id) {
    if (!tableExists($conn, 'gigs')) {
        return null;
    }

    $stmt = mysqli_prepare($conn, "
        SELECT
            g.id,
            g.seller_id,
            g.title,
            g.description,
            g.rating,
            COALESCE(sc.name, c.name, 'General') AS category,
            COALESCE(u.name, 'Taskly Seller') AS freelancer,
            COALESCE(u.picture_name, '') AS avatar,
            COALESCE(sd.level, 'raising star') AS seller_level
        FROM gigs g
        INNER JOIN seller_details sd ON sd.seller_id = g.seller_id
        INNER JOIN users u ON u.id = sd.seller_id
        INNER JOIN sub_categories sc ON sc.id = g.sub_category_id
        INNER JOIN categories c ON c.id = sc.category_id
        WHERE g.id = ? AND g.is_active = TRUE AND g.is_deleted = FALSE
        LIMIT 1
    ");
    mysqli_stmt_bind_param($stmt, 'i', $id);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    $gig = mysqli_fetch_assoc($result);

    if (!$gig) {
        return null;
    }

    $gig['images'] = getGigImages($conn, $id);
    $gig['packages'] = getGigPackages($conn, $id);
    $gig['review_count'] = getGigReviewCount($conn, $id);

    return normalizeGigDetailRow($gig);
}

function getGigImages($conn, $gigId) {
    $stmt = mysqli_prepare($conn, '
        SELECT CONCAT("uploads/gigs/", id, ".", extension) AS image_path
        FROM gig_images
        WHERE gig_id = ?
        ORDER BY is_cover DESC, uploaded_at ASC, id ASC
    ');
    mysqli_stmt_bind_param($stmt, 'i', $gigId);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    $images = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $images[] = $row['image_path'];
    }

    return normalizeImages($images);
}

function getGigPackages($conn, $gigId) {
    $stmt = mysqli_prepare($conn, '
        SELECT id, package_type, price, delivery_time_days, revisions_allowed
        FROM gig_packages
        WHERE gig_id = ?
        ORDER BY FIELD(package_type, "basic", "standard", "premium")
    ');
    mysqli_stmt_bind_param($stmt, 'i', $gigId);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    $packages = [];

    while ($row = mysqli_fetch_assoc($result)) {
        $type = $row['package_type'];
        $packages[$type] = [
            'id' => (int)$row['id'],
            'name' => ucfirst($type) . ' Package',
            'price' => (float)$row['price'],
            'desc' => 'Includes the selected ' . $type . ' service package.',
            'delivery' => formatDelivery($row['delivery_time_days']),
            'revisions' => formatRevisions($row['revisions_allowed']),
            'features' => getPackageFeatures($conn, (int)$row['id'])
        ];
    }

    return $packages;
}

function getPackageFeatures($conn, $packageId) {
    $stmt = mysqli_prepare($conn, 'SELECT feature_text FROM package_features WHERE package_id = ? ORDER BY id ASC');
    mysqli_stmt_bind_param($stmt, 'i', $packageId);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    $features = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $features[] = $row['feature_text'];
    }

    return $features;
}

function getGigReviewCount($conn, $gigId) {
    $stmt = mysqli_prepare($conn, '
        SELECT COUNT(*) AS review_count
        FROM orders o
        INNER JOIN gig_packages gp ON gp.id = o.package_id
        WHERE gp.gig_id = ? AND o.rating_score IS NOT NULL
    ');
    mysqli_stmt_bind_param($stmt, 'i', $gigId);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);

    return (int)($row['review_count'] ?? 0);
}

function normalizeGigListRow($row) {
    $deliveryDays = (int)($row['delivery_days'] ?? 0);

    return [
        'id' => (int)$row['id'],
        'title' => $row['title'],
        'price' => (float)$row['price'],
        'category' => $row['category'],
        'freelancer' => $row['freelancer'],
        'avatar' => normalizeAssetPath($row['avatar'], '../images/default-avatar.jpg'),
        'image' => normalizeAssetPath($row['image'], '../images/potato.png'),
        'rating' => (float)($row['rating'] ?? 0),
        'reviewCount' => 0,
        'level' => normalizeSellerLevel($row['seller_level']),
        'delivery' => formatDeliveryCode($deliveryDays)
    ];
}

function normalizeGigDetailRow($row) {
    return [
        'id' => (int)$row['id'],
        'title' => $row['title'],
        'seller' => $row['freelancer'],
        'sellerId' => (int)$row['seller_id'],
        'sellerLevel' => sellerLevelNumber($row['seller_level']),
        'gigRating' => (float)($row['rating'] ?? 0),
        'gigReviewCount' => (int)($row['review_count'] ?? 0),
        'avatar' => normalizeAssetPath($row['avatar'], '../images/default-avatar.jpg'),
        'images' => $row['images'],
        'desc' => splitDescription($row['description']),
        'packages' => $row['packages']
    ];
}

function normalizeImages($images) {
    $cleanImages = [];
    foreach ($images as $image) {
        if (trim((string)$image) !== '') {
            $cleanImages[] = normalizeAssetPath($image, '../images/potato.png');
        }
    }

    return count($cleanImages) ? $cleanImages : ['../images/potato.png'];
}

function normalizeAssetPath($path, $fallback) {
    $path = trim((string)$path);

    if ($path === '' || $path === 'null') {
        return $fallback;
    }

    $path = str_replace('\\', '/', $path);

    if (preg_match('/^https?:\/\//', $path) || substr($path, 0, 3) === '../') {
        return $path;
    }

    return '../' . ltrim($path, '/');
}

function normalizeSellerLevel($level) {
    if ($level === 'top rated') {
        return 'top';
    }

    if ($level === 'raising star') {
        return 'rising';
    }

    return 'pro';
}

function sellerLevelNumber($level) {
    if ($level === 'top rated') {
        return 3;
    }

    if ($level === 'pro') {
        return 2;
    }

    return 1;
}

function splitDescription($description) {
    $parts = preg_split('/\r\n|\r|\n/', trim((string)$description));
    $parts = array_values(array_filter($parts, function ($part) {
        return trim($part) !== '';
    }));

    return count($parts) ? $parts : ['No description available.'];
}

function formatDelivery($days) {
    $days = (int)$days;

    if ($days <= 0) {
        return 'Flexible Delivery';
    }

    return $days . ' ' . ($days === 1 ? 'Day' : 'Days') . ' Delivery';
}

function formatDeliveryCode($days) {
    $days = (int)$days;

    if ($days <= 1) {
        return '24h';
    }

    if ($days <= 3) {
        return '3d';
    }

    return '7d';
}

function formatRevisions($revisions) {
    $revisions = (int)$revisions;

    if ($revisions < 0) {
        return 'Unlimited Revisions';
    }

    return $revisions . ' ' . ($revisions === 1 ? 'Revision' : 'Revisions');
}
?>
