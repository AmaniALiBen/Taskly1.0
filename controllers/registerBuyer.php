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

$name = '';
$email = '';
$password = '';

if (!empty($_FILES) && count($_FILES) > 0) {
    $name = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
} else {
    $input = json_decode(file_get_contents('php://input'), true);
    $name = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
}

if (empty($name) || empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "All fields required"]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email format"]);
    exit();
}

if (strlen($password) < 8) {
    echo json_encode(["success" => false, "message" => "Password must be 8+ characters"]);
    exit();
}

$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->rowCount() > 0) {
    echo json_encode(["success" => false, "message" => "Email already exists"]);
    exit();
}

$picture_name = null;
if (isset($_FILES['profilePic']) && $_FILES['profilePic']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['profilePic']['tmp_name'];
    $fileName = $_FILES['profilePic']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (in_array($fileExtension, $allowedExtensions)) {
        $microtime = microtime(true);
        $microtimeStr = str_replace('.', '', (string)$microtime);
        $random = rand(1000, 9999);
        $picture_name = $microtimeStr . '_' . $random . '.' . $fileExtension;

        $uploadDir = $basePath . '/avatars/buyers/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $destPath = $uploadDir . $picture_name;
        move_uploaded_file($fileTmpPath, $destPath);
    }
}

$hash = password_hash($password, PASSWORD_DEFAULT);

if ($picture_name) {
    $query = "INSERT INTO users (name, email, password_hash, role, picture_name, is_active, is_deleted) 
              VALUES (?, ?, ?, 'buyer', ?, 1, 0)";
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([$name, $email, $hash, $picture_name]);
} else {
    $query = "INSERT INTO users (name, email, password_hash, role, is_active, is_deleted) 
              VALUES (?, ?, ?, 'buyer', 1, 0)";
    $stmt = $conn->prepare($query);
    $result = $stmt->execute([$name, $email, $hash]);
}

if ($result) {
    echo json_encode(["success" => true, "message" => "Account created successfully!"]);
} else {
    echo json_encode(["success" => false, "message" => "Database error"]);
}
