<?php
// upload.php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_middleware.php';

// ===== JWT AUTH: Any Authenticated User =====
$auth_user = require_auth();

$uploadDir = rtrim(UPLOAD_DIR_ABS, '/\\');
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Upload directory is unavailable']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['ok' => false, 'message' => 'Only POST allowed']);
    exit;
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'file not provided']);
    exit;
}

$file = $_FILES['file'];
$uploadError = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
if ($uploadError !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Upload failed', 'code' => 'UPLOAD_ERROR']);
    exit;
}

$maxSize = 5 * 1024 * 1024; // 5MB limit
if ((int)$file['size'] < 1 || (int)$file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Ukuran file terlalu besar. Maksimal 5 MB']);
    exit;
}

// Strict file extension whitelist — ONLY allow safe file types
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
if (!in_array($ext, $allowedExtensions, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'File type not allowed. Allowed: ' . implode(', ', $allowedExtensions)]);
    exit;
}

// Verify MIME from the temporary file; never trust the browser-provided MIME.
$allowedMimes = [
    'pdf'  => ['application/pdf'],
    'png'  => ['image/png'],
    'jpg'  => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'gif'  => ['image/gif'],
    'webp' => ['image/webp'],
];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$detectedMime = $finfo ? finfo_file($finfo, $file['tmp_name']) : false;
if ($finfo) finfo_close($finfo);
if (!$detectedMime || !in_array($detectedMime, $allowedMimes[$ext], true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'File MIME type mismatch']);
    exit;
}

$safeName = bin2hex(random_bytes(12)) . '.' . $ext;
$target = $uploadDir . '/' . $safeName;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Cannot move uploaded file']);
    exit;
}

// Build a subdirectory-safe public URL.
$publicUrl = APP_ROOT . '/uploads/' . $safeName;

$mime = $detectedMime;
$size = (int)$file['size'];

try {
    $hasUserId = false;
    try {
        $c = $pdo->query("SHOW COLUMNS FROM uploads LIKE 'user_id'");
        $hasUserId = (bool)$c->fetch();
    } catch (Throwable $e) {}

    if ($hasUserId && !empty($auth_user['id'])) {
        $stmt = $pdo->prepare("INSERT INTO uploads (user_id, filename, original_name, mime, size, url) VALUES (?,?,?,?,?,?)");
        $stmt->execute([(int)$auth_user['id'], $safeName, $file['name'], $mime, $size, $publicUrl]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO uploads (filename, original_name, mime, size, url) VALUES (?,?,?,?,?)");
        $stmt->execute([$safeName, $file['name'], $mime, $size, $publicUrl]);
    }
    $uploadId = $pdo->lastInsertId();
} catch (Throwable $e) {
    @unlink($target);
    error_log('Upload metadata insert failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Cannot save upload metadata: ' . $e->getMessage()]);
    exit;
}

http_response_code(201);
echo json_encode(['ok' => true, 'id' => (int)$uploadId, 'url' => $publicUrl, 'mime' => $mime]);
