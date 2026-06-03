<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/WalletModel.php';

$walletModel = new WalletModel($conn);
$userId = $_SESSION['user_id'] ?? 0;
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit();
}

switch ($action) {
    
    case 'get_data':
        $wallet = $walletModel->getWalletData($userId);
        echo json_encode([
            'success' => true,
            'balance' => $wallet ? (float)$wallet['balance'] : 0,
            'has_pin' => $wallet && !empty($wallet['wallet_pin_hash'])
        ]);
        break;
    
    case 'set_pin':
        $input = json_decode(file_get_contents('php://input'), true);
        $newPin = $input['new_pin'] ?? '';
        $currentPin = $input['current_pin'] ?? null;
        
        // التحقق من أن الـ PIN أرقام فقط و4 أرقام
        if (strlen($newPin) !== 4 || !ctype_digit($newPin)) {
            echo json_encode(['success' => false, 'message' => 'PIN must be 4 digits only (numbers 0-9)']);
            break;
        }
        
        $result = $walletModel->setPin($userId, $newPin, $currentPin);
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'PIN saved successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid current PIN']);
        }
        break;
    
    case 'deposit':
        $input = json_decode(file_get_contents('php://input'), true);
        $amountRaw = $input['amount'] ?? 0;
        
        // التحقق من أن القيمة رقمية وموجبة
        if (!is_numeric($amountRaw) || $amountRaw <= 0) {
            echo json_encode(['success' => false, 'message' => 'Please enter a valid positive number']);
            break;
        }
        
        $amount = (float)$amountRaw;
        
        if ($amount <= 0) {
            echo json_encode(['success' => false, 'message' => 'Amount must be greater than 0']);
            break;
        }
        
        if ($walletModel->addBalance($userId, $amount)) {
            echo json_encode(['success' => true, 'message' => "$$amount added to wallet"]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Deposit failed']);
        }
        break;
    
    case 'withdraw':
        $input = json_decode(file_get_contents('php://input'), true);
        $amountRaw = $input['amount'] ?? 0;
        $pin = $input['pin'] ?? '';
        $account = $input['account'] ?? '';
        
        // التحقق من أن المبلغ رقمي
        if (!is_numeric($amountRaw) || $amountRaw <= 0) {
            echo json_encode(['success' => false, 'message' => 'Please enter a valid positive number']);
            break;
        }
        
        $amount = (float)$amountRaw;
        
        if ($amount <= 0) {
            echo json_encode(['success' => false, 'message' => 'Amount must be greater than 0']);
            break;
        }
        
        if (strlen($pin) !== 4 || !ctype_digit($pin)) {
            echo json_encode(['success' => false, 'message' => 'PIN must be 4 digits only (numbers 0-9)']);
            break;
        }
        
        if (empty($account)) {
            echo json_encode(['success' => false, 'message' => 'Account details required']);
            break;
        }
        
        if (!$walletModel->verifyPin($userId, $pin)) {
            echo json_encode(['success' => false, 'message' => 'Invalid PIN']);
            break;
        }
        
        if ($walletModel->deductBalance($userId, $amount)) {
            echo json_encode(['success' => true, 'message' => "$$amount withdrawn successfully"]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Insufficient balance']);
        }
        break;
    
    case 'verify_pin':
        $input = json_decode(file_get_contents('php://input'), true);
        $pin = $input['pin'] ?? '';
        
        if (strlen($pin) !== 4 || !ctype_digit($pin)) {
            echo json_encode(['success' => false, 'message' => 'PIN must be 4 digits']);
            break;
        }
        
        $valid = $walletModel->verifyPin($userId, $pin);
        echo json_encode(['success' => $valid, 'message' => $valid ? 'PIN valid' : 'Invalid PIN']);
        break;
    
    default:
        echo json_encode(['success' => false, 'message' => 'Unknown action']);
        break;
}
?>