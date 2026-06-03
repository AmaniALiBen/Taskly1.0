<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Gig.php';

$gigModel = new Gig();
$action   = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    // ── GET SELLER'S GIGS ─────────────────────────────────────
    case 'my_gigs':
        $seller_id = $_SESSION['user_id'] ?? 0;
        if ($seller_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }
        $gigs = $gigModel->getSellerGigs($seller_id);

        $formatted = [];
        foreach ($gigs as $gig) {
            $formatted[] = [
                'id'       => $gig['id'],
                'title'    => $gig['title'],
                'price'    => (float)($gig['price'] ?? 0),
                'category' => $gig['category_name'] ?? '',
                'status'   => $gig['is_active'] ? 'active' : 'paused',
                'image'    => $gig['image'] ?? null
            ];
        }
        echo json_encode(['success' => true, 'gigs' => $formatted]);
        break;

    // ── GET SINGLE GIG FOR EDITING ────────────────────────────
    case 'get':
        $gig_id = (int)($_GET['gig_id'] ?? 0);
        if ($gig_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid gig ID']);
            break;
        }
        $data = $gigModel->getCompleteGigForEdit($gig_id);
        if (!$data) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Gig not found']);
            break;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    // ── GET GIG DETAILS PAGE ──────────────────────────────────
    case 'get_gig_details':
        $gig_id = (int)($_GET['id'] ?? 0);
        if ($gig_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid gig ID']);
            break;
        }
        $data = $gigModel->getPublicGigDetails($gig_id);
        if (!$data) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Gig not found']);
            break;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    // ── PUBLIC GIGS FOR HOMEPAGE ──────────────────────────────
    case 'public_gigs':
        $limit = (int)($_GET['limit'] ?? 8);
        $gigs  = $gigModel->getPublicGigs($limit);
        echo json_encode(['success' => true, 'data' => $gigs]);
        break;

    // ── CREATE GIG ────────────────────────────────────────────
    case 'create':
        $seller_id = $_SESSION['user_id'] ?? 0;
        if ($seller_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }

        $title           = trim($_POST['title'] ?? '');
        $description     = trim($_POST['description'] ?? '');
        $sub_category_id = (int)($_POST['sub_category_id'] ?? 0);
        $packages        = $_POST['packages'] ?? [];

        if (empty($title) || empty($description) || $sub_category_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Please fill all required fields']);
            break;
        }

        foreach (['basic', 'standard', 'premium'] as $type) {
            if (!isset($packages[$type])) {
                echo json_encode(['success' => false, 'message' => "Package {$type} data is missing"]);
                break 2;
            }
            if ((float)($packages[$type]['price'] ?? 0) <= 0 || (int)($packages[$type]['delivery_time_days'] ?? 0) <= 0) {
                echo json_encode(['success' => false, 'message' => "Price and delivery for {$type} must be greater than zero"]);
                break 2;
            }
        }

        $gig_id = $gigModel->create($seller_id, $sub_category_id, $title, $description);
        if (!$gig_id) {
            echo json_encode(['success' => false, 'message' => 'Failed to save gig']);
            break;
        }

        foreach (['basic', 'standard', 'premium'] as $type) {
            $price     = (float)$packages[$type]['price'];
            $delivery  = (int)$packages[$type]['delivery_time_days'];
            $revisions = (int)($packages[$type]['revisions_allowed'] ?? 0);
            $features  = $packages[$type]['features'] ?? [];

            $package_id = $gigModel->addPackage($gig_id, $type, $price, $delivery, $revisions);
            if ($package_id && !empty($features)) {
                $gigModel->addFeatures($package_id, $features);
            }
        }

        if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
            $count = count($_FILES['images']['name']);
            for ($i = 0; $i < $count; $i++) {
                if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
                    $gigModel->uploadGigImage($gig_id, [
                        'name'     => $_FILES['images']['name'][$i],
                        'type'     => $_FILES['images']['type'][$i],
                        'tmp_name' => $_FILES['images']['tmp_name'][$i],
                        'error'    => $_FILES['images']['error'][$i],
                        'size'     => $_FILES['images']['size'][$i]
                    ], $i === 0);
                }
            }
        }

        echo json_encode(['success' => true, 'message' => 'Gig created successfully!', 'gig_id' => $gig_id]);
        break;

    // ── UPDATE GIG ────────────────────────────────────────────
    case 'update':
        $gig_id          = (int)($_POST['gig_id'] ?? 0);
        $title           = trim($_POST['title'] ?? '');
        $description     = trim($_POST['description'] ?? '');
        $sub_category_id = (int)($_POST['sub_category_id'] ?? 0);
        $packages        = $_POST['packages'] ?? [];

        if ($gig_id <= 0 || empty($title) || empty($description) || $sub_category_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Please fill all required fields']);
            break;
        }

        $gigModel->update($gig_id, $sub_category_id, $title, $description, true);

        foreach (['basic', 'standard', 'premium'] as $type) {
            if (!isset($packages[$type])) continue;
            $price     = (float)($packages[$type]['price'] ?? 0);
            $delivery  = (int)($packages[$type]['delivery_time_days'] ?? 1);
            $revisions = (int)($packages[$type]['revisions_allowed'] ?? 0);
            $features  = $packages[$type]['features'] ?? [];

            if ($price > 0 && $delivery > 0) {
                $gigModel->updatePackage($gig_id, $type, $price, $delivery, $revisions);
                $gigModel->updateFeatures($gig_id, $type, $features);
            }
        }

        if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
            $count = count($_FILES['images']['name']);
            for ($i = 0; $i < $count; $i++) {
                if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
                    $gigModel->uploadGigImage($gig_id, [
                        'name'     => $_FILES['images']['name'][$i],
                        'type'     => $_FILES['images']['type'][$i],
                        'tmp_name' => $_FILES['images']['tmp_name'][$i],
                        'error'    => $_FILES['images']['error'][$i],
                        'size'     => $_FILES['images']['size'][$i]
                    ], false);
                }
            }
        }

        echo json_encode(['success' => true, 'message' => 'Gig updated successfully!']);
        break;

    // ── DELETE GIG ────────────────────────────────────────────
    case 'delete':
        $gig_id = (int)($_GET['id'] ?? $_POST['id'] ?? 0);
        if ($gig_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid gig ID']);
            break;
        }
        $deleted = $gigModel->delete($gig_id);
        echo json_encode([
            'success' => $deleted,
            'message' => $deleted ? 'Gig deleted successfully' : 'Failed to delete'
        ]);
        break;

    // ── REPORT A GIG ─────────────────────────────────────────
    case 'report':
        $gig_id      = (int)($_POST['gig_id'] ?? 0);
        $reason      = trim($_POST['reason'] ?? '');
        $reporter_id = $_SESSION['user_id'] ?? 0;

        if ($reporter_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'You must be logged in']);
            break;
        }

        if ($gig_id <= 0 || empty($reason)) {
            echo json_encode(['success' => false, 'message' => 'Gig ID and reason are required']);
            break;
        }

        $result = $gigModel->submitReport($gig_id, $reporter_id, $reason);

        if ($result === 'already_reported') {
            echo json_encode(['success' => false, 'message' => 'You have already reported this gig']);
        } elseif ($result === 'ok') {
            echo json_encode(['success' => true, 'message' => 'Report submitted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to submit report']);
        }
        break;
        // ── TOGGLE GIG STATUS ─────────────────────────────────────────
