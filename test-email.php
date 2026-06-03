<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/vendor/PHPMailer/src/Exception.php';
require_once __DIR__ . '/vendor/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/vendor/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

echo "<h2>Testing Email - Alternative Method</h2>";

try {
    $mail = new PHPMailer(true);
    
    $mail->SMTPDebug = 2;
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'Tasklymarketplace@gmail.com';
    $mail->Password   = 'aiugaanbftjuotpv';  // Try your regular password
    $mail->SMTPSecure = 'tls';
    $mail->Port       = 587;
    $mail->setFrom('Tasklymarketplace@gmail.com', 'Taskly Test');
    $mail->addAddress('memolmlm2@gmail.com', 'Test User');
    $mail->isHTML(true);
    $mail->Subject = 'Test Email from Taskly';
    $mail->Body    = 'This is a test email.';
    
    $mail->send();
    echo "✅ Email sent successfully!";
    
} catch (Exception $e) {
    echo "❌ Email failed: " . $mail->ErrorInfo;
}
?>