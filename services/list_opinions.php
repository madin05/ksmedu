<?php
// ===== FORCE NO CACHE (ANTI DATA HANTU) =====
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");

// Headers lainnya
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

try {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $category = isset($_GET['category']) ? $_GET['category'] : null;

    error_log("=== LIST OPINIONS API ===");
    error_log("Limit: $limit, Offset: $offset, Category: " . ($category ?? 'all'));

    // Cek kolom opsional status dan updated_at
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

    $sql = "
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
    ";

    $params = [];
    $conditions = [];
    if ($hasStatus) {
        $conditions[] = "o.status = 'published'";
    }

    if ($category && $category !== 'all') {
        $conditions[] = 'o.category = ?';
        $params[] = $category;
    }

    if (!empty($conditions)) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= " ORDER BY o.created_at DESC LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $opinions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("Found " . count($opinions) . " opinions");

    // Get total count
    $countConditions = [];
    $countParams = [];
    if ($hasStatus) {
        $countConditions[] = "status = 'published'";
    }
    if ($category && $category !== 'all') {
        $countConditions[] = "category = ?";
        $countParams[] = $category;
    }

    $countSql = "SELECT COUNT(*) as total FROM opinions";
    if (!empty($countConditions)) {
        $countSql .= " WHERE " . implode(' AND ', $countConditions);
    }
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($countParams);

    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    error_log("Total opinions in DB: $total");

    echo json_encode([
        'ok' => true,
        'results' => $opinions,
        'total' => (int)$total,
        'limit' => $limit,
        'offset' => $offset
    ]);
} catch (Exception $e) {
    error_log('List opinions error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => $e->getMessage(),
        'error' => $e->getMessage()
    ]);
}
