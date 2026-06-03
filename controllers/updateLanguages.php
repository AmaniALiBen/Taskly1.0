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

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(["success" => false, "message" => "Invalid request data"]);
    exit();
}

if ($userRole !== 'seller') {
    echo json_encode(["success" => false, "message" => "Only sellers can update languages"]);
    exit();
}

$languages = $input['languages'] ?? [];

try {
    $conn->beginTransaction();
    $deleteSql = "DELETE FROM seller_languages WHERE seller_id = ?";
    $deleteStmt = $conn->prepare($deleteSql);
    $deleteStmt->execute([$userId]);

    if (!empty($languages) && is_array($languages)) {
        $insertSql = "INSERT INTO seller_languages (seller_id, language_id) VALUES (?, ?)";
        $insertStmt = $conn->prepare($insertSql);
        foreach ($languages as $languageId) {
            $insertStmt->execute([$userId, $languageId]);
        }
    }

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Languages updated successfully"]);
} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
