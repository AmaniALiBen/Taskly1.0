<?php
require_once __DIR__ . '/../vendor/PHPMailer/src/Exception.php';
require_once __DIR__ . '/../vendor/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailHelper {
    
    private static function getMailer() {
        $mail = new PHPMailer(true);
        
        // Server settings
        $mail->SMTPDebug = SMTP::DEBUG_OFF;          // Disable debug output
        $mail->isSMTP();                             // Send using SMTP
        $mail->Host       = 'smtp.gmail.com';        // Gmail SMTP server
        $mail->SMTPAuth   = true;                    // Enable SMTP authentication
        $mail->Username   = 'Tasklymarketplace@gmail.com';
        $mail->Password   = 'aiugaanbftjuotpv';  // Try your regular password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        
        $mail->setFrom('Tasklymarketplace@gmail.com', 'Taskly Marketplace');
        
        return $mail;
    }
    
    /**
     * Send account status notification (suspended/activated)
     */
    public static function sendAccountStatusEmail($toEmail, $userName, $status) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($toEmail, $userName);
            
            $mail->isHTML(true);
            $mail->Subject = 'Your Taskly Account Has Been ' . ucfirst($status);
            
            $statusText = $status === 'suspended' ? 'suspended' : 'activated';
            $actionText = $status === 'suspended' ? 'suspended' : 'activated';
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; border-radius: 12px;'>
                    <h2 style='color: #7c3aed;'>Taskly Marketplace</h2>
                    <p>Dear <strong>{$userName}</strong>,</p>
                    <p>Your Taskly account has been <strong style='color: " . ($status === 'suspended' ? '#ef4444' : '#10b981') . ";'>{$statusText}</strong>.</p>
                    <p>If you believe this is a mistake, please contact our support team.</p>
                    <hr style='border-color: #333;'>
                    <p style='font-size: 12px; color: #666;'>Taskly Marketplace - Where talent meets opportunity</p>
                </div>
            ";
            
            $mail->AltBody = "Your Taskly account has been {$statusText}.\n\nIf you believe this is a mistake, please contact support.";
            
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Email failed: " . $mail->ErrorInfo);
            return false;
        }
    }
    
    /**
     * Send account deletion notification
     */
    public static function sendAccountDeletedEmail($toEmail, $userName) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($toEmail, $userName);
            
            $mail->isHTML(true);
            $mail->Subject = 'Your Taskly Account Has Been Deleted';
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; border-radius: 12px;'>
                    <h2 style='color: #7c3aed;'>Taskly Marketplace</h2>
                    <p>Dear <strong>{$userName}</strong>,</p>
                    <p>Your Taskly account has been <strong style='color: #ef4444;'>deleted</strong>.</p>
                    <p>All your gigs and orders have been processed according to our policies.</p>
                    <p>If you believe this is a mistake, please contact our support team within 30 days.</p>
                    <hr style='border-color: #333;'>
                    <p style='font-size: 12px; color: #666;'>Taskly Marketplace - Where talent meets opportunity</p>
                </div>
            ";
            
            $mail->AltBody = "Your Taskly account has been deleted.\n\nAll your gigs and orders have been processed.\n\nIf you believe this is a mistake, please contact support.";
            
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Email failed: " . $mail->ErrorInfo);
            return false;
        }
    }
    
    /**
     * Send order refund notification (for buyer when seller is deleted)
     */
    public static function sendRefundEmail($toEmail, $userName, $orderId, $amount) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($toEmail, $userName);
            
            $mail->isHTML(true);
            $mail->Subject = 'Order Cancelled - Refund Issued';
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; border-radius: 12px;'>
                    <h2 style='color: #7c3aed;'>Taskly Marketplace</h2>
                    <p>Dear <strong>{$userName}</strong>,</p>
                    <p>Order #{$orderId} has been <strong style='color: #ef4444;'>cancelled</strong>.</p>
                    <p>A refund of <strong style='color: #10b981;'>\${$amount}</strong> has been credited to your Taskly wallet.</p>
                    <hr style='border-color: #333;'>
                    <p style='font-size: 12px; color: #666;'>Taskly Marketplace - Where talent meets opportunity</p>
                </div>
            ";
            
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Email failed: " . $mail->ErrorInfo);
            return false;
        }
    }
    
    /**
     * Send payment release notification (for seller when buyer is deleted)
     */
    public static function sendPaymentReleasedEmail($toEmail, $userName, $orderId, $amount) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($toEmail, $userName);
            
            $mail->isHTML(true);
            $mail->Subject = 'Order Payment Released';
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; border-radius: 12px;'>
                    <h2 style='color: #7c3aed;'>Taskly Marketplace</h2>
                    <p>Dear <strong>{$userName}</strong>,</p>
                    <p>Payment for Order #{$orderId} has been <strong style='color: #10b981;'>released</strong> to your wallet.</p>
                    <p>Amount: <strong style='color: #10b981;'>\${$amount}</strong></p>
                    <hr style='border-color: #333;'>
                    <p style='font-size: 12px; color: #666;'>Taskly Marketplace - Where talent meets opportunity</p>
                </div>
            ";
            
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Email failed: " . $mail->ErrorInfo);
            return false;
        }
    }
}
?>