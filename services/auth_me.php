<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';
if (!isset($_SESSION['user_id'])) { echo json_encode(['ok'=>false,'message'=>'not authenticated']); exit; }
$stmt = $pdo->prepare("SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
echo json_encode(['ok'=>true,'user'=>$user]);
