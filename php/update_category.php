<?php
header('Content-Type: application/json');

$conn = mysqli_connect('localhost', 'root', '', 'Taskly');

if (!$conn) {
    echo json_encode(['success' => false, 'error' => 'Connection failed']);
    exit();
}

$id = $_POST['id'] ?? 0;
$name = $_POST['name'] ?? '';

if (!$id || empty($name)) {
    echo json_encode(['success' => false, 'error' => 'ID and name required']);
    exit();
}

// تحديث الاسم فقط، الأيقونة تبقى كما هي
$sql = "UPDATE categories SET name='$name' WHERE id=$id";

if (mysqli_query($conn, $sql)) {
    echo json_encode(['success' => true, 'message' => 'Category updated']);
} else {
    echo json_encode(['success' => false, 'error' => mysqli_error($conn)]);
}

mysqli_close($conn);
?>