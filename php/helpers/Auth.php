<?php
function startSessionIfNeeded() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function currentUserIsAdmin() {
    startSessionIfNeeded();
    return isset($_SESSION['user_id']) && ($_SESSION['role'] ?? '') === 'admin';
}

function requireAdmin() {
    if (!currentUserIsAdmin()) {
        sendJson(['success' => false, 'error' => 'Unauthorized'], 403);
    }
}
?>
