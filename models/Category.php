<?php
// function getAllCategories($conn) {
//     $sql = 'SELECT id, name, icon_url AS icon FROM categories ORDER BY id';
//     $result = mysqli_query($conn, $sql);

//     if (!$result) {
//         return false;
//     }

//     $categories = [];
//     while ($row = mysqli_fetch_assoc($result)) {
//         $categories[] = $row;
//     }

//     return $categories;
// }

// function createCategory($conn, $name, $icon) {
//     $stmt = mysqli_prepare($conn, 'INSERT INTO categories (name, icon_url) VALUES (?, ?)');
//     mysqli_stmt_bind_param($stmt, 'ss', $name, $icon);

//     if (!mysqli_stmt_execute($stmt)) {
//         return false;
//     }

//     return mysqli_insert_id($conn);
// }

// function updateCategoryName($conn, $id, $name) {
//     $stmt = mysqli_prepare($conn, 'UPDATE categories SET name = ? WHERE id = ?');
//     mysqli_stmt_bind_param($stmt, 'si', $name, $id);

//     return mysqli_stmt_execute($stmt);
// }

// function deleteCategoryById($conn, $id) {
//     $stmt = mysqli_prepare($conn, 'DELETE FROM categories WHERE id = ?');
//     mysqli_stmt_bind_param($stmt, 'i', $id);

//     return mysqli_stmt_execute($stmt);
// }
?>
<?php
require_once __DIR__ . '/../config/db.php';

class Category {

    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    // ─── CATEGORIES ───────────────────────────────────────────

    // Get all categories with their subcategory count (Filtering out deleted ones)
    public function getAll() {
        $stmt = $this->db->query(
            "SELECT c.id, c.name, c.icon_url,
                    COUNT(s.id) AS sub_count
             FROM categories c
             LEFT JOIN sub_categories s ON s.category_id = c.id AND s.is_deleted = 0
             WHERE c.is_deleted = 0
             GROUP BY c.id
             ORDER BY c.name ASC"
        );
        return $stmt->fetchAll();
    }

    // Add a new category
    public function create($name, $icon_url) {
        $stmt = $this->db->prepare(
            "INSERT INTO categories (name, icon_url) VALUES (?, ?)"
        );
        $stmt->execute([$name, $icon_url]);
        return $this->db->lastInsertId(); // returns the new category's id
    }

    // Delete a category (Soft Delete)
    public function delete($id) {
        $stmt = $this->db->prepare(
            "UPDATE categories SET is_deleted = 1 WHERE id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0; // true if something was updated
    }

    // Update a category name and icon
    public function update($id, $name, $icon_url) {
        $stmt = $this->db->prepare(
            "UPDATE categories SET name = ?, icon_url = ? WHERE id = ?"
        );
        $stmt->execute([$name, $icon_url, $id]);
        return $stmt->rowCount() > 0;
    }

    // ─── SUBCATEGORIES ────────────────────────────────────────

    // Get all subcategories for a specific category (Filtering out deleted ones)
    public function getSubcategories($category_id) {
        $stmt = $this->db->prepare(
            "SELECT id, name FROM sub_categories
             WHERE category_id = ? AND is_deleted = 0
             ORDER BY name ASC"
        );
        $stmt->execute([$category_id]);
        return $stmt->fetchAll();
    }

    // Add a new subcategory under a category
    public function createSubcategory($category_id, $name) {
        $stmt = $this->db->prepare(
            "INSERT INTO sub_categories (category_id, name) VALUES (?, ?)"
        );
        $stmt->execute([$category_id, $name]);
        return $this->db->lastInsertId();
    }

    // Delete a subcategory (Soft Delete)
    public function deleteSubcategory($id) {
        $stmt = $this->db->prepare(
            "UPDATE sub_categories SET is_deleted = 1 WHERE id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}