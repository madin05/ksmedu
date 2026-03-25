<?php
// upload.php
require_once __DIR__ . '/db.php';

$uploadDir = __DIR__ . '/../../uploads';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'message' => 'Only POST allowed']);
    exit;
}

if (!isset($_FILES['file'])) {
    echo json_encode(['ok' => false, 'message' => 'file not provided']);
    exit;
}

$file = $_FILES['file'];
$maxSize = 20 * 1024 * 1024; // 20MB limit
if ($file['size'] > $maxSize) {
    echo json_encode(['ok' => false, 'message' => 'File too large']);
    exit;
}

// Basic sanitization - keep extension
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$safeName = bin2hex(random_bytes(12)) . ($ext ? '.' . $ext : '');
$target = $uploadDir . '/' . $safeName;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    echo json_encode(['ok' => false, 'message' => 'Cannot move uploaded file']);
    exit;
}

// Build public url path (adjust if project in subfolder)
$publicUrl = '/uploads/' . $safeName;

$mime = $file['type'] ?? mime_content_type($target);
$size = (int)$file['size'];

$stmt = $pdo->prepare("INSERT INTO uploads (filename, original_name, mime, size, url) VALUES (?,?,?,?,?)");
$stmt->execute([$safeName, $file['name'], $mime, $size, $publicUrl]);
$uploadId = $pdo->lastInsertId();

echo json_encode(['ok' => true, 'id' => $uploadId, 'url' => $publicUrl]);
