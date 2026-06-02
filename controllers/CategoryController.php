

<?php
// Always return JSON from this file
header('Content-Type: application/json');

require_once __DIR__ . '/../models/Category.php';

// ── SESSION CHECK ──────────────────────────────────────────────
// Uncomment these lines once you have login working:
// session_start();
// if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
//     http_response_code(403);
//     echo json_encode(['success' => false, 'message' => 'Unauthorized']);
//     exit;
// }
// ──────────────────────────────────────────────────────────────

$category = new Category();

// Read which action JS is requesting
// JS will send: action=get_all  or  action=create  etc.
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {

    // ── GET ALL CATEGORIES ─────────────────────────────────────
    // JS calls: GET CategoryController.php?action=get_all
    case 'get_all':
        $categories = $category->getAll();
        echo json_encode([
            'success' => true,
            'data'    => $categories
        ]);
        break;

    // ── ADD CATEGORY ───────────────────────────────────────────
    // JS calls: POST CategoryController.php  body: action, name, icon_url
    case 'create':
        $name     = trim($_POST['name'] ?? '');
        $icon_url = trim($_POST['icon_url'] ?? '');

        if (empty($name)) {
            echo json_encode(['success' => false, 'message' => 'Category name is required']);
            break;
        }

        $newId = $category->create($name, $icon_url);
        echo json_encode([
            'success' => true,
            'message' => 'Category added successfully',
            'id'      => $newId
        ]);
        break;

    // ── DELETE CATEGORY ────────────────────────────────────────
    // JS calls: POST CategoryController.php  body: action, id
    case 'delete':
        $id = (int)($_POST['id'] ?? 0);

        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid category ID']);
            break;
        }

        $deleted = $category->delete($id);
        echo json_encode([
            'success' => $deleted,
            'message' => $deleted ? 'Category deleted' : 'Category not found'
        ]);
        break;

    // ── UPDATE CATEGORY ────────────────────────────────────────
    // JS calls: POST CategoryController.php  body: action, id, name, icon_url
    case 'update':
        $id       = (int)($_POST['id'] ?? 0);
        $name     = trim($_POST['name'] ?? '');
        $icon_url = trim($_POST['icon_url'] ?? '');

        if ($id <= 0 || empty($name)) {
            echo json_encode(['success' => false, 'message' => 'ID and name are required']);
            break;
        }

        $updated = $category->update($id, $name, $icon_url);
        echo json_encode([
            'success' => $updated,
            'message' => $updated ? 'Category updated' : 'Nothing changed'
        ]);
        break;

    // ── GET SUBCATEGORIES ──────────────────────────────────────
    // JS calls: GET CategoryController.php?action=get_subs&category_id=3
    case 'get_subs':
        $category_id = (int)($_GET['category_id'] ?? 0);

        if ($category_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid category ID']);
            break;
        }

        $subs = $category->getSubcategories($category_id);
        echo json_encode([
            'success' => true,
            'data'    => $subs
        ]);
        break;

    // ── ADD SUBCATEGORY ────────────────────────────────────────
    // JS calls: POST CategoryController.php  body: action, category_id, name
    case 'create_sub':
        $category_id = (int)($_POST['category_id'] ?? 0);
        $name        = trim($_POST['name'] ?? '');

        if ($category_id <= 0 || empty($name)) {
            echo json_encode(['success' => false, 'message' => 'Category ID and name are required']);
            break;
        }

        $newId = $category->createSubcategory($category_id, $name);
        echo json_encode([
            'success' => true,
            'message' => 'Subcategory added successfully',
            'id'      => $newId
        ]);
        break;

    // ── DELETE SUBCATEGORY ─────────────────────────────────────
    // JS calls: POST CategoryController.php  body: action, id
    case 'delete_sub':
        $id = (int)($_POST['id'] ?? 0);

        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid subcategory ID']);
            break;
        }

        $deleted = $category->deleteSubcategory($id);
        echo json_encode([
            'success' => $deleted,
            'message' => $deleted ? 'Subcategory deleted' : 'Subcategory not found'
        ]);
        break;

    // ── UNKNOWN ACTION ─────────────────────────────────────────
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        break;
}
// require_once __DIR__ . '/../helpers/Response.php';
// require_once __DIR__ . '/../helpers/Auth.php';
// require_once __DIR__ . '/../models/Category.php';

// function listCategories($conn) {
//     $categories = getAllCategories($conn);

//     if ($categories === false) {
//         sendJson(['success' => false, 'error' => 'Failed to load categories']);
//     }

//     sendJson(['success' => true, 'data' => $categories]);
// }

// function addCategory($conn) {
//     requireAdmin();

//     $data = json_decode(file_get_contents('php://input'), true);
//     if (!is_array($data)) {
//         sendJson(['success' => false, 'error' => 'Invalid request body']);
//     }

//     $name = trim($data['name'] ?? '');
//     $icon = trim($data['icon'] ?? '');

//     if ($name === '') {
//         sendJson(['success' => false, 'error' => 'Name required']);
//     }

//     if ($icon === '') {
//         $icon = 'fa-tag';
//     }

//     $id = createCategory($conn, $name, $icon);
//     if (!$id) {
//         sendJson(['success' => false, 'error' => 'Failed to add category']);
//     }

//     sendJson([
//         'success' => true,
//         'message' => 'Category added',
//         'id' => $id
//     ]);
// }

// function updateCategory($conn) {
//     requireAdmin();

//     $id = (int)($_POST['id'] ?? 0);
//     $name = trim($_POST['name'] ?? '');

//     if ($id <= 0 || $name === '') {
//         sendJson(['success' => false, 'error' => 'Valid ID and name required']);
//     }

//     if (!updateCategoryName($conn, $id, $name)) {
//         sendJson(['success' => false, 'error' => 'Failed to update category']);
//     }

//     sendJson(['success' => true, 'message' => 'Category updated']);
// }

// function deleteCategory($conn) {
//     requireAdmin();

//     $data = json_decode(file_get_contents('php://input'), true);
//     if (!is_array($data)) {
//         sendJson(['success' => false, 'error' => 'Invalid request body']);
//     }

//     $id = (int)($data['id'] ?? 0);

//     if ($id <= 0) {
//         sendJson(['success' => false, 'error' => 'Valid ID required']);
//     }

//     if (!deleteCategoryById($conn, $id)) {
//         sendJson(['success' => false, 'error' => 'Failed to delete category']);
//     }

//     sendJson(['success' => true, 'message' => 'Category deleted']);
// }
