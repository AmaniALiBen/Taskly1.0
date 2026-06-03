<?php
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/UserModel.php';

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || ($_SESSION['user_role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$userModel = new UserModel(getDB());
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    // ── GET ALL SELLERS ────────────────────────────────────────
    case 'get_sellers':
        $sellers = $userModel->getAllSellers();
        echo json_encode(['success' => true, 'data' => $sellers]);
        break;

    // ── GET ALL BUYERS ────────────────────────────────────────
    case 'get_buyers':
        $buyers = $userModel->getAllBuyers();
        echo json_encode(['success' => true, 'data' => $buyers]);
        break;

    // ── TOGGLE USER STATUS (ACTIVATE/SUSPEND) ─────────────────
    case 'toggle_status':
        $userId = (int)($_POST['user_id'] ?? 0);
        $isActive = (int)($_POST['is_active'] ?? 0);
        
        if ($userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid user ID']);
            break;
        }
        
        $result = $userModel->toggleUserStatus($userId, $isActive);
        echo json_encode([
            'success' => $result,
            'message' => $result ? ($isActive ? 'User activated' : 'User suspended') : 'Failed to update status'
        ]);
        break;

    // ── DELETE USER ───────────────────────────────────────────
    case 'delete_user':
        $userId = (int)($_POST['user_id'] ?? 0);
        
        if ($userId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid user ID']);
            break;
        }
        
        $result = $userModel->deleteUser($userId);
        echo json_encode([
            'success' => $result,
            'message' => $result ? 'User deleted successfully' : 'Failed to delete user'
        ]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        break;
}
?>