<?php
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Order.php';

$db = getDB();
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
        $buyer_id = $_SESSION['user_id'] ?? 0;
        $orderId = $_POST['order_id'] ?? 0;
        $requirementsText = trim($_POST['requirements_text'] ?? '');
        
        if ($buyer_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        if ($orderId <= 0 || empty($requirementsText)) {
            echo json_encode(['success' => false, 'message' => 'Order ID and requirements are required']);
            break;
        }
        
        $result = $orderModel->submitRequirements($orderId, $buyer_id, $requirementsText);
        
        if (!$result['success']) {
            echo json_encode($result);
            break;
        }
        
        $uploadedFiles = [];
        $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/Taskly/uploads/requirement/';
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        if (isset($_FILES['requirements_files']) && !empty($_FILES['requirements_files']['name'][0])) {
            $files = $_FILES['requirements_files'];
            
            for ($i = 0; $i < count($files['name']); $i++) {
                if ($files['error'][$i] === UPLOAD_ERR_OK) {
                    $originalName = $files['name'][$i];
                    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
                    
                    $fileId = $orderModel->saveOrderFile($orderId, 'requirement', $extension, $originalName);
                    
                    if ($fileId) {
                        $timestamp = time();
                        $savedName = $fileId . '_' . $timestamp . '.' . $extension;
                        $filePath = $uploadDir . $savedName;
                        
                        if (move_uploaded_file($files['tmp_name'][$i], $filePath)) {
                            $uploadedFiles[] = [
                                'id' => $fileId,
                                'original_name' => $originalName,
                                'saved_name' => $savedName
                            ];
                        }
                    }
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Requirements submitted successfully',
            'started_at' => $result['started_at'],
            'deadline' => $result['deadline'],
            'files' => $uploadedFiles
        ]);
        break;

    // ── SUBMIT DELIVERY ───────────────────────────────────────
    case 'submit_delivery':
        $seller_id = $_SESSION['user_id'] ?? 0;
        $orderId = $_POST['order_id'] ?? 0;
        
        if ($seller_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        if ($orderId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid order ID']);
            break;
        }
        
        $stmt = $db->prepare("SELECT id FROM orders WHERE id = ? AND seller_id = ?");
        $stmt->execute([$orderId, $seller_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'Order not found']);
            break;
        }
        
        $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/Taskly/uploads/delivery/';
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $uploadedFiles = [];
        
        if (isset($_FILES['delivery_files']) && !empty($_FILES['delivery_files']['name'][0])) {
            $files = $_FILES['delivery_files'];
            
            for ($i = 0; $i < count($files['name']); $i++) {
                if ($files['error'][$i] === UPLOAD_ERR_OK) {
                    $originalName = $files['name'][$i];
                    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
                    
                    $fileId = $orderModel->saveOrderFile($orderId, 'delivery', $extension, $originalName);
                    
                    if ($fileId) {
                        $timestamp = time();
                        $savedName = $fileId . '_' . $timestamp . '.' . $extension;
                        $filePath = $uploadDir . $savedName;
                        
                        if (move_uploaded_file($files['tmp_name'][$i], $filePath)) {
                            $uploadedFiles[] = [
                                'id' => $fileId,
                                'original_name' => $originalName,
                                'saved_name' => $savedName
                            ];
                        }
                    }
                }
            }
        }
        
        $orderModel->updateOrderStatus($orderId, 'delivered');
        
        echo json_encode([
            'success' => true,
            'message' => 'Delivery submitted successfully',
            'files' => $uploadedFiles
        ]);
        break;

    // ── GET ORDER FILES ───────────────────────────────────────
    case 'get_order_files':
        $orderId = $_GET['order_id'] ?? 0;
        $fileType = $_GET['file_type'] ?? null;
        $userId = $_SESSION['user_id'] ?? 0;
        
        if ($userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        if ($orderId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid order ID']);
            break;
        }
        
        $files = $orderModel->getOrderFiles($orderId, $fileType);
        echo json_encode(['success' => true, 'files' => $files]);
        break;

    // ── DOWNLOAD ORDER FILE ───────────────────────────────────
    case 'download_file':
        $fileId = $_GET['file_id'] ?? 0;
        $userId = $_SESSION['user_id'] ?? 0;
        
        if ($userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        if ($fileId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid file ID']);
            break;
        }
        
        $stmt = $db->prepare("
            SELECT of.*, o.buyer_id, o.seller_id 
            FROM order_files of
            JOIN orders o ON of.order_id = o.id
            WHERE of.id = ? AND (o.buyer_id = ? OR o.seller_id = ?)
        ");
        $stmt->execute([$fileId, $userId, $userId]);
        $file = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$file) {
            echo json_encode(['success' => false, 'message' => 'File not found']);
            break;
        }
        
        $timestamp = strtotime($file['uploaded_at']);
        $savedName = $file['id'] . '_' . $timestamp . '.' . $file['extension'];
        $filePath = $_SERVER['DOCUMENT_ROOT'] . '/Taskly/uploads/' . $file['file_type'] . 's/' . $savedName;
        
        if (file_exists($filePath)) {
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $file['file_name'] . '"');
            header('Content-Length: ' . filesize($filePath));
            readfile($filePath);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'File not found on server']);
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

    // ── SEND MESSAGE ──────────────────────────────────────────
    case 'send_message':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $sender_id = $_SESSION['user_id'] ?? 0;
        $orderId = $input['order_id'] ?? 0;
        $content = trim($input['content'] ?? '');
        
        if ($sender_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        if ($orderId <= 0 || empty($content)) {
            echo json_encode(['success' => false, 'message' => 'Order ID and content are required']);
            break;
        }
        
        $stmt = $db->prepare("
            SELECT id FROM orders 
            WHERE id = ? AND (buyer_id = ? OR seller_id = ?)
        ");
        $stmt->execute([$orderId, $sender_id, $sender_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'You are not authorized for this order']);
            break;
        }
        
        $result = $orderModel->sendMessage($orderId, $sender_id, $content);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Message sent']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to send message']);
        }
        break;

    // ── GET MESSAGES ──────────────────────────────────────────
    case 'get_messages':
        $orderId = $_GET['order_id'] ?? 0;
        $after_time = $_GET['after_time'] ?? null;
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
            SELECT id FROM orders 
            WHERE id = ? AND (buyer_id = ? OR seller_id = ?)
        ");
        $stmt->execute([$orderId, $userId, $userId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'You are not authorized']);
            break;
        }
        
        $messages = $orderModel->getMessages($orderId, $after_time);
        echo json_encode(['success' => true, 'messages' => $messages]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        break;
}
?>