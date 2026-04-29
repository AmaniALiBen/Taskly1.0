<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    $avatar = $_SESSION['avatar'] ?? '';
    $avatar = str_replace('\\', '/', $avatar);
    $avatar = trim($avatar);
    
    echo json_encode([
        'loggedIn' => true,
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'email' => $_SESSION['email'],
        'role' => $_SESSION['role'],
        'avatar' => $avatar
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}
?>