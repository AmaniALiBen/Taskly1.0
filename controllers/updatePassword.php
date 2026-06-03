<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(["success" => false, "message" => "Invalid request data"]);
    exit();
}

$userId = $_SESSION['user_id'];
$currentPassword = $input['currentPassword'] ?? '';
$newPassword = $input['newPassword'] ?? '';

if (empty($currentPassword) || empty($newPassword)) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit();
}

if (strlen($newPassword) < 8) {
    echo json_encode(["success" => false, "message" => "Password must be at least 8 characters"]);
    exit();
}

$stmt = $conn->prepare("SELECT password_hash FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit();
}

if (!password_verify($currentPassword, $user['password_hash'])) {
    echo json_encode(["success" => false, "message" => "Current password is incorrect"]);
    exit();
}

$newHash = password_hash($newPassword, PASSWORD_DEFAULT);
$updatePass = "UPDATE users SET password_hash = ? WHERE id = ?";
$updateStmt = $conn->prepare($updatePass);

if ($updateStmt->execute([$newHash, $userId])) {
    echo json_encode(["success" => true, "message" => "Password updated successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to update password"]);
}
