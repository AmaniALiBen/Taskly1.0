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
                o.requirements_text,
                o.left_revisions,
                g.title as gig_title,
                (SELECT CONCAT('/Taskly/uploads/gig-images/', gi.id, '.', gi.extension)
                 FROM gig_images gi
                 WHERE gi.gig_id = g.id
                 ORDER BY gi.is_cover DESC LIMIT 1) as gig_image,
                u.name as seller_name,
                CONCAT('/Taskly/avatars/sellers/', u.picture_name) as seller_avatar,
                gp.price
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
                o.requirements_text,
                o.left_revisions,
                g.title as gig_title,
                (SELECT CONCAT('/Taskly/uploads/gig-images/', gi.id, '.', gi.extension)
                 FROM gig_images gi
                 WHERE gi.gig_id = g.id
                 ORDER BY gi.is_cover DESC LIMIT 1) as gig_image,
                u.name as buyer_name,
                CONCAT('/Taskly/avatars/buyers/', u.picture_name) as buyer_avatar,
                gp.price
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

    // =========================================================================
    // 3. CREATE ORDER AFTER PAYMENT
    // =========================================================================
    public function createOrder($buyer_id, $seller_id, $package_id) {
        // جلب عدد المراجعات المسموحة من الباقة
        $stmt = $this->db->prepare("SELECT revisions_allowed, delivery_time_days FROM gig_packages WHERE id = ?");
        $stmt->execute([$package_id]);
        $package = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $revisionsAllowed = $package ? $package['revisions_allowed'] : 2;
        
        $query = "INSERT INTO orders (
            buyer_id, seller_id, package_id, status, left_revisions, 
            started_at, deadline
        ) VALUES (?, ?, ?, 'awaiting_requirements', ?, NULL, NULL)";
        
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute([$buyer_id, $seller_id, $package_id, $revisionsAllowed]);
        
        if ($result) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    // =========================================================================
    // 4. SUBMIT REQUIREMENTS
    // =========================================================================
    public function submitRequirements($order_id, $buyer_id, $requirements_text) {
        // التحقق من أن الطلب يخص هذا المستخدم
        $stmt = $this->db->prepare("
            SELECT o.*, gp.delivery_time_days 
            FROM orders o 
            JOIN gig_packages gp ON o.package_id = gp.id 
            WHERE o.id = ? AND o.buyer_id = ?
        ");
        $stmt->execute([$order_id, $buyer_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) {
            return ['success' => false, 'message' => 'Order not found'];
        }
        
        if ($order['status'] !== 'awaiting_requirements') {
            return ['success' => false, 'message' => 'Requirements already submitted'];
        }
        
        // حساب deadline = now + delivery_time_days
        $deliveryDays = $order['delivery_time_days'];
        $startedAt = date('Y-m-d H:i:s');
        $deadline = date('Y-m-d H:i:s', strtotime("+{$deliveryDays} days"));
        
        $update = "UPDATE orders 
                   SET requirements_text = ?, 
                       status = 'in_progress', 
                       started_at = ?, 
                       deadline = ? 
                   WHERE id = ?";
        $stmt = $this->db->prepare($update);
        $result = $stmt->execute([$requirements_text, $startedAt, $deadline, $order_id]);
        
        if ($result) {
            return [
                'success' => true, 
                'started_at' => $startedAt, 
                'deadline' => $deadline
            ];
        }
        return ['success' => false, 'message' => 'Failed to submit requirements'];
    }

    // =========================================================================
    // 5. GET SINGLE ORDER DETAILS
    // =========================================================================
    public function getOrderDetails($order_id, $user_id) {
        $stmt = $this->db->prepare("
            SELECT 
                o.*,
                g.title as gig_title,
                gp.package_type,
                gp.price,
                gp.delivery_time_days,
                gp.revisions_allowed,
                buyer.name as buyer_name,
                buyer.picture_name as buyer_picture,
                seller.name as seller_name,
                seller.picture_name as seller_picture
            FROM orders o
            JOIN gig_packages gp ON o.package_id = gp.id
            JOIN gigs g ON gp.gig_id = g.id
            JOIN users buyer ON o.buyer_id = buyer.id
            JOIN users seller ON o.seller_id = seller.id
            WHERE o.id = ? AND (o.buyer_id = ? OR o.seller_id = ?)
        ");
        $stmt->execute([$order_id, $user_id, $user_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // =========================================================================
    // 6. UPDATE ORDER STATUS
    // =========================================================================
    public function updateOrderStatus($order_id, $new_status) {
        $allowedStatuses = ['in_progress', 'delivered', 'in_revision', 'completed', 'cancelled'];
        if (!in_array($new_status, $allowedStatuses)) {
            return false;
        }
        
        $stmt = $this->db->prepare("UPDATE orders SET status = ? WHERE id = ?");
        return $stmt->execute([$new_status, $order_id]);
    }
}
?>