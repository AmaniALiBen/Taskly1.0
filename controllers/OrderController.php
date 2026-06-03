<?php
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Order.php';

$orderModel = new Order();
$action     = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    // ── GET BUYER'S ORDERS ────────────────────────────────────
    case 'my_orders':
        $buyer_id = $_SESSION['user_id'] ?? 0;
        if ($buyer_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        $orders = $orderModel->getBuyerOrders($buyer_id);
        echo json_encode(['success' => true, 'data' => $orders]);
        break;

    // ── GET SELLER'S ORDERS ───────────────────────────────────
    case 'seller_orders':
        $seller_id = $_SESSION['user_id'] ?? 0;
        if ($seller_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        $orders = $orderModel->getSellerOrders($seller_id);
        echo json_encode(['success' => true, 'data' => $orders]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        break;
}