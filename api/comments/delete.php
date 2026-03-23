<?php
/**
 * POST /api/comments/delete.php
 * Body: { comment_id }
 *
 * Auth rules:
 *   - User can delete their OWN comments
 *   - Admin (role='admin') can delete ANY comment
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
    echo json_encode(['ok' => false, 'message' => 'Login required']);
    exit;
}

require_once __DIR__ . '/../db.php';

$session_user_id = (int) $_SESSION['user_id'];

// ===== GET CURRENT USER ROLE =====
$userStmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
$userStmt->execute([$session_user_id]);
$currentUser = $userStmt->fetch();

if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'User not found']);
    exit;
}

$isAdmin = ($currentUser['role'] === 'admin');

// ===== PARSE INPUT =====
$raw        = file_get_contents('php://input');
$data       = json_decode($raw, true);
$comment_id = isset($data['comment_id']) ? (int) $data['comment_id'] : 0;

if ($comment_id <= 0) {
    echo json_encode(['ok' => false, 'message' => 'Invalid comment_id']);
    exit;
}

// ===== FETCH COMMENT =====
$commentStmt = $pdo->prepare("SELECT id, user_id FROM comments WHERE id = ? LIMIT 1");
$commentStmt->execute([$comment_id]);
$comment = $commentStmt->fetch();

if (!$comment) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'message' => 'Komentar tidak ditemukan']);
    exit;
}

// ===== AUTHZ CHECK — server-side, never trust frontend =====
$isOwner = ((int) $comment['user_id'] === $session_user_id);

if (!$isOwner && !$isAdmin) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Tidak diizinkan menghapus komentar ini']);
    exit;
}

// ===== DELETE =====
try {
    // Hapus komentar terpilih DAN semua balasannya (1-level deep or adjust if needed)
    // Untuk performa dan integritas, kita hapus yang parent_id-nya sama dengan comment ini
    $deleteStmt = $pdo->prepare("DELETE FROM comments WHERE id = ? OR parent_id = ?");
    $deleteStmt->execute([$comment_id, $comment_id]);
    echo json_encode(['ok' => true, 'message' => 'Komentar berhasil dihapus']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Gagal menghapus komentar']);
}
