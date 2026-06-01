<?php
function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function appUrl($path) {
    $scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
    $phpPosition = strpos($scriptName, '/php/');
    $basePath = $phpPosition === false ? '' : substr($scriptName, 0, $phpPosition);

    return $basePath . '/' . ltrim($path, '/');
}
?>
