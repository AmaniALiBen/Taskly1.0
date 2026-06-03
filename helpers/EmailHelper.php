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
        
        // ✅ حل مشكلة SSL certificate
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );
        
        // Server settings
        $mail->SMTPDebug = SMTP::DEBUG_OFF;          // Disable debug output
        $mail->isSMTP();                             // Send using SMTP
        $mail->Host       = 'smtp.gmail.com';        // Gmail SMTP server
        $mail->SMTPAuth   = true;                    // Enable SMTP authentication
        $mail->Username   = 'Tasklymarketplace@gmail.com';
        $mail->Password   = 'aiugaanbftjuotpv';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        
        $mail->setFrom('Tasklymarketplace@gmail.com', 'Taskly Marketplace');
        $mail->CharSet = 'UTF-8';  // ✅ حل مشكلة الرموز المشوشة
        
        return $mail;
    }
    
    /**
     * Send email to BUYER when seller is deleted (refund notification)
     */
    public static function sendSellerDeletedEmail($toEmail, $buyerName, $orderId, $amount, $gigTitle) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($toEmail, $buyerName);
            
            $mail->isHTML(true);
            $mail->Subject = '⚠️ Seller Deactivated - Order Cancelled & Refunded';
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e0e0e0;'>
                    <div style='background: #ef4444; color: white; padding: 15px; text-align: center; border-radius: 10px; margin-bottom: 20px;'>
                        <h2 style='margin: 0;'>⚠️ Seller Account Deactivated</h2>
                    </div>
                    
                    <p style='color: #333;'>Dear <strong>" . htmlspecialchars($buyerName) . "</strong>,</p>
                    <p style='color: #555;'>We regret to inform you that the seller for your order has been deactivated from Taskly.</p>
                    
                    <div style='background: #f0f0f5; padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #7c3aed;'>
                        <h3 style='margin: 0 0 10px 0; color: #7c3aed;'>📋 Order Details:</h3>
                        <p style='color: #333;'><strong>Order ID:</strong> #{$orderId}</p>
                        <p style='color: #333;'><strong>Service:</strong> " . htmlspecialchars($gigTitle) . "</p>
                    </div>
                    
                    <div style='background: #d1fae5; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: center; border-left: 4px solid #10b981;'>
                        <p style='margin: 0; color: #065f46;'><strong>✅ Refund Issued</strong></p>
                        <p style='font-size: 24px; margin: 10px 0 0 0; color: #065f46;'>$" . number_format($amount, 2) . "</p>
                        <p style='margin: 5px 0 0 0; color: #065f46;'>has been credited to your Taskly wallet</p>
                    </div>
                    
                    <p style='color: #555;'>We apologize for any inconvenience this may cause.</p>
                    <hr style='border-color: #e0e0e0;'>
                    <p style='font-size: 12px; color: #888;'>Taskly Marketplace - Where talent meets opportunity</p>
                </div>
            ";
            
            $mail->AltBody = "Seller Account Deactivated\n\nOrder #{$orderId} has been cancelled. A refund of \${$amount} has been credited to your Taskly wallet.";
            
            $mail->send();
            error_log("✅ Seller deleted email sent to buyer: {$toEmail}");
            return true;
            
        } catch (Exception $e) {
            error_log("❌ Email failed to {$toEmail}: " . $mail->ErrorInfo);
            return false;
        }
    }
    
    /**
     * Send email to SELLER when buyer is deleted (payment release notification)
     */
    public static function sendBuyerDeletedEmail($toEmail, $sellerName, $orderId, $amount, $gigTitle) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($toEmail, $sellerName);
            
            $mail->isHTML(true);
            $mail->Subject = '📌 Buyer Deactivated - Order Payment Released';
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e0e0e0;'>
                    <div style='background: #7c3aed; color: white; padding: 15px; text-align: center; border-radius: 10px; margin-bottom: 20px;'>
                        <h2 style='margin: 0;'>📌 Buyer Account Deactivated</h2>
                    </div>
                    
                    <p style='color: #333;'>Dear <strong>" . htmlspecialchars($sellerName) . "</strong>,</p>
                    <p style='color: #555;'>The buyer for your order has been deactivated from Taskly.</p>
                    
                    <div style='background: #f0f0f5; padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #7c3aed;'>
                        <h3 style='margin: 0 0 10px 0; color: #7c3aed;'>📋 Order Details:</h3>
                        <p style='color: #333;'><strong>Order ID:</strong> #{$orderId}</p>
                        <p style='color: #333;'><strong>Service:</strong> " . htmlspecialchars($gigTitle) . "</p>
                    </div>
                    
                    <div style='background: #d1fae5; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: center; border-left: 4px solid #10b981;'>
                        <p style='margin: 0; color: #065f46;'><strong>💰 Payment Released</strong></p>
                        <p style='font-size: 24px; margin: 10px 0 0 0; color: #065f46;'>$" . number_format($amount, 2) . "</p>
                        <p style='margin: 5px 0 0 0; color: #065f46;'>has been credited to your Taskly wallet</p>
                    </div>
                    
                    <p style='color: #555;'>Thank you for your continued work on Taskly.</p>
                    <hr style='border-color: #e0e0e0;'>
                    <p style='font-size: 12px; color: #888;'>Taskly Marketplace - Where talent meets opportunity</p>
                </div>
            ";
            
            $mail->AltBody = "Buyer Account Deactivated\n\nOrder #{$orderId} has been completed. Payment of \${$amount} has been credited to your Taskly wallet.";
            
            $mail->send();
            error_log("✅ Buyer deleted email sent to seller: {$toEmail}");
            return true;
            
        } catch (Exception $e) {
            error_log("❌ Email failed to {$toEmail}: " . $mail->ErrorInfo);
            return false;
        }
    }
    
    /**
     * Send account deletion notification (to the deleted user)
     */
    public static function sendAccountDeletedEmail($toEmail, $userName) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($toEmail, $userName);
            
            $mail->isHTML(true);
            $mail->Subject = 'Your Taskly Account Has Been Deleted';
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e0e0e0;'>
                    <div style='background: #7c3aed; color: white; padding: 15px; text-align: center; border-radius: 10px; margin-bottom: 20px;'>
                        <h2 style='margin: 0;'>Taskly Marketplace</h2>
                    </div>
                    <h2 style='color: #7c3aed;'>Account Deleted</h2>
                    <p style='color: #333;'>Dear <strong>{$userName}</strong>,</p>
                    <p style='color: #555;'>Your Taskly account has been <strong style='color: #ef4444;'>deleted</strong>.</p>
                    <p style='color: #555;'>All your gigs and orders have been processed according to our policies.</p>
                    <p style='color: #555;'>If you believe this is a mistake, please contact our support team within 30 days.</p>
                    <hr style='border-color: #e0e0e0;'>
                    <p style='font-size: 12px; color: #888;'>Taskly Marketplace - Where talent meets opportunity</p>
                </div>
            ";
            
            $mail->AltBody = "Your Taskly account has been deleted.\n\nAll your gigs and orders have been processed.\n\nIf you believe this is a mistake, please contact support.";
            
            $mail->send();
            error_log("✅ Account deleted email sent to: {$toEmail}");
            return true;
            
        } catch (Exception $e) {
            error_log("❌ Email failed to {$toEmail}: " . $mail->ErrorInfo);
            return false;
        }
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
            $color = $status === 'suspended' ? '#ef4444' : '#10b981';
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e0e0e0;'>
                    <div style='background: #7c3aed; color: white; padding: 15px; text-align: center; border-radius: 10px; margin-bottom: 20px;'>
                        <h2 style='margin: 0;'>Taskly Marketplace</h2>
                    </div>
                    <p style='color: #333;'>Dear <strong>{$userName}</strong>,</p>
                    <p style='color: #555;'>Your Taskly account has been <strong style='color: {$color};'>{$statusText}</strong>.</p>
                    <p style='color: #555;'>If you believe this is a mistake, please contact our support team.</p>
                    <hr style='border-color: #e0e0e0;'>
                    <p style='font-size: 12px; color: #888;'>Taskly Marketplace - Where talent meets opportunity</p>
                </div>
            ";
            
            $mail->AltBody = "Your Taskly account has been {$statusText}.\n\nIf you believe this is a mistake, please contact support.";
            
            $mail->send();
            error_log("✅ Account status email sent to: {$toEmail} (status: {$status})");
            return true;
            
        } catch (Exception $e) {
            error_log("❌ Email failed to {$toEmail}: " . $mail->ErrorInfo);
            return false;
        }
    }
}
?>