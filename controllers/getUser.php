<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["loggedIn" => false]);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/WalletModel.php';

$userId = $_SESSION['user_id'];
$role = $_SESSION['user_role'] ?? 'buyer';

// ✅ إضافة is_deleted إلى الاستعلام
$stmt = $conn->prepare("SELECT id, name, email, role, picture_name, is_active, is_deleted FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["loggedIn" => false]);
    exit();
}

// ✅ التحقق من أن الحساب غير محذوف
if ($user['is_deleted'] == 1) {
    session_destroy();
    echo json_encode(["loggedIn" => false, "message" => "Account has been deleted"]);
    exit();
}

// ✅ التحقق من أن الحساب نشط
if ($user['is_active'] == 0) {
    session_destroy();
    echo json_encode(["loggedIn" => false, "message" => "Account is suspended"]);
    exit();
}

$avatar = null;
if (!empty($user['picture_name'])) {
    $folder = $role === 'seller' ? 'sellers' : 'buyers';
    $avatar = '/Taskly/avatars/' . $folder . '/' . $user['picture_name'];
} else {
    $firstLetter = substr($user['name'], 0, 1);
    $avatar = "https://ui-avatars.com/api/?name=" . urlencode($firstLetter) . "&background=7c3aed&color=fff&size=100";
}

$response = [
    "loggedIn" => true,
    "user_id" => $user['id'],
    "username" => $user['name'],
    "email" => $user['email'],
    "role" => $user['role'],
    "avatar" => $avatar,
    "picture_name" => $user['picture_name'],
    "is_active" => $user['is_active'],
    "is_deleted" => $user['is_deleted']
];

if ($role === 'seller') {
    $userModel = new UserModel($conn);
    $sellerDetails = $userModel->getSellerDetails($userId);
    $languages = $userModel->getSellerLanguages($userId);
    $response['seller_details'] = $sellerDetails;
    $response['languages'] = $languages;
    $response['country'] = $sellerDetails['country_name'] ?? '';
    $response['experience'] = $sellerDetails['experience'] ?? '';
    $response['about_me'] = $sellerDetails['about_me'] ?? '';
    $response['level'] = $sellerDetails['level'] ?? 'raising star';
}

$walletModel = new WalletModel($conn);
$walletData = $walletModel->getWalletData($userId);
$response['wallet_balance'] = $walletData ? (float)$walletData['balance'] : 0;
$response['has_wallet_pin'] = $walletData && !empty($walletData['wallet_pin_hash']);

echo json_encode($response);
?>