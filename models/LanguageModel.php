<?php
// models/LanguageModel.php

class LanguageModel {
    private $db;

    public function __construct($databaseConnection) {
        $this->db = $databaseConnection;
    }

    // جلب جميع اللغات
    public function getAllLanguages() {
        $sql = "SELECT id, name FROM languages ORDER BY name";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        
        $languages = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $languages[] = $row;
        }
        return $languages;
    }

    // جلب لغة حسب ID
    public function getLanguageById($id) {
        $sql = "SELECT id, name FROM languages WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // حفظ لغات البائع
    public function saveSellerLanguages($sellerId, $languageIds) {
        $deleteSql = "DELETE FROM seller_languages WHERE seller_id = ?";
        $deleteStmt = $this->db->prepare($deleteSql);
        $deleteStmt->execute([$sellerId]);

        if (!empty($languageIds)) {
            $insertSql = "INSERT INTO seller_languages (seller_id, language_id) VALUES (?, ?)";
            $insertStmt = $this->db->prepare($insertSql);
            
            foreach ($languageIds as $languageId) {
                $insertStmt->execute([$sellerId, $languageId]);
            }
        }
        return true;
    }

    // جلب لغات بائع معين
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