<?php
require_once __DIR__ . '/../config/db.php';

class Order {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    // =========================================================================
    // 1. BUYER ORDERS
    // =========================================================================

    public function getBuyerOrders($buyer_id) {
        $stmt = $this->db->prepare("
            SELECT
                o.id,
                o.status,
                o.deadline,
                o.started_at,
                g.title as gig_title,
                (SELECT CONCAT('/Taskly/uploads/gig-images/', gi.id, '.', gi.extension)
                 FROM gig_images gi
                 WHERE gi.gig_id = g.id
                 ORDER BY gi.is_cover DESC LIMIT 1) as gig_image,
                u.name as seller_name,
                CONCAT('/Taskly/avatars/sellers/', u.picture_name) as seller_avatar
            FROM orders o
            JOIN gig_packages gp ON gp.id = o.package_id
            JOIN gigs g          ON g.id  = gp.gig_id
            JOIN users u         ON u.id  = o.seller_id
            WHERE o.buyer_id = ?
            ORDER BY o.id DESC
        ");
        $stmt->execute([$buyer_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =========================================================================
    // 2. SELLER ORDERS
    // =========================================================================

    public function getSellerOrders($seller_id) {
        $stmt = $this->db->prepare("
            SELECT
                o.id,
                o.status,
                o.deadline,
                o.started_at,
                g.title as gig_title,
                (SELECT CONCAT('/Taskly/uploads/gig-images/', gi.id, '.', gi.extension)
                 FROM gig_images gi
                 WHERE gi.gig_id = g.id
                 ORDER BY gi.is_cover DESC LIMIT 1) as gig_image,
                u.name as buyer_name,
                CONCAT('/Taskly/avatars/buyers/', u.picture_name) as buyer_avatar
            FROM orders o
            JOIN gig_packages gp ON gp.id = o.package_id
            JOIN gigs g          ON g.id  = gp.gig_id
            JOIN users u         ON u.id  = o.buyer_id
            WHERE o.seller_id = ?
            ORDER BY o.id DESC
        ");
        $stmt->execute([$seller_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
