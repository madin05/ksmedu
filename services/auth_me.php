<?php
/**
 * GET /services/auth_me.php
 * 
 * Returns the currently authenticated user.
 * Supports JWT (primary) and PHP Session (fallback).
 */

header('Content-Type: application/json');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_middleware.php';

// $auth_user is already set by jwt_middleware.php (auto-authenticates on include)

if (!$auth_user) {
    echo json_encode(['ok'=>false,'message'=>'not authenticated']);
    exit;
}

// Fetch fresh user data from DB
$stmt = $pdo->prepare("SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1");
$stmt->execute([$auth_user['id']]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['ok'=>false,'message'=>'User not found']);
    exit;
}

echo json_encode([
    'ok'=>true,
    'user'=>$user,
    'auth_method' => $auth_user['auth_method']
]);
