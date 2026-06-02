<?php
// $servername = "localhost";
// $username = "root";
// $password = "";
// $dbname = "taskly";

// $conn = mysqli_connect($servername, $username, $password, $dbname);

// if (!$conn) {
//     http_response_code(500);
//     header('Content-Type: application/json');
//     echo json_encode(['success' => false, 'error' => 'Database connection failed']);
//     exit;
// }

// mysqli_set_charset($conn, 'utf8mb4');
?> 


<?php

 
define('DB_HOST', 'localhost');
define('DB_NAME', 'taskly');
define('DB_USER', 'root');       
define('DB_PASS', '');          
function getDB() {
    static $db = null; 
 
    if ($db === null) {
        try {
            $db = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS
            );
            // Show errors during development
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Return rows as associative arrays by default
            $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Return a clean JSON error instead of crashing
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database connection failed']);
            exit;
        }
    }
 
    return $db;
}