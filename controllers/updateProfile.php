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
$isJson = ($input !== null);

$name = '';
$summary = '';
$skills = '';
$country = '';
$avatarFile = null;

if ($isJson) {
    $name = trim($input['name'] ?? '');
    $summary = trim($input['summary'] ?? '');
    $skills = trim($input['skills'] ?? '');
    $country = trim($input['country'] ?? '');
} else {
    $name = trim($_POST['name'] ?? '');
    $summary = trim($_POST['summary'] ?? '');
    $skills = trim($_POST['skills'] ?? '');
    $country = trim($_POST['country'] ?? '');
    $avatarFile = $_FILES['avatar'] ?? null;
}

if (empty($name)) {
    echo json_encode(["success" => false, "message" => "Name is required"]);
    exit();
}

$updateUser = "UPDATE users SET name = ? WHERE id = ?";
$stmt = $conn->prepare($updateUser);
if (!$stmt->execute([$name, $userId])) {
    echo json_encode(["success" => false, "message" => "Failed to update user"]);
    exit();
}

$_SESSION['user_name'] = $name;
$avatarUrl = null;

if ($avatarFile && $avatarFile['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $avatarFile['tmp_name'];
    $fileName = $avatarFile['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (in_array($fileExtension, $allowedExtensions) && $avatarFile['size'] <= 5 * 1024 * 1024) {
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
        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $updatePic = "UPDATE users SET picture_name = ? WHERE id = ?";
            $stmtPic = $conn->prepare($updatePic);
            $stmtPic->execute([$pictureName, $userId]);
            $avatarUrl = '/Taskly/avatars/' . $folder . '/' . $pictureName;
        }
    }
}

if ($userRole === 'seller') {
    $fields = [];
    $params = [];

    if (!empty($summary)) {
        $fields[] = "experience = ?";
        $params[] = $summary;
    }

    if (!empty($skills)) {
        $fields[] = "about_me = ?";
        $params[] = $skills;
    }

    if (!empty($country)) {
        $stmtCountry = $conn->prepare("SELECT id FROM countries WHERE name = ? LIMIT 1");
        $stmtCountry->execute([$country]);
        $countryRow = $stmtCountry->fetch(PDO::FETCH_ASSOC);
        if ($countryRow) {
            $fields[] = "country_id = ?";
            $params[] = $countryRow['id'];
        }
    }

    if (!empty($fields)) {
        $params[] = $userId;
        $updateSeller = "UPDATE seller_details SET " . implode(", ", $fields) . " WHERE seller_id = ?";
        $stmtSeller = $conn->prepare($updateSeller);
        if (!$stmtSeller->execute($params)) {
            echo json_encode(["success" => false, "message" => "Failed to update seller details"]);
            exit();
        }
    }
}

$response = ["success" => true, "message" => "Profile updated successfully"];
if ($avatarUrl) {
    $response["avatar"] = $avatarUrl;
}

echo json_encode($response);
