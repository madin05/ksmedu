<?php
// upload.php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_middleware.php';

// ===== JWT AUTH: Any Authenticated User =====
require_auth();

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

// Strict file extension whitelist — ONLY allow safe file types
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
if (!in_array($ext, $allowedExtensions, true)) {
    echo json_encode(['ok' => false, 'message' => 'File type not allowed. Allowed: ' . implode(', ', $allowedExtensions)]);
    exit;
}

// Verify MIME type matches extension (double check)
$allowedMimes = [
    'pdf'  => ['application/pdf'],
    'png'  => ['image/png'],
    'jpg'  => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'gif'  => ['image/gif'],
    'webp' => ['image/webp'],
];
$fileMime = $file['type'] ?? '';
if (isset($allowedMimes[$ext]) && !in_array($fileMime, $allowedMimes[$ext], true)) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detectedMime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($detectedMime, $allowedMimes[$ext], true)) {
        echo json_encode(['ok' => false, 'message' => 'File MIME type mismatch']);
        exit;
    }
}

$safeName = bin2hex(random_bytes(12)) . '.' . $ext;
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
