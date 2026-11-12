<?php
// ===== FORCE NO CACHE (ANTI DATA HANTU) =====
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
    require_once __DIR__ . '/db.php';

    $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 50;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    // Cek ketersediaan kolom status secara resilient
    $hasStatus = false;
    try {
        $colCheck = $pdo->query("SHOW COLUMNS FROM journals LIKE 'status'");
        $hasStatus = (bool)$colCheck->fetch();
    } catch (Throwable $e) {
        $hasStatus = false;
    }

    $whereClause = $hasStatus ? "WHERE j.status = 'published'" : "";

    // Single query with JOINs — resolving upload URLs per row previously issued
    // two extra queries per journal (up to 101 queries for one page).
    $stmt = $pdo->prepare("
        SELECT 
            j.id, j.title, j.abstract, j.authors, j.email, j.contact,
            j.pengurus, j.volume, j.tags, j.views, j.created_at,
            COALESCE(f.url, '') AS file_url,
            COALESCE(c.url, '') AS cover_url
        FROM journals j
        LEFT JOIN uploads f ON j.file_upload_id = f.id
        LEFT JOIN uploads c ON j.cover_upload_id = c.id
        {$whereClause}
        ORDER BY j.created_at DESC
        LIMIT ? OFFSET ?
    ");

    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$row) {
        // Set default untuk pengurus jika NULL
        $row['pengurus'] = $row['pengurus'] ? json_decode($row['pengurus'], true) : [];
    }
    unset($row);

    echo json_encode(['ok' => true, 'results' => $rows]);
} catch (Throwable $e) {
    error_log('list_journals failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Gagal memuat daftar jurnal.',
        'error' => $e->getMessage()
    ]);
}
