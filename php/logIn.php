<?php
session_start();

$conn = mysqli_connect('localhost', 'root', '', 'Taskly');

if (!$conn) {
    die("Connection failed");
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $password = $_POST['pass'];
    $remember = isset($_POST['remember']) ? true : false;
    
    $sql = "SELECT * FROM Accounts WHERE email = '$email'";
    $result = mysqli_query($conn, $sql);
    $user = mysqli_fetch_assoc($result);
    
    if ($user && $password == $user['pass']) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];
        
        $avatar = trim($user['avatar'] ?? '');
        $avatar = str_replace('//', '', $avatar);
        $avatar = str_replace("\r", '', $avatar);
        $avatar = str_replace("\n", '', $avatar);
      


        $avatar = stripslashes($avatar);
        $_SESSION['avatar'] = $avatar;
        
        if ($remember) {
            setcookie('remember_email', $email, time() + (86400 * 30), '/');
        }
        
        if ($user['role'] == 'admin') {
            header("Location: ../pages/admin.html");
        } else if($user['role'] == 'freelancer'){
            header("Location: ../pages/sellerDashboard.html");
        }else if($user['role'] == 'buyer'){
            header("Location: ../pages/order-tracking.html");
        }else
            {
            header("Location: ../index.html");
        }
        exit();
    } else {
        header("Location: ../index.html?error=invalid");
        exit();
    }
}

mysqli_close($conn);
?>