<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

try {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if (!$id) {
        throw new Exception('Opinion ID is required');
    }

    error_log("=== DELETE OPINION API ===");
    error_log("Opinion ID: $id");

    $stmt = $pdo->prepare("
        SELECT file_upload_id, cover_upload_id 
        FROM opinions 
        WHERE id = ?
    ");
    $stmt->execute([$id]);
    $opinion = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$opinion) {
        throw new Exception('Opinion not found');
    }

    $fileUploadId = $opinion['file_upload_id'];
    $coverUploadId = $opinion['cover_upload_id'];

    $deleteStmt = $pdo->prepare("DELETE FROM opinions WHERE id = ?");
    $deleteStmt->execute([$id]);

    if ($fileUploadId) {
        $stmt = $pdo->prepare("SELECT filename FROM uploads WHERE id = ?");
        $stmt->execute([$fileUploadId]);
        $fileData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($fileData) {
            $filePath = __DIR__ . '/../../uploads/' . $fileData['filename'];
            if (file_exists($filePath)) {
                unlink($filePath);
                error_log("Deleted file: $filePath");
            }
        }

        $pdo->prepare("DELETE FROM uploads WHERE id = ?")->execute([$fileUploadId]);
    }

    if ($coverUploadId) {
        $stmt = $pdo->prepare("SELECT filename FROM uploads WHERE id = ?");
        $stmt->execute([$coverUploadId]);
        $coverData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($coverData) {
            $coverPath = __DIR__ . '/../../uploads/' . $coverData['filename'];
            if (file_exists($coverPath)) {
                unlink($coverPath);
                error_log("Deleted cover: $coverPath");
            }
        }

        $pdo->prepare("DELETE FROM uploads WHERE id = ?")->execute([$coverUploadId]);
    }

    error_log("Opinion deleted successfully: $id");

    echo json_encode([
        'ok' => true,
        'message' => 'Opini berhasil dihapus'
    ]);
} catch (Exception $e) {
    error_log('Delete opinion error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => $e->getMessage()
    ]);
}
