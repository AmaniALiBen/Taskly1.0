<?php
function getAllCategories($conn) {
    $sql = 'SELECT id, name, icon_url AS icon FROM categories ORDER BY id';
    $result = mysqli_query($conn, $sql);

    if (!$result) {
        return false;
    }

    $categories = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $categories[] = $row;
    }

    return $categories;
}

function createCategory($conn, $name, $icon) {
    $stmt = mysqli_prepare($conn, 'INSERT INTO categories (name, icon_url) VALUES (?, ?)');
    mysqli_stmt_bind_param($stmt, 'ss', $name, $icon);

    if (!mysqli_stmt_execute($stmt)) {
        return false;
    }

    return mysqli_insert_id($conn);
}

function updateCategoryName($conn, $id, $name) {
    $stmt = mysqli_prepare($conn, 'UPDATE categories SET name = ? WHERE id = ?');
    mysqli_stmt_bind_param($stmt, 'si', $name, $id);

    return mysqli_stmt_execute($stmt);
}

function deleteCategoryById($conn, $id) {
    $stmt = mysqli_prepare($conn, 'DELETE FROM categories WHERE id = ?');
    mysqli_stmt_bind_param($stmt, 'i', $id);

    return mysqli_stmt_execute($stmt);
}
?>
