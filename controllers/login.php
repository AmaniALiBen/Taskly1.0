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

$stmt = $conn->prepare("SELECT id, name, email, password_hash, role, picture_name FROM users WHERE email = ? AND is_deleted = 0");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password_hash'])) {
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
} else {
    echo json_encode(["success" => false, "message" => "Invalid email or password"]);
}
