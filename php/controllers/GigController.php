<?php
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../models/Gig.php';

function listGigs($conn) {
    $gigs = getPublicGigs($conn);

    if ($gigs === false) {
        sendJson(['success' => false, 'error' => 'Failed to load gigs']);
    }

    $categories = ['All Services'];
    foreach ($gigs as $gig) {
        if (!in_array($gig['category'], $categories, true)) {
            $categories[] = $gig['category'];
        }
    }

    sendJson([
        'success' => true,
        'data' => $gigs,
        'categories' => $categories
    ]);
}

function showGig($conn) {
    $id = (int)($_GET['id'] ?? 0);

    if ($id <= 0) {
        sendJson(['success' => false, 'error' => 'Valid gig ID required']);
    }

    $gig = getGigById($conn, $id);

    if (!$gig) {
        sendJson(['success' => false, 'error' => 'Gig not found'], 404);
    }

    sendJson(['success' => true, 'data' => $gig]);
}
?>
