<?php
// models/UserModel.php

class UserModel {
    private $db;

    public function __construct($databaseConnection) {
        $this->db = $databaseConnection; 
    }

    // التحقق من تكرار البريد الإلكتروني
    public function emailExists($email) {
        $sql = "SELECT id FROM users WHERE email = ? LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
        return $stmt->rowCount() > 0;
    }

    // إدخال مستخدم جديد بصفتة مشتري (Buyer)
    public function createBuyer($name, $email, $passwordHash) {
        $role = 'buyer';
        $sql = "INSERT INTO users (name, email, password_hash, role, is_active, is_deleted) 
                VALUES (?, ?, ?, ?, 1, 0)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$name, $email, $passwordHash, $role]);
    }

    // إدخال بائع جديد (يغذي جدولي users و seller_details معاً)
    public function createSeller($baseData, $detailData) {
        try {
            $this->db->beginTransaction();

            // 1. إدخال المستخدم أولاً
            $role = 'seller';
            $sqlUser = "INSERT INTO users (name, email, password_hash, role, picture_name, is_active, is_deleted) 
                        VALUES (?, ?, ?, ?, NULL, 1, 0)";
            $stmtUser = $this->db->prepare($sqlUser);
            $stmtUser->execute([
                $baseData['name'], 
                $baseData['email'], 
                $baseData['password_hash'], 
                $role
            ]);
            
            $sellerId = $this->db->lastInsertId();

            // 2. إنشاء اسم الصورة: {id}_{microtime}.{extension}
            $timestamp = microtime(true);
            $timestampStr = str_replace('.', '', (string)$timestamp);
            $fileExtension = $baseData['file_extension'];
            $finalPictureName = $sellerId . '_' . $timestampStr . '.' . $fileExtension;

            // 3. تحديث حقل picture_name باسم الملف النهائي
            $sqlUpdatePic = "UPDATE users SET picture_name = ? WHERE id = ?";
            $stmtUpdatePic = $this->db->prepare($sqlUpdatePic);
            $stmtUpdatePic->execute([$finalPictureName, $sellerId]);

            // 4. إدخال تفاصيل البائع
            $sqlDetails = "INSERT INTO seller_details (seller_id, country_id, experience, about_me, level) 
                           VALUES (?, ?, ?, ?, 'raising star')";
            $stmtDetails = $this->db->prepare($sqlDetails);
            $stmtDetails->execute([
                $sellerId, 
                $detailData['country_id'], 
                $detailData['experience'], 
                $detailData['about_me']
            ]);

            $this->db->commit();

            return [
                'seller_id' => $sellerId,
                'picture_name' => $finalPictureName
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    // جلب المستخدم عن طريق البريد الإلكتروني
    public function getUserByEmail($email) {
        $sql = "SELECT id, name, email, password_hash, role, picture_name, is_active 
                FROM users 
                WHERE email = ? AND is_deleted = 0 
                LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // جلب رصيد المحفظة للمستخدم
    public function getWalletBalance($userId) {
        $sql = "SELECT balance FROM wallets WHERE user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
        return $wallet ? $wallet['balance'] : 0;
    }

    // حفظ تذكرة "تذكرني"
    public function saveRememberToken($userId, $token, $expiry) {
        $deleteSql = "DELETE FROM user_tokens WHERE user_id = ?";
        $deleteStmt = $this->db->prepare($deleteSql);
        $deleteStmt->execute([$userId]);
        
        $sql = "INSERT INTO user_tokens (user_id, token, expiry_date) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$userId, $token, $expiry]);
    }

    // جلب مستخدم عن طريق تذكرة "تذكرني"
    public function getUserByRememberToken($token) {
        $sql = "SELECT u.id, u.name, u.email, u.role, ut.expiry_date as token_expiry 
                FROM users u 
                INNER JOIN user_tokens ut ON u.id = ut.user_id 
                WHERE ut.token = ? AND u.is_deleted = 0 AND u.is_active = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // حذف تذكرة "تذكرني"
    public function deleteRememberToken($userId) {
        $sql = "DELETE FROM user_tokens WHERE user_id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$userId]);
    }

    // جلب تفاصيل البائع (للبائع فقط)
    public function getSellerDetails($sellerId) {
        $sql = "SELECT sd.*, c.name as country_name 
                FROM seller_details sd 
                LEFT JOIN countries c ON sd.country_id = c.id 
                WHERE sd.seller_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sellerId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // جلب لغات البائع
    public function getSellerLanguages($sellerId) {
        $sql = "SELECT l.id, l.name 
                FROM languages l 
                INNER JOIN seller_languages sl ON l.id = sl.language_id 
                WHERE sl.seller_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sellerId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>