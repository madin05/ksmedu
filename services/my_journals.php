<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_middleware.php';
require_once __DIR__ . '/submission_helpers.php';

$auth_user = require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['ok' => false, 'message' => 'Only GET allowed']);
    exit;
}

try {
    $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));
    $statuses = ['draft', 'pending', 'published', 'rejected'];
    $status = isset($_GET['status']) ? strtolower(trim((string)$_GET['status'])) : null;
    if ($status !== null && !in_array($status, $statuses, true)) {
        throw new InvalidArgumentException('Filter status tidak valid.');
    }

    $hasUserId = false;
    $hasStatus = false;
    $hasRejection = false;
    $hasReviewed = false;
    $hasUpdated = false;
    try {
        $c = $pdo->query("SHOW COLUMNS FROM journals LIKE 'user_id'");
        $hasUserId = (bool)$c->fetch();
    } catch (Throwable $e) {}
    try {
        $c = $pdo->query("SHOW COLUMNS FROM journals LIKE 'status'");
        $hasStatus = (bool)$c->fetch();
    } catch (Throwable $e) {}
    try {
        $c = $pdo->query("SHOW COLUMNS FROM journals LIKE 'rejection_reason'");
        $hasRejection = (bool)$c->fetch();
    } catch (Throwable $e) {}
    try {
        $c = $pdo->query("SHOW COLUMNS FROM journals LIKE 'reviewed_at'");
        $hasReviewed = (bool)$c->fetch();
    } catch (Throwable $e) {}
    try {
        $c = $pdo->query("SHOW COLUMNS FROM journals LIKE 'updated_at'");
        $hasUpdated = (bool)$c->fetch();
    } catch (Throwable $e) {}

    if (!$hasUserId) {
        // Table journals belum memiliki kolom user_id, berarti belum ada submission karya user
        echo json_encode([
            'ok' => true,
            'results' => [],
            'total' => 0,
            'limit' => $limit,
            'offset' => $offset,
        ]);
        exit;
    }

    $where = 'j.user_id = ?';
    $params = [(int)$auth_user['id']];
    if ($status !== null) {
        if ($hasStatus) {
            $where .= ' AND j.status = ?';
            $params[] = $status;
        } elseif ($status !== 'published') {
            echo json_encode([
                'ok' => true,
                'results' => [],
                'total' => 0,
                'limit' => $limit,
                'offset' => $offset,
            ]);
            exit;
        }
    }

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM journals j WHERE {$where}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $statusSelect = $hasStatus ? 'j.status,' : "'published' AS status,";
    $rejectionSelect = $hasRejection ? 'j.rejection_reason,' : "NULL AS rejection_reason,";
    $reviewedSelect = $hasReviewed ? 'j.reviewed_at,' : "NULL AS reviewed_at,";
    $updatedSelect = $hasUpdated ? 'j.updated_at,' : "NULL AS updated_at,";

    $stmt = $pdo->prepare(
        "SELECT j.id, j.title, j.abstract, j.authors, j.tags, j.pengurus,
                j.email, j.contact, j.volume, {$statusSelect} {$rejectionSelect}
                j.created_at, {$updatedSelect} {$reviewedSelect}
                fu.url AS file_url, cu.url AS cover_url
         FROM journals j
         LEFT JOIN uploads fu ON fu.id = j.file_upload_id
         LEFT JOIN uploads cu ON cu.id = j.cover_upload_id
         WHERE {$where}
         ORDER BY j.created_at DESC, j.id DESC
         LIMIT {$limit} OFFSET {$offset}"
    );
    $stmt->execute($params);
    $results = array_map('submission_decode_lists', $stmt->fetchAll());

    echo json_encode(['ok' => true, 'results' => $results, 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
} catch (Throwable $e) {
    submission_error($e);
}