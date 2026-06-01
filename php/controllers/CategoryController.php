<?php
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../models/Category.php';

function listCategories($conn) {
    $categories = getAllCategories($conn);

    if ($categories === false) {
        sendJson(['success' => false, 'error' => 'Failed to load categories']);
    }

    sendJson(['success' => true, 'data' => $categories]);
}

function addCategory($conn) {
    requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        sendJson(['success' => false, 'error' => 'Invalid request body']);
    }

    $name = trim($data['name'] ?? '');
    $icon = trim($data['icon'] ?? '');

    if ($name === '') {
        sendJson(['success' => false, 'error' => 'Name required']);
    }

    if ($icon === '') {
        $icon = 'fa-tag';
    }

    $id = createCategory($conn, $name, $icon);
    if (!$id) {
        sendJson(['success' => false, 'error' => 'Failed to add category']);
    }

    sendJson([
        'success' => true,
        'message' => 'Category added',
        'id' => $id
    ]);
}

function updateCategory($conn) {
    requireAdmin();

    $id = (int)($_POST['id'] ?? 0);
    $name = trim($_POST['name'] ?? '');

    if ($id <= 0 || $name === '') {
        sendJson(['success' => false, 'error' => 'Valid ID and name required']);
    }

    if (!updateCategoryName($conn, $id, $name)) {
        sendJson(['success' => false, 'error' => 'Failed to update category']);
    }

    sendJson(['success' => true, 'message' => 'Category updated']);
}

function deleteCategory($conn) {
    requireAdmin();

    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        sendJson(['success' => false, 'error' => 'Invalid request body']);
    }

    $id = (int)($data['id'] ?? 0);

    if ($id <= 0) {
        sendJson(['success' => false, 'error' => 'Valid ID required']);
    }

    if (!deleteCategoryById($conn, $id)) {
        sendJson(['success' => false, 'error' => 'Failed to delete category']);
    }

    sendJson(['success' => true, 'message' => 'Category deleted']);
}
?>
