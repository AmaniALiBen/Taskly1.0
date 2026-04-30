<?php
session_start();
header('Content-Type: application/json');

$conn = mysqli_connect('localhost', 'root', '', 'Taskly');

if (!$conn) {
    echo json_encode(['success' => false, 'error' => 'Connection failed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'] ?? '';
$icon = $data['icon'] ?? '';

if (empty($name)) {
    echo json_encode(['success' => false, 'error' => 'Name required']);
    exit();
}

$sql = "INSERT INTO categories (name, icon) VALUES ('$name', '$icon')";
if (mysqli_query($conn, $sql)) {
    echo json_encode(['success' => true, 'message' => 'Category added', 'id' => mysqli_insert_id($conn)]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to add']);
}

mysqli_close($conn);
?>