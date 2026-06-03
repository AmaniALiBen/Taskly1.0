<?php
class WalletModel {
    private $conn;
    
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * الحصول على بيانات المحفظة
     */
    public function getWalletData($userId) {
        $stmt = $this->conn->prepare("SELECT balance, wallet_pin_hash FROM wallets WHERE user_id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * إنشاء محفظة جديدة للمستخدم
     */
    public function createWallet($userId, $pinHash) {
        $stmt = $this->conn->prepare("INSERT INTO wallets (user_id, balance, wallet_pin_hash) VALUES (?, 0.00, ?)");
        return $stmt->execute([$userId, $pinHash]);
    }

    /**
     * تحديث PIN
     */
    public function updatePin($userId, $newPinHash) {
        $stmt = $this->conn->prepare("UPDATE wallets SET wallet_pin_hash = ? WHERE user_id = ?");
        return $stmt->execute([$newPinHash, $userId]);
    }

    /**
     * إضافة رصيد
     */
    public function addBalance($userId, $amount) {
        $stmt = $this->conn->prepare("UPDATE wallets SET balance = balance + ? WHERE user_id = ?");
        return $stmt->execute([$amount, $userId]);
    }

    /**
     * خصم رصيد
     */
    public function deductBalance($userId, $amount) {
        // التحقق من كفاية الرصيد
        $wallet = $this->getWalletData($userId);
        if (!$wallet || $wallet['balance'] < $amount) {
            return false;
        }
        
        $stmt = $this->conn->prepare("UPDATE wallets SET balance = balance - ? WHERE user_id = ?");
        return $stmt->execute([$amount, $userId]);
    }

    /**
     * التحقق من صحة PIN
     */
    public function verifyPin($userId, $enteredPin) {
        $wallet = $this->getWalletData($userId);
        if (!$wallet || empty($wallet['wallet_pin_hash'])) {
            return false;
        }
        
        return password_verify($enteredPin, $wallet['wallet_pin_hash']);
    }

    /**
     * تعيين أو تغيير PIN
     */
    public function setPin($userId, $newPin, $currentPin = null) {
        // إذا كان هناك PIN حالياً، تحقق منه
        if ($currentPin !== null) {
            if (!$this->verifyPin($userId, $currentPin)) {
                return false;
            }
        }
        
        $pinHash = password_hash($newPin, PASSWORD_DEFAULT);
        
        $wallet = $this->getWalletData($userId);
        if (!$wallet) {
            return $this->createWallet($userId, $pinHash);
        } else {
            return $this->updatePin($userId, $pinHash);
        }
    }
}
?>