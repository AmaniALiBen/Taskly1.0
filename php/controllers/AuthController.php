<?php
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../models/User.php';

function wantsJsonResponse() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';

    return stripos($contentType, 'application/json') !== false || stripos($accept, 'application/json') !== false;
}

function sendLoginFailure($message = 'Invalid email or password') {
    if (wantsJsonResponse()) {
        sendJson(['success' => false, 'message' => $message]);
    }

    header('Location: ' . appUrl('index.html?error=invalid'));
    exit;
}

function sendLoginSuccess($user) {
    if (wantsJsonResponse()) {
        sendJson([
            'success' => true,
            'user_id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'avatar' => $_SESSION['avatar']
        ]);
    }

    if ($user['role'] === 'admin') {
        header('Location: ' . appUrl('pages/admin.html'));
    } elseif ($user['role'] === 'seller') {
        header('Location: ' . appUrl('pages/sellerDashboard.html'));
    } elseif ($user['role'] === 'buyer') {
        header('Location: ' . appUrl('pages/order-tracking.html'));
    } else {
        header('Location: ' . appUrl('index.html'));
    }

    exit;
}

function login($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendLoginFailure('Invalid request method');
    }

    $input = [];
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
    } else {
        $input = $_POST;
    }

    $email = trim($input['email'] ?? '');
    $password = $input['pass'] ?? ($input['password'] ?? '');
    $remember = !empty($input['remember']);

    if ($email === '' || $password === '') {
        sendLoginFailure('Email and password are required');
    }

    $user = findUserByEmail($conn, $email);

    if (!$user || !isValidPassword($password, $user['password_hash'])) {
        sendLoginFailure();
    }

    $avatar = trim($user['avatar'] ?? '');
    $avatar = str_replace('\\', '/', $avatar);
    $avatar = str_replace(["\r", "\n"], '', $avatar);

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['avatar'] = $avatar;

    if ($remember) {
        setcookie('remember_email', $email, time() + (86400 * 30), '/');
    }

    sendLoginSuccess($user);
}

function isValidPassword($password, $storedHash) {
    if (password_verify($password, $storedHash)) {
        return true;
    }

    // Compatibility for old local demo rows that were saved as plain text.
    return hash_equals((string)$storedHash, (string)$password);
}
?>
