<?php
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) session_start();

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

    // ── CREATE ORDER AFTER PAYMENT ────────────────────────────
    case 'create':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $buyer_id = $_SESSION['user_id'] ?? 0;
        $gigId = $input['gig_id'] ?? 0;
        $packageId = $input['package_id'] ?? 0;
        $sellerId = $input['seller_id'] ?? 0;
        $amount = $input['amount'] ?? 0;
        
        if ($buyer_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        if ($gigId <= 0 || $packageId <= 0 || $sellerId <= 0 || $amount <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid order data']);
            break;
        }
        
        $orderId = $orderModel->createOrder($buyer_id, $sellerId, $packageId);
        
        if ($orderId) {
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
        
        $result = $orderModel->submitRequirements($orderId, $buyer_id, $requirementsText);
        echo json_encode($result);
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
        
        $order = $orderModel->getOrderDetails($orderId, $userId);
        
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
        
        $result = $orderModel->updateOrderStatus($orderId, $newStatus);
        
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