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

$userId = $_SESSION['user_id'];
$userRole = $_SESSION['user_role'] ?? 'buyer';
$avatarFile = $_FILES['avatar'] ?? null;

if (!$avatarFile || $avatarFile['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No image uploaded"]);
    exit();
}

$fileExtension = strtolower(pathinfo($avatarFile['name'], PATHINFO_EXTENSION));
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

if (!in_array($fileExtension, $allowedExtensions)) {
    echo json_encode(["success" => false, "message" => "Invalid image format"]);
    exit();
}

if ($avatarFile['size'] > 5 * 1024 * 1024) {
    echo json_encode(["success" => false, "message" => "Image size must be less than 5MB"]);
    exit();
}

$timestamp = microtime(true);
$timestampStr = str_replace('.', '', (string)$timestamp);
$pictureName = $userId . '_' . $timestampStr . '.' . $fileExtension;
$folder = ($userRole === 'seller') ? 'sellers' : 'buyers';
$uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/Taskly/avatars/' . $folder . '/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$stmtOld = $conn->prepare("SELECT picture_name FROM users WHERE id = ?");
$stmtOld->execute([$userId]);
$oldPic = $stmtOld->fetch(PDO::FETCH_ASSOC);

if ($oldPic && !empty($oldPic['picture_name'])) {
    $oldPath = $uploadDir . $oldPic['picture_name'];
    if (file_exists($oldPath)) {
        unlink($oldPath);
    }
}

$destPath = $uploadDir . $pictureName;

if (move_uploaded_file($avatarFile['tmp_name'], $destPath)) {
    $updatePic = "UPDATE users SET picture_name = ? WHERE id = ?";
    $updateStmt = $conn->prepare($updatePic);
    if ($updateStmt->execute([$pictureName, $userId])) {
        $avatarUrl = '/Taskly/avatars/' . $folder . '/' . $pictureName;
        echo json_encode(["success" => true, "message" => "Avatar updated successfully", "avatar" => $avatarUrl]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update database"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Failed to upload image"]);
}
