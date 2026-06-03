<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(["success" => false, "message" => "Invalid request data"]);
    exit();
}

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$remember = !empty($input['remember']);

if (empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Email and password required"]);
    exit();
}

// ✅ إضافة التحقق من is_active = 1 AND is_deleted = 0
$stmt = $conn->prepare("SELECT id, name, email, password_hash, role, picture_name, is_active, is_deleted FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["success" => false, "message" => "Invalid email or password"]);
    exit();
}

// ✅ التحقق من أن الحساب غير محذوف
if ($user['is_deleted'] == 1) {
    echo json_encode(["success" => false, "message" => "This account has been deleted. Please contact support."]);
    exit();
}

// ✅ التحقق من أن الحساب نشط
if ($user['is_active'] == 0) {
    echo json_encode(["success" => false, "message" => "Your account has been suspended. Please contact support."]);
    exit();
}

// ✅ التحقق من كلمة المرور
if (!password_verify($password, $user['password_hash'])) {
    echo json_encode(["success" => false, "message" => "Invalid email or password"]);
    exit();
}

// ✅ تسجيل الدخول ناجح
session_start();
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['user_role'] = $user['role'];

$avatar = null;
if (!empty($user['picture_name'])) {
    $folder = $user['role'] === 'seller' ? 'sellers' : 'buyers';
    $avatar = '/Taskly/avatars/' . $folder . '/' . $user['picture_name'];
}

if ($remember) {
    setcookie('remember_email', $email, time() + (86400 * 30), "/");
}

echo json_encode([
    "success" => true,
    "message" => "Login successful",
    "username" => $user['name'],
    "email" => $user['email'],
    "role" => $user['role'],
    "user_id" => $user['id'],
    "avatar" => $avatar
]);
?>