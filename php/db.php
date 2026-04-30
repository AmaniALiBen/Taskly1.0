<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "Taskly";

$conn = mysqli_connect($servername, $username, $password, $dbname);
if($conn) echo "good";
?>