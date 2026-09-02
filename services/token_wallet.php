<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_middleware.php';
require_once __DIR__ . '/token_service.php';

$user = require_auth();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Only GET allowed']);
    exit;
}

try {
    // Sync status Midtrans via token_get_history terlebih dahulu sebelum membaca saldo wallet,
    // agar jika ada transaksi baru yang sukses, saldo yang dikembalikan sudah yang terbaru.
    $history = token_get_history($pdo, (int)$user['id']);
    $wallet = token_get_wallet($pdo, (int)$user['id']);

    echo json_encode([
        'ok' => true,
        'wallet' => $wallet,
        'history' => $history,
    ]);
} catch (Throwable $e) {
    error_log('Token wallet read error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Data token belum dapat dimuat.']);
}