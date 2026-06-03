<?php
// models/CountryModel.php

class CountryModel {
    private $db;

    public function __construct($databaseConnection) {
        $this->db = $databaseConnection;
    }

    // جلب جميع الدول
    public function getAllCountries() {
        $sql = "SELECT id, name FROM countries ORDER BY name";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        
        $countries = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $countries[] = $row;
        }
        return $countries;
    }

    // جلب دولة حسب ID
    public function getCountryById($id) {
        $sql = "SELECT id, name FROM countries WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>