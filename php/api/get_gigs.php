<?php
session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/GigController.php';

listGigs($conn);
?>
