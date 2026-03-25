<?php
// sync_pull.php
require_once __DIR__ . '/db.php';
$since = isset($_GET['since']) ? $_GET['since'] : null; // expect 'YYYY-mm-dd HH:MM:SS' or ISO
if ($since) {
    $stmt = $pdo->prepare("SELECT j.*, u.url as file_url, c.url as cover_url FROM journals j LEFT JOIN uploads u ON u.id = j.file_upload_id LEFT JOIN uploads c ON c.id = j.cover_upload_id WHERE j.updated_at IS NOT NULL AND j.updated_at > ? ORDER BY j.updated_at ASC");
    $stmt->execute([$since]);
} else {
    $stmt = $pdo->query("SELECT j.*, u.url as file_url, c.url as cover_url FROM journals j LEFT JOIN uploads u ON u.id = j.file_upload_id LEFT JOIN uploads c ON c.id = j.cover_upload_id ORDER BY j.created_at DESC LIMIT 200");
}
$rows = $stmt->fetchAll();
echo json_encode(['ok'=>true,'changes'=>$rows]);
