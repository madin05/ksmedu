<?php
/**
 * GET /api/comments/get.php?article_id=X&type=jurnal|opini
 * Public endpoint — no login required to READ comments.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../db.php';

$article_id   = isset($_GET['article_id']) ? (int) $_GET['article_id'] : 0;
$article_type = isset($_GET['type']) ? trim($_GET['type']) : '';

// Validate inputs
if ($article_id <= 0) {
    echo json_encode(['ok' => false, 'message' => 'Invalid article_id']);
    exit;
}
if (!in_array($article_type, ['jurnal', 'opini'], true)) {
    echo json_encode(['ok' => false, 'message' => 'Invalid article type']);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT id, parent_id, user_id, user_name, content, created_at
         FROM comments
         WHERE article_id = ? AND article_type = ?
         ORDER BY created_at ASC"
    );
    $stmt->execute([$article_id, $article_type]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Sanitize output — double-ensure XSS cannot escape via DB data
    foreach ($comments as &$c) {
        $c['user_name'] = htmlspecialchars($c['user_name'], ENT_QUOTES, 'UTF-8');
        $c['content']   = htmlspecialchars($c['content'],   ENT_QUOTES, 'UTF-8');
    }
    unset($c);

    echo json_encode(['ok' => true, 'comments' => $comments, 'total' => count($comments)]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Server error']);
}
