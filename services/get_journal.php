<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$id) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'id required']);
    exit;
}

try {
    // Cek kolom status secara resilient
    $hasStatus = false;
    try {
        $cStatus = $pdo->query("SHOW COLUMNS FROM journals LIKE 'status'");
        $hasStatus = (bool)$cStatus->fetch();
    } catch (Throwable $e) {}

    $statusClause = $hasStatus ? " AND j.status = 'published'" : "";

    //  JOIN dengan uploads table untuk get URL terbaru!
    $stmt = $pdo->prepare("
        SELECT 
            j.id,
            j.title,
            j.abstract,
            j.authors,
            j.tags,
            j.pengurus,
            j.email,
            j.contact,
            j.volume,
            j.views,
            j.client_temp_id,
            j.client_updated_at,
            j.created_at,
            j.updated_at,
            f.url as file_url,
            c.url as cover_url
        FROM journals j
        LEFT JOIN uploads f ON j.file_upload_id = f.id
        LEFT JOIN uploads c ON j.cover_upload_id = c.id
        WHERE j.id = ?{$statusClause}
    ");

    $stmt->execute([$id]);
    $journal = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$journal) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'Journal not found']);
        exit;
    }

    // View counting is intentionally NOT done here. A GET endpoint should stay
    // side-effect free, and the frontend already calls update_views.php as the
    // single source of truth — incrementing in both places double counted every
    // visit.

    //  Return with UPDATED file URLs
    echo json_encode([
        'ok' => true,
        'journal' => $journal
    ]);
} catch (Throwable $e) {
    error_log('get_journal failed for id ' . $id . ': ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Gagal memuat jurnal.']);
}
