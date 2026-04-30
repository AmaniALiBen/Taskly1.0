<?php
session_start();
header('Content-Type: application/json');

$conn = mysqli_connect('localhost', 'root', '', 'Taskly');

if (!$conn) {
    echo json_encode(['success' => false, 'error' => 'Connection failed']);
    exit();
}

$sql = "SELECT * FROM categories ORDER BY id";
$result = mysqli_query($conn, $sql);
$categories = [];

while ($row = mysqli_fetch_assoc($result)) {
    $categories[] = $row;
}

echo json_encode(['success' => true, 'data' => $categories]);
mysqli_close($conn);
?>