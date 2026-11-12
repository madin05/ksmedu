<?php
// File: api/update_views.php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';


try {
    $data = json_decode(file_get_contents('php://input'), true);

    $id = $data['id'] ?? null;
    $type = $data['type'] ?? 'journal';

    if (filter_var($id, FILTER_VALIDATE_INT) === false || (int) $id < 1) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'A valid article ID is required']);
        exit;
    }

    $tableByType = [
        'journal' => 'journals',
        'opinion' => 'opinions',
    ];

    if (!isset($tableByType[$type])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Invalid article type']);
        exit;
    }

    $table = $tableByType[$type];

    // Cek kolom status secara resilient
    $hasStatus = false;
    try {
        $cStatus = $pdo->query("SHOW COLUMNS FROM $table LIKE 'status'");
        $hasStatus = (bool)$cStatus->fetch();
    } catch (Throwable $e) {}

    $statusClause = $hasStatus ? " AND status = 'published'" : "";
    $stmt = $pdo->prepare("UPDATE $table SET views = views + 1 WHERE id = ?{$statusClause}");
    $stmt->execute([(int) $id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'Published article not found']);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'message' => 'Views updated'
    ]);
} catch (Throwable $e) {
    error_log('update_views failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Gagal memperbarui jumlah view.']);
}


