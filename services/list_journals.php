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

    $limit = isset($_GET['limit']) ? min(100, (int)$_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    // PASTIKAN volume ada di SELECT
    $stmt = $pdo->prepare("
        SELECT 
            id, title, abstract, authors, email, contact, pengurus, volume, tags, views, created_at,
            file_upload_id, cover_upload_id
        FROM journals
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");

    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Ambil file_url dan cover_url
    foreach ($rows as &$row) {
        if (!empty($row['file_upload_id'])) {
            $fileStmt = $pdo->prepare("SELECT url FROM uploads WHERE id = ?");
            $fileStmt->execute([$row['file_upload_id']]);
            $file = $fileStmt->fetch(PDO::FETCH_ASSOC);
            $row['file_url'] = $file ? $file['url'] : '';
        } else {
            $row['file_url'] = '';
        }

        if (!empty($row['cover_upload_id'])) {
            $coverStmt = $pdo->prepare("SELECT url FROM uploads WHERE id = ?");
            $coverStmt->execute([$row['cover_upload_id']]);
            $cover = $coverStmt->fetch(PDO::FETCH_ASSOC);
            $row['cover_url'] = $cover ? $cover['url'] : '';
        } else {
            $row['cover_url'] = '';
        }

        // Set default untuk pengurus jika NULL
        $row['pengurus'] = $row['pengurus'] ? json_decode($row['pengurus'], true) : [];

        // Remove upload IDs
        unset($row['file_upload_id']);
        unset($row['cover_upload_id']);
    }

    echo json_encode(['ok' => true, 'results' => $rows]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => $e->getMessage(),
        'error' => 'Database error'
    ]);
}
