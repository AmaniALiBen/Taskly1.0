<?php
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/WalletModel.php';
require_once __DIR__ . '/../models/Order.php';
require_once __DIR__ . '/../models/Gig.php';
require_once __DIR__ . '/../helpers/EmailHelper.php';

// Admin check
if (!isset($_SESSION['user_id']) || ($_SESSION['user_role'] ?? '') !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$db = getDB();
$userModel = new UserModel($db);
$walletModel = new WalletModel($db);
$orderModel = new Order();
$gigModel = new Gig();

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    case 'get_sellers':
        $sellers = $userModel->getAllSellers();
        echo json_encode(['success' => true, 'data' => $sellers]);
        break;

    case 'get_buyers':
        $buyers = $userModel->getAllBuyers();
        echo json_encode(['success' => true, 'data' => $buyers]);
        break;

    // ─── TOGGLE SUSPEND/ACTIVATE ───────────────────────────────
    case 'toggle_status':
        $userId = (int)($_POST['user_id'] ?? 0);
        $isActive = (int)($_POST['is_active'] ?? 0);
        
        if ($userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid user ID']);
            break;
        }
        
        // Get user role
        $stmt = $db->prepare("SELECT role, email, name FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user['role'] === 'seller') {
            // Suspend: pause all gigs | Activate: reactivate all gigs
            $gigModel->toggleStatusBySeller($userId, $isActive);
        }
        
        $result = $userModel->toggleUserStatus($userId, $isActive);
        
       
       // Send email notification
       EmailHelper::sendAccountStatusEmail($user['email'], $user['name'], $isActive ? 'activated' : 'suspended');
        
        echo json_encode([
            'success' => $result,
            'message' => $result ? ($isActive ? 'User activated' : 'User suspended') : 'Failed to update status'
        ]);
        break;

    // ─── DELETE USER (SOFT DELETE WITH REFUNDS) ─────────────────
    case 'delete_user':
        $userId = (int)($_POST['user_id'] ?? 0);
        
        if ($userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid user ID']);
            break;
        }
        
        // Get user details
        $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User not found']);
            break;
        }
        
        // Start transaction
        $db->beginTransaction();
        
        try {
            // 1. Get all active orders (not completed or cancelled)
            $stmt = $db->prepare("
                SELECT o.*, gp.price 
                FROM orders o
                JOIN gig_packages gp ON gp.id = o.package_id
                WHERE (o.buyer_id = ? OR o.seller_id = ?) 
                AND o.status NOT IN ('completed', 'cancelled')
            ");
            $stmt->execute([$userId, $userId]);
            $activeOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($activeOrders as $order) {
                if ($user['role'] === 'seller') {
                    // Seller deleted: refund buyer
                    $walletModel->addBalance($order['buyer_id'], $order['price']);
                    
                    // Update order status to cancelled
                    $stmt2 = $db->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
                    $stmt2->execute([$order['id']]);
                    
                    // Send email notification
                    EmailHelper::sendRefundEmail($user['email'], $user['name'], $order['id'], $order['price']);
                    
                } elseif ($user['role'] === 'buyer') {
                    // Buyer deleted: release payment to seller
                    $walletModel->addBalance($order['seller_id'], $order['price']);
                    
                    // Update order status to completed
                    $stmt2 = $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?");
                    $stmt2->execute([$order['id']]);
                    
                    // Send email notification
                    EmailHelper::sendPaymentReleasedEmail($user['email'], $user['name'], $order['id'], $order['price']);
                }
            }
            
            // 2. If seller, soft delete all their gigs
            if ($user['role'] === 'seller') {
                $stmt = $db->prepare("UPDATE gigs SET is_deleted = 1 WHERE seller_id = ?");
                $stmt->execute([$userId]);
            }
            
            // 3. Set user's wallet balance to 0
            $stmt = $db->prepare("UPDATE wallets SET balance = 0 WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // 4. Soft delete the user
            $result = $userModel->deleteUser($userId);
            
            // 5. Send email notification
            EmailHelper::sendAccountDeletedEmail($user['email'], $user['name']);
            
            $db->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'User deleted successfully. Orders processed.'
            ]);
            
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Unknown action']);
        break;
}
?>