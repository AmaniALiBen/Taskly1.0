<?php
require_once __DIR__ . '/../helpers/Response.php';

function getCurrentUser() {
    if (!isset($_SESSION['user_id'])) {
        sendJson(['loggedIn' => false]);
    }

    $avatar = trim($_SESSION['avatar'] ?? '');
    $avatar = str_replace('\\', '/', $avatar);

    if ($avatar !== '' && $avatar !== 'null' && !preg_match('/^https?:\/\//', $avatar) && substr($avatar, 0, 3) !== '../') {
        $avatar = '../' . ltrim($avatar, '/');
    }

    sendJson([
        'loggedIn' => true,
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'] ?? '',
        'email' => $_SESSION['email'] ?? '',
        'role' => $_SESSION['role'] ?? '',
        'avatar' => $avatar
    ]);
}
?>
