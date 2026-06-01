<?php
function findUserByEmail($conn, $email) {
    $stmt = mysqli_prepare($conn, '
        SELECT
            id,
            name AS username,
            email,
            password_hash,
            role,
            picture_name AS avatar
        FROM users
        WHERE email = ? AND is_deleted = FALSE AND is_active = TRUE
        LIMIT 1
    ');
    mysqli_stmt_bind_param($stmt, 's', $email);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);
    return mysqli_fetch_assoc($result);
}
?>
