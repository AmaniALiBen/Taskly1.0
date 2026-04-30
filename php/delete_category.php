<?php
session_start();
header('Content-Type: application/json');

$conn = mysqli_connect('localhost', 'root', '', 'Taskly');

if (!$conn) {
    echo json_encode(['success' => false, 'error' => 'Connection failed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? 0;

if (!$id) {
    echo json_encode(['success' => false, 'error' => 'ID required']);
    exit();
}

$sql = "DELETE FROM categories WHERE id = $id";
if (mysqli_query($conn, $sql)) {
    echo json_encode(['success' => true, 'message' => 'Category deleted']);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to delete']);
}

mysqli_close($conn);
?>