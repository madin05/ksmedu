<?php
/**
 * services/cancel_token_transaction.php
 * Endpoint bagi pengguna untuk membatalkan pesanan token berstatus PENDING.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_middleware.php';
require_once __DIR__ . '/midtrans_helper.php';

$user = require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Only POST allowed']);
    exit;
}

try {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?? $_POST;

    $id = trim((string)($data['id'] ?? ''));
    $publicId = trim((string)($data['public_id'] ?? ''));
    $orderId = trim((string)($data['order_id'] ?? ''));

    if ($id === '' && $publicId === '' && $orderId === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'ID pesanan tidak valid.']);
        exit;
    }

    $sql = 'SELECT id, public_id, midtrans_order_id, status FROM token_purchase_requests WHERE user_id = ? AND ';
    $param = '';
    if ($id !== '') {
        $sql .= 'id = ?';
        $param = $id;
    } elseif ($publicId !== '') {
        $sql .= 'public_id = ?';
        $param = $publicId;
    } else {
        $sql .= 'midtrans_order_id = ?';
        $param = $orderId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([(int)$user['id'], $param]);
    $request = $stmt->fetch();

    if (!$request) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'Pesanan tidak ditemukan.']);
        exit;
    }

    if ($request['status'] !== 'pending') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Hanya pesanan berstatus PENDING yang dapat dibatalkan.']);
        exit;
    }

    // Update status di DB menjadi cancelled
    $updateStmt = $pdo->prepare(
        "UPDATE token_purchase_requests
         SET status = 'cancelled', rejected_at = CURRENT_TIMESTAMP, rejection_reason = 'Dibatal oleh pengguna'
         WHERE id = ?"
    );
    $updateStmt->execute([(int)$request['id']]);

    // Opsi: Panggil API Cancel Midtrans jika order_id ada
    if (!empty($request['midtrans_order_id'])) {
        try {
            $config = midtrans_get_config();
            $baseUrl = $config['is_production'] ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
            $cancelUrl = $baseUrl . '/v2/' . urlencode($request['midtrans_order_id']) . '/cancel';

            $ch = curl_init($cancelUrl);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Authorization: Basic ' . base64_encode($config['server_key'] . ':'),
                ],
            ]);
            curl_exec($ch);
            curl_close($ch);
        } catch (Throwable $e) {
            // Ignore failure from Midtrans cancel API if order is already expired/canceled on Midtrans side
        }
    }

    echo json_encode([
        'ok' => true,
        'message' => 'Pesanan berhasil dibatalkan.',
        'id' => (int)$request['id'],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Gagal membatalkan pesanan: ' . $e->getMessage()]);
}