case 'toggle_status':
    $gig_id    = (int)($_POST['gig_id'] ?? 0);
    $is_active = (int)($_POST['is_active'] ?? 0);

    if ($gig_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid gig ID']);
        break;
    }

    $updated = $gigModel->toggleStatus($gig_id, $is_active);
    echo json_encode([
        'success' => $updated,
        'message' => $updated
            ? ($is_active ? 'Gig activated' : 'Gig paused')
            : 'Failed to update status'
    ]);
    break;
    // ── SELLER PROFILE ────────────────────────────────────────
case 'seller_profile':
    $seller_id = (int)($_GET['seller_id'] ?? 0);
    if ($seller_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid seller ID']);
        break;
    }
    $data = $gigModel->getSellerProfile($seller_id);
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Seller not found']);
        break;
    }
    echo json_encode(['success' => true, 'data' => $data]);
    break;

// ── SELLER PUBLIC GIGS ────────────────────────────────────
case 'seller_gigs':
    $seller_id = (int)($_GET['seller_id'] ?? 0);
    $limit     = (int)($_GET['limit'] ?? 10);
    if ($seller_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid seller ID']);
        break;
    }
    $gigs = $gigModel->getPublicSellerGigs($seller_id, $limit);
    echo json_encode(['success' => true, 'data' => $gigs]);
    break;
    

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        break;
}