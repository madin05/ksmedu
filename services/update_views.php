<?php
// File: api/update_views.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $id = $data['id'] ?? null;
    $type = $data['type'] ?? 'journal';

    if (!$id) {
        throw new Exception('ID required');
    }

    $table = $type === 'journal' ? 'journals' : 'opinions';

    $stmt = $pdo->prepare("UPDATE $table SET views = views + 1 WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['ok' => true, 'message' => 'Views updated']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
}
