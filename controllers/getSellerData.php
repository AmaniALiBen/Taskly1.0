<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/CountryModel.php';
require_once __DIR__ . '/../models/LanguageModel.php';

$response = ['success' => false, 'countries' => [], 'languages' => []];

try {
    $countryModel = new CountryModel($conn);
    $languageModel = new LanguageModel($conn);

    $response['countries'] = $countryModel->getAllCountries();
    $response['languages'] = $languageModel->getAllLanguages();
    $response['success'] = true;
} catch (Exception $e) {
    $response['message'] = 'Database error: ' . $e->getMessage();
}

echo json_encode($response);
