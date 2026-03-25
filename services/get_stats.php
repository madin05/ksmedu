<?php
// ===== FORCE NO CACHE (ANTI DELAY STATISTIK) =====
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");

// Headers lainnya
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

error_reporting(0);
ini_set('display_errors', 0);

try {
    require_once __DIR__ . '/db.php';

    // Check PDO connection
    if (!isset($pdo)) {
        throw new Exception('Database connection failed');
    }

    // Get total journals
    $stmtJournals = $pdo->query("SELECT COUNT(*) as total FROM journals");
    $totalJournals = $stmtJournals->fetch(PDO::FETCH_ASSOC)['total'];

    // Get total opinions
    $stmtOpinions = $pdo->query("SELECT COUNT(*) as total FROM opinions");
    $totalOpinions = $stmtOpinions->fetch(PDO::FETCH_ASSOC)['total'];

    // Get total views from journals
    $stmtViewsJ = $pdo->query("SELECT COALESCE(SUM(views), 0) as total FROM journals");
    $viewsJournals = $stmtViewsJ->fetch(PDO::FETCH_ASSOC)['total'];

    // Get total views from opinions
    $stmtViewsO = $pdo->query("SELECT COALESCE(SUM(views), 0) as total FROM opinions");
    $viewsOpinions = $stmtViewsO->fetch(PDO::FETCH_ASSOC)['total'];

    $totalViews = $viewsJournals + $viewsOpinions;

    // Get total unique visitors
    $totalVisitors = 0;
    $checkTable = $pdo->query("SHOW TABLES LIKE 'visitors'");
    if ($checkTable->rowCount() > 0) {
        $stmtVisitors = $pdo->query("SELECT COUNT(DISTINCT ip_address) as total FROM visitors");
        $totalVisitors = $stmtVisitors->fetch(PDO::FETCH_ASSOC)['total'];
    }

    echo json_encode([
        'ok' => true,
        'stats' => [
            'total_journals' => (int)$totalJournals,
            'total_opinions' => (int)$totalOpinions,
            'total_articles' => (int)($totalJournals + $totalOpinions),
            'total_views' => (int)$totalViews,
            'total_visitors' => (int)$totalVisitors
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => $e->getMessage()
    ]);
}
