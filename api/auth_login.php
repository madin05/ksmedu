<?php
// auth_login.php
session_start();
require_once __DIR__ . '/db.php';
$raw = file_get_contents('php://input');
$data = json_decode($raw,true);
if (!$data || empty($data['email']) || empty($data['password'])) { echo json_encode(['ok'=>false,'message'=>'Invalid']); exit; }

$stmt = $pdo->prepare("SELECT id, password_hash, name, role FROM users WHERE email = ? LIMIT 1");
$stmt->execute([$data['email']]);
$user = $stmt->fetch();
if (!$user) { echo json_encode(['ok'=>false,'message'=>'User not found']); exit; }

// password_verify if you stored password_hash using password_hash()
if (!password_verify($data['password'], $user['password_hash'])) {
    echo json_encode(['ok'=>false,'message'=>'Wrong password']); exit;
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['role'] = $user['role'];
echo json_encode(['ok'=>true,'user'=>['id'=>$user['id'],'name'=>$user['name'],'role'=>$user['role']]]);
