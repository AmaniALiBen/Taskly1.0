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
        
        // التحقق من أن الطلب يخص هذا البائع
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

    // ── UPDATE REVISIONS ─────────────────────────────────────
    case 'update_revisions':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $_SESSION['user_id'] ?? 0;
        $orderId = $input['order_id'] ?? 0;
        $newRevisionsLeft = $input['left_revisions'] ?? 0;
        
        if ($userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        
        $stmt = $db->prepare("UPDATE orders SET left_revisions = ? WHERE id = ?");
        $result = $stmt->execute([$newRevisionsLeft, $orderId]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Revisions updated']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update revisions']);
        }
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
            WHERE of.id = ?
        ");
        $stmt->execute([$fileId]);
        $file = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$file) {
            echo json_encode(['success' => false, 'message' => 'File not found']);
            break;
        }
        
        if ($file['buyer_id'] != $userId && $file['seller_id'] != $userId) {
            echo json_encode(['success' => false, 'message' => 'Not authorized']);
            break;
        }
        
        $timestamp = strtotime($file['uploaded_at']);
        $savedName = $file['id'] . '_' . $timestamp . '.' . $file['extension'];
        $folder = ($file['file_type'] === 'requirement') ? 'requirement' : 'delivery';
        $filePath = $_SERVER['DOCUMENT_ROOT'] . '/Taskly/uploads/' . $folder . '/' . $savedName;
        
        if (file_exists($filePath)) {
            $ext = strtolower($file['extension']);
            $contentType = 'application/octet-stream';
            $mimeTypes = [
                'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
                'gif' => 'image/gif', 'webp' => 'image/webp', 'pdf' => 'application/pdf',
                'zip' => 'application/zip', 'txt' => 'text/plain'
            ];
            if (isset($mimeTypes[$ext])) {
                $contentType = $mimeTypes[$ext];
            }
            
            while (ob_get_level()) ob_end_clean();
            
            header('Content-Type: ' . $contentType);
            header('Content-Disposition: attachment; filename="' . $file['file_name'] . '"');
            header('Content-Length: ' . filesize($filePath));
            header('Cache-Control: no-cache, must-revalidate');
            header('Pragma: public');
            
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
        
        $stmt = $db->prepare("SELECT id FROM orders WHERE id = ? AND (buyer_id = ? OR seller_id = ?)");
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
        
        $stmt = $db->prepare("SELECT id FROM orders WHERE id = ? AND (buyer_id = ? OR seller_id = ?)");
        $stmt->execute([$orderId, $userId, $userId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'You are not authorized']);
            break;
        }
        
        $messages = $orderModel->getMessages($orderId, $after_time);
        echo json_encode(['success' => true, 'messages' => $messages]);
        break;

    // ── SUBMIT RATING ─────────────────────────────────────────
    case 'submit_rating':
        submitRating($db);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        break;
}

// ============================================
// FUNCTION: submitRating
// ============================================
function submitRating($db) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'You must be logged in']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $orderId = $input['order_id'] ?? 0;
    $rating = $input['rating'] ?? 0;
    
    if (!$orderId || $rating < 1 || $rating > 5) {
        echo json_encode(['success' => false, 'message' => 'Invalid rating data']);
        return;
    }
    
    $userId = $_SESSION['user_id'];
    
    try {
        // 1. جلب معلومات الطلب و package_id
        $stmt = $db->prepare("
            SELECT id, seller_id, status, rating_score, package_id
            FROM orders 
            WHERE id = ? AND buyer_id = ?
        ");
        $stmt->execute([$orderId, $userId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'Order not found']);
            return;
        }
        
        if ($order['status'] !== 'completed') {
            echo json_encode(['success' => false, 'message' => 'Order must be completed before rating']);
            return;
        }
        
        if ($order['rating_score'] !== null) {
            echo json_encode(['success' => false, 'message' => 'Rating already submitted for this order']);
            return;
        }
        
        // 2. جلب gig_id من جدول gig_packages
        $stmt = $db->prepare("SELECT gig_id FROM gig_packages WHERE id = ?");
        $stmt->execute([$order['package_id']]);
        $package = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$package || !$package['gig_id']) {
            echo json_encode(['success' => false, 'message' => 'Gig not found for this order']);
            return;
        }
        
        $gigId = $package['gig_id'];
        
        // 3. حفظ التقييم في جدول orders
        $stmt = $db->prepare("UPDATE orders SET rating_score = ? WHERE id = ?");
        $stmt->execute([$rating, $orderId]);
        
        // 4. تحديث متوسط تقييم الجيج
        $updateResult = updateGigRating($db, $gigId);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Rating submitted successfully',
            'rating' => $rating,
            'gig_updated' => $updateResult
        ]);
        
    } catch (PDOException $e) {
        error_log("Rating error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function updateGigRating($db, $gigId) {
    try {
        // حساب متوسط التقييمات لهذه الخدمة
        $stmt = $db->prepare("
            SELECT 
                AVG(o.rating_score) as avg_rating,
                COUNT(o.rating_score) as total_ratings
            FROM orders o
            JOIN gig_packages gp ON o.package_id = gp.id
            WHERE gp.gig_id = ? AND o.status = 'completed' AND o.rating_score IS NOT NULL
        ");
        $stmt->execute([$gigId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $avgRating = $result['avg_rating'] ? round($result['avg_rating']) : null;
        
        // تحديث جدول gigs
        $stmt = $db->prepare("UPDATE gigs SET rating = ? WHERE id = ?");
        $stmt->execute([$avgRating, $gigId]);
        
        // ✅ تحديث مستوى البائع - مع التحقق من وجود الملف
        $stmt = $db->prepare("SELECT seller_id FROM gigs WHERE id = ?");
        $stmt->execute([$gigId]);
        $gig = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($gig) {
            // ✅ التحقق من وجود ملف Gig.php قبل تحميله
            $gigModelPath = __DIR__ . '/../models/Gig.php';
            if (file_exists($gigModelPath)) {
                require_once $gigModelPath;
                if (class_exists('Gig')) {
                    $gigModel = new Gig();
                    if (method_exists($gigModel, 'updateSellerLevel')) {
                        $gigModel->updateSellerLevel($gig['seller_id']);
                    }
                }
            }
        }
        
        return true;
        
    } catch (Exception $e) {
        error_log("Error updating gig rating: " . $e->getMessage());
        return false;
    }
}
?>