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

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        break;
}
