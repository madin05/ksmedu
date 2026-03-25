<?php
// delete_upload.php
require_once __DIR__ . '/db.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['ok'=>false,'message'=>'Only POST']); exit; }
$raw = file_get_contents('php://input');
$data = json_decode($raw,true);
if (!$data || !isset($data['id'])) { echo json_encode(['ok'=>false,'message'=>'id required']); exit; }

$id = (int)$data['id'];
$stmt = $pdo->prepare("SELECT filename FROM uploads WHERE id = ? LIMIT 1");
$stmt->execute([$id]);
$r = $stmt->fetch();
if (!$r) { echo json_encode(['ok'=>false,'message'=>'upload not found']); exit; }

$filename = $r['filename'];
$path = __DIR__ . '/../../uploads/' . $filename;
if (is_file($path)) unlink($path);

$pdo->prepare("DELETE FROM uploads WHERE id = ?")->execute([$id]);
echo json_encode(['ok'=>true,'id'=>$id]);
