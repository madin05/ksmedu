<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';


try {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Invalid opinion ID']);
        exit;
    }


    // Cek kolom status dan updated_at secara resilient
    $hasStatus = false;
    $hasUpdatedAt = false;
    try {
        $cStatus = $pdo->query("SHOW COLUMNS FROM opinions LIKE 'status'");
        $hasStatus = (bool)$cStatus->fetch();
    } catch (Throwable $e) {}
    try {
        $cUpdated = $pdo->query("SHOW COLUMNS FROM opinions LIKE 'updated_at'");
        $hasUpdatedAt = (bool)$cUpdated->fetch();
    } catch (Throwable $e) {}

    $updatedAtSelect = $hasUpdatedAt ? "o.updated_at," : "NULL AS updated_at,";
    $statusClause = $hasStatus ? " AND o.status = 'published'" : "";

    $stmt = $pdo->prepare("
        SELECT 
            o.id,
            o.title,
            o.description,
            o.category,
            o.author_name,
            o.file_upload_id,
            o.cover_upload_id,
            o.authors,
            o.tags,
            o.email,
            o.contact,
            o.client_temp_id,
            o.created_at,
            {$updatedAtSelect}
            o.views,
            uf.url AS file_url,
            uc.url AS cover_url
        FROM opinions o
        LEFT JOIN uploads uf ON o.file_upload_id = uf.id
        LEFT JOIN uploads uc ON o.cover_upload_id = uc.id
        WHERE o.id = ?{$statusClause}
    ");

    $stmt->execute([$id]);
    $opinion = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$opinion) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'Opinion not found']);
        exit;
    }

    // View counting is intentionally NOT done here, mirroring get_journal.php.
    // js/opinions.js already POSTs to update_views.php, so incrementing here as
    // well double counted every visit.

    echo json_encode([
        'ok' => true,
        'result' => $opinion,
        'opinion' => $opinion
    ]);
} catch (Throwable $e) {
    error_log('get_opinion failed for id ' . $id . ': ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Gagal memuat opini.'
    ]);
}


