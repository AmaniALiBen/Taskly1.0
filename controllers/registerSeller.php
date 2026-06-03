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

$basePath = $_SERVER['DOCUMENT_ROOT'] . '/Taskly';

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$country_id = intval($_POST['country_id'] ?? 0);
$experience = trim($_POST['experience'] ?? '');
$aboutMe = trim($_POST['aboutMe'] ?? '');
$languages = json_decode($_POST['languages'] ?? '[]', true);

if (empty($name) || empty($email) || empty($password) || $country_id === 0) {
    echo json_encode(["success" => false, "message" => "All required fields must be filled"]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email format"]);
    exit();
}

if (strlen($password) < 8) {
    echo json_encode(["success" => false, "message" => "Password must be at least 8 characters"]);
    exit();
}

if (strlen($experience) < 20) {
    echo json_encode(["success" => false, "message" => "Experience must be at least 20 characters"]);
    exit();
}

if (strlen($aboutMe) < 30) {
    echo json_encode(["success" => false, "message" => "About me must be at least 30 characters"]);
    exit();
}

if (!isset($_FILES['profilePic']) || $_FILES['profilePic']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "Profile photo is required"]);
    exit();
}

$fileTmpPath = $_FILES['profilePic']['tmp_name'];
$fileName = $_FILES['profilePic']['name'];
$fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

if (!in_array($fileExtension, $allowedExtensions)) {
    echo json_encode(["success" => false, "message" => "Invalid image format. Allowed: JPG, PNG, WEBP, GIF"]);
    exit();
}

$fileSize = $_FILES['profilePic']['size'];
if ($fileSize > 5 * 1024 * 1024) {
    echo json_encode(["success" => false, "message" => "Image size must be less than 5MB"]);
    exit();
}

$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->rowCount() > 0) {
    echo json_encode(["success" => false, "message" => "Email already exists"]);
    exit();
}

$conn->beginTransaction();

try {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $role = 'seller';

    $userQuery = "INSERT INTO users (name, email, password_hash, role, is_active, is_deleted) 
                  VALUES (?, ?, ?, ?, 1, 0)";
    $stmtUser = $conn->prepare($userQuery);
    $stmtUser->execute([$name, $email, $hash, $role]);
    $sellerId = $conn->lastInsertId();

    $timestamp = microtime(true);
    $timestampStr = str_replace('.', '', (string)$timestamp);
    $finalPictureName = $sellerId . '_' . $timestampStr . '.' . $fileExtension;

    $updatePic = "UPDATE users SET picture_name = ? WHERE id = ?";
    $stmtUpdatePic = $conn->prepare($updatePic);
    $stmtUpdatePic->execute([$finalPictureName, $sellerId]);

    $sellerDetailsQuery = "INSERT INTO seller_details (seller_id, country_id, experience, about_me, level) 
                           VALUES (?, ?, ?, ?, 'raising star')";
    $stmtDetails = $conn->prepare($sellerDetailsQuery);
    $stmtDetails->execute([$sellerId, $country_id, $experience, $aboutMe]);

    if (!empty($languages) && is_array($languages)) {
        $langQuery = "INSERT INTO seller_languages (seller_id, language_id) VALUES (?, ?)";
        $stmtLang = $conn->prepare($langQuery);
        foreach ($languages as $languageId) {
            $stmtLang->execute([$sellerId, $languageId]);
        }
    }

    $conn->commit();

    $uploadDir = $basePath . '/avatars/sellers/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $destPath = $uploadDir . $finalPictureName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        session_start();
        $_SESSION['user_id'] = $sellerId;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_role'] = 'seller';

        echo json_encode(["success" => true, "message" => "Seller account created successfully!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Account created but failed to upload image."]);
    }
} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
