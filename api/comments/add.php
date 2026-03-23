<?php
/**
 * POST /api/comments/add.php
 * Body: { article_id, article_type, content }
 *
 * Requires active PHP session (user must be logged in).
 * Security: XSS sanitization, length limit, rate limiting.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Session hardening before session_start()
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Lax');

session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

// ===== AUTH CHECK =====
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Login required to comment']);
    exit;
}

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../env_loader.php';

$user_id = (int) $_SESSION['user_id'];

// ===== FETCH USER INFO =====
$userStmt = $pdo->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
$userStmt->execute([$user_id]);
$user = $userStmt->fetch();
if (!$user) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'User not found']);
    exit;
}

// ===== PARSE INPUT =====
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Invalid JSON body']);
    exit;
}

$article_id   = isset($data['article_id'])   ? (int) $data['article_id'] : 0;
$article_type = isset($data['article_type']) ? trim($data['article_type']) : '';
$content      = isset($data['content'])      ? trim($data['content'])      : '';
$parent_id    = isset($data['parent_id'])    ? (int) $data['parent_id']    : null;

// ===== VALIDATE =====
if ($article_id <= 0) {
    echo json_encode(['ok' => false, 'message' => 'Invalid article_id']);
    exit;
}
if (!in_array($article_type, ['jurnal', 'opini'], true)) {
    echo json_encode(['ok' => false, 'message' => 'Invalid article type']);
    exit;
}
if (empty($content)) {
    echo json_encode(['ok' => false, 'message' => 'Komentar tidak boleh kosong']);
    exit;
}

// ===== SANITIZE (Anti-XSS) =====
// 1. Strip any HTML/PHP/script tags entirely
$content = strip_tags($content);
// 2. Escape special chars for safe storage and output
$content = htmlspecialchars($content, ENT_QUOTES, 'UTF-8');
// 3. Enforce max length from env (default 2000)
$max_len = (int)(getenv('COMMENT_MAX_LENGTH') ?: 2000);
if (mb_strlen($content) > $max_len) {
    $content = mb_substr($content, 0, $max_len);
}
if (empty(trim($content))) {
    echo json_encode(['ok' => false, 'message' => 'Komentar tidak valid']);
    exit;
}

// ===== RATE LIMIT =====
$rate_limit = (int)(getenv('COMMENT_RATE_LIMIT') ?: 5);
$window     = 10 * 60; // 10 minutes
$since      = date('Y-m-d H:i:s', time() - $window);

$rateStmt = $pdo->prepare(
    "SELECT COUNT(*) FROM comments WHERE user_id = ? AND created_at > ?"
);
$rateStmt->execute([$user_id, $since]);
$recentCount = (int) $rateStmt->fetchColumn();

if ($recentCount >= $rate_limit) {
    http_response_code(429);
    echo json_encode([
        'ok'      => false,
        'message' => "Terlalu banyak komentar. Silakan tunggu beberapa saat."
    ]);
    exit;
}

// ===== INSERT =====
try {
    $user_name = htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8');

    $stmt = $pdo->prepare(
        "INSERT INTO comments (article_id, article_type, parent_id, user_id, user_name, content)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$article_id, $article_type, $parent_id, $user_id, $user_name, $content]);
    $new_id = $pdo->lastInsertId();

    echo json_encode([
        'ok'      => true,
        'comment' => [
            'id'         => (int) $new_id,
            'parent_id'  => $parent_id,
            'user_id'    => $user_id,
            'user_name'  => $user_name,
            'content'    => $content,
            'created_at' => date('Y-m-d H:i:s'),
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Gagal menyimpan komentar']);
}
