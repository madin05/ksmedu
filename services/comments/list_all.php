<?php
/**
 * GET /api/comments/list_all.php
 * Admin only: get all comments with optional filters.
 *
 * Query params:
 *   ?page=1&limit=20&type=jurnal|opini&search=keyword
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Lax');
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

// ===== ADMIN AUTH CHECK =====
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Login required']);
    exit;
}

require_once __DIR__ . '/../db.php';

$adminStmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
$adminStmt->execute([(int) $_SESSION['user_id']]);
$adminUser = $adminStmt->fetch();

if (!$adminUser || $adminUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Admin access required']);
    exit;
}

// ===== QUERY PARAMS =====
$page   = max(1, (int) ($_GET['page']   ?? 1));
$limit  = min(50, max(10, (int) ($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;
$type   = isset($_GET['type']) && in_array($_GET['type'], ['jurnal', 'opini'], true)
            ? $_GET['type'] : null;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$sort   = $_GET['sort'] ?? 'newest';

// ===== BUILD QUERY =====
$where  = [];
$params = [];

if ($type) {
    $where[]  = "c.article_type = ?";
    $params[] = $type;
}
if (!empty($search)) {
    $where[]  = "(c.user_name LIKE ? OR c.content LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$whereSQL  = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Sorting logic
$orderSQL = "c.created_at DESC"; // Default (newest)
if ($sort === 'oldest') {
    $orderSQL = "c.created_at ASC";
} elseif ($sort === 'user_az') {
    $orderSQL = "c.user_name ASC";
} elseif ($sort === 'user_za') {
    $orderSQL = "c.user_name DESC";
}

try {
    // Count total for pagination
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM comments c $whereSQL");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    // Fetch paginated comments
    $dataStmt = $pdo->prepare(
        "SELECT c.id, c.article_id, c.article_type, c.user_id, c.user_name, c.content, c.created_at
         FROM comments c
         $whereSQL
         ORDER BY $orderSQL
         LIMIT $limit OFFSET $offset"
    );
    $dataStmt->execute($params);
    $comments = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

    // Sanitize output
    foreach ($comments as &$c) {
        $c['user_name'] = htmlspecialchars($c['user_name'], ENT_QUOTES, 'UTF-8');
        $c['content']   = htmlspecialchars($c['content'],   ENT_QUOTES, 'UTF-8');
    }
    unset($c);

    echo json_encode([
        'ok'       => true,
        'comments' => $comments,
        'total'    => $total,
        'page'     => $page,
        'limit'    => $limit,
        'pages'    => (int) ceil($total / $limit),
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Server error']);
}
