<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "taskly";

$conn = mysqli_connect($servername, $username, $password, $dbname);

if (!$conn) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

mysqli_set_charset($conn, 'utf8mb4');
?>
