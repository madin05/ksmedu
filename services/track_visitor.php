<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    require_once __DIR__ . '/db.php';

    if (!isset($pdo)) {
        throw new Exception('Database connection failed');
    }

    // Get visitor info
    $ip = $_SERVER['REMOTE_ADDR'];
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $pageUrl = $_POST['page_url'] ?? $_SERVER['REQUEST_URI'] ?? '/';

    // Check if table exists
    $checkTable = $pdo->query("SHOW TABLES LIKE 'visitors'");
    if ($checkTable->rowCount() == 0) {
        echo json_encode(['ok' => false, 'message' => 'Table visitors not found']);
        exit;
    }

    // Check if visitor already visited TODAY (unique per day)
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT id FROM visitors 
                           WHERE ip_address = ? 
                           AND DATE(visited_at) = ? 
                           LIMIT 1");
    $stmt->execute([$ip, $today]);

    if ($stmt->rowCount() == 0) {
        // New visitor for today, insert
        $stmtInsert = $pdo->prepare("INSERT INTO visitors (ip_address, user_agent, page_url) 
                                     VALUES (?, ?, ?)");
        $stmtInsert->execute([$ip, $userAgent, $pageUrl]);

        echo json_encode([
            'ok' => true,
            'message' => 'Visitor tracked',
            'new' => true,
            'ip' => $ip
        ]);
    } else {
        echo json_encode([
            'ok' => true,
            'message' => 'Already tracked today',
            'new' => false,
            'ip' => $ip
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => $e->getMessage()
    ]);
}
