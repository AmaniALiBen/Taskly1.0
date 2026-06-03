<?php
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$db     = getDB();

switch ($action) {

    // ── GET BUYER'S ORDERS ────────────────────────────────────
    case 'my_orders':
        $buyer_id = $_SESSION['user_id'] ?? 0;

        if ($buyer_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }

        $stmt = $db->prepare("
            SELECT
                o.id,
                o.status,
                o.deadline,
                o.started_at,
                o.requirements_text,
                o.left_revisions,
                g.title        as gig_title,
                (SELECT CONCAT('/Taskly/uploads/gig-images/', gi.id, '.', gi.extension)
                 FROM gig_images gi
                 WHERE gi.gig_id = g.id
                 ORDER BY gi.is_cover DESC LIMIT 1) as gig_image,
                u.name         as seller_name,
                CONCAT('/Taskly/avatars/sellers/', u.picture_name) as seller_avatar
            FROM orders o
            JOIN gig_packages gp ON gp.id    = o.package_id
            JOIN gigs g          ON g.id     = gp.gig_id
            JOIN users u         ON u.id     = o.seller_id
            WHERE o.buyer_id = ?
            ORDER BY o.id DESC
        ");
        $stmt->execute([$buyer_id]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $orders]);
        break;

    // ── GET SELLER'S ORDERS ───────────────────────────────────
    case 'seller_orders':
        $seller_id = $_SESSION['user_id'] ?? 0;

        if ($seller_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }

        $stmt = $db->prepare("
            SELECT
                o.id,
                o.status,
                o.deadline,
                o.started_at,
                o.requirements_text,
                o.left_revisions,
                g.title        as gig_title,
                (SELECT CONCAT('/Taskly/uploads/gig-images/', gi.id, '.', gi.extension)
                 FROM gig_images gi
                 WHERE gi.gig_id = g.id
                 ORDER BY gi.is_cover DESC LIMIT 1) as gig_image,
                u.name         as buyer_name,
                CONCAT('/Taskly/avatars/buyers/', u.picture_name) as buyer_avatar,
                gp.price
            FROM orders o
            JOIN gig_packages gp ON gp.id    = o.package_id
            JOIN gigs g          ON g.id     = gp.gig_id
            JOIN users u         ON u.id     = o.buyer_id
            WHERE o.seller_id = ?
            ORDER BY o.id DESC
        ");
        $stmt->execute([$seller_id]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $orders]);
        break;

    // ── CREATE ORDER AFTER PAYMENT ────────────────────────────
    case 'create':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $buyer_id = $_SESSION['user_id'] ?? 0;
        $gigId = $input['gig_id'] ?? 0;
        $packageId = $input['package_id'] ?? 0;
        $sellerId = $input['seller_id'] ?? 0;
        $amount = $input['amount'] ?? 0;
        $paymentMethod = $input['payment_method'] ?? 'wallet';
        
        if ($buyer_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        if ($gigId <= 0 || $packageId <= 0 || $sellerId <= 0 || $amount <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid order data']);
            break;
        }
        
        // جلب عدد المراجعات المسموحة من الباقة
        $stmt = $db->prepare("SELECT revisions_allowed, delivery_time_days FROM gig_packages WHERE id = ?");
        $stmt->execute([$packageId]);
        $package = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $revisionsAllowed = $package ? $package['revisions_allowed'] : 2;
        
        // ✅ تم إزالة created_at من الاستعلام (لأن العمود غير موجود)
        $query = "INSERT INTO orders (
            buyer_id, seller_id, package_id, status, left_revisions, 
            started_at, deadline
        ) VALUES (?, ?, ?, 'awaiting_requirements', ?, NULL, NULL)";
        
        $stmt = $db->prepare($query);
        $result = $stmt->execute([$buyer_id, $sellerId, $packageId, $revisionsAllowed]);
        
        if ($result) {
            $orderId = $db->lastInsertId();
            echo json_encode([
                'success' => true, 
                'message' => 'Order created successfully',
                'order_id' => $orderId
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create order']);
        }
        break;

    // ── SUBMIT REQUIREMENTS ───────────────────────────────────
    case 'submit_requirements':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $buyer_id = $_SESSION['user_id'] ?? 0;
        $orderId = $input['order_id'] ?? 0;
        $requirementsText = trim($input['requirements_text'] ?? '');
        
        if ($buyer_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        if ($orderId <= 0 || empty($requirementsText)) {
            echo json_encode(['success' => false, 'message' => 'Order ID and requirements are required']);
            break;
        }
        
        // التحقق من أن الطلب يخص هذا المستخدم
        $stmt = $db->prepare("
            SELECT o.*, gp.delivery_time_days 
            FROM orders o 
            JOIN gig_packages gp ON o.package_id = gp.id 
            WHERE o.id = ? AND o.buyer_id = ?
        ");
        $stmt->execute([$orderId, $buyer_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'Order not found']);
            break;
        }
        
        if ($order['status'] !== 'awaiting_requirements') {
            echo json_encode(['success' => false, 'message' => 'Requirements already submitted']);
            break;
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
        $stmt = $db->prepare($update);
        $result = $stmt->execute([$requirementsText, $startedAt, $deadline, $orderId]);
        
        if ($result) {
            echo json_encode([
                'success' => true, 
                'message' => 'Requirements submitted successfully',
                'started_at' => $startedAt,
                'deadline' => $deadline
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to submit requirements']);
        }
        break;

    // ── GET SINGLE ORDER DETAILS ──────────────────────────────
    case 'get_order':
        $orderId = $_GET['order_id'] ?? 0;
        $userId = $_SESSION['user_id'] ?? 0;
        
        if ($userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        if ($orderId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid order ID']);
            break;
        }
        
        $stmt = $db->prepare("
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
        $stmt->execute([$orderId, $userId, $userId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($order) {
            echo json_encode(['success' => true, 'order' => $order]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Order not found']);
        }
        break;

    // ── UPDATE ORDER STATUS ───────────────────────────────────
    case 'update_status':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $_SESSION['user_id'] ?? 0;
        $orderId = $input['order_id'] ?? 0;
        $newStatus = $input['status'] ?? '';
        
        if ($userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        $allowedStatuses = ['in_progress', 'delivered', 'in_revision', 'completed', 'cancelled'];
        if (!in_array($newStatus, $allowedStatuses)) {
            echo json_encode(['success' => false, 'message' => 'Invalid status']);
            break;
        }
        
        $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $result = $stmt->execute([$newStatus, $orderId]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Status updated']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update status']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        break;
}
?>