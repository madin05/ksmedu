<?php
/**
 * services/admin/token_sync_status.php
 * Admin API to manually query Midtrans API and sync transaction status.
 */

header('Content-Type: application/json');

require_once dirname(__DIR__) . '/db.php';
require_once dirname(__DIR__) . '/jwt_middleware.php';
require_once dirname(__DIR__) . '/midtrans_helper.php';
require_once dirname(__DIR__) . '/token_service.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Only POST allowed']);
    exit;
}

try {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?? $_POST;

    $requestId = (int)($data['request_id'] ?? 0);
    $orderId = trim((string)($data['order_id'] ?? ''));

    if ($requestId < 1 && $orderId === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Request ID / Order ID tidak valid.']);
        exit;
    }

    $stmt = $pdo->prepare(
        'SELECT id, public_id, midtrans_order_id, user_id, amount, price_rupiah, status
         FROM token_purchase_requests
         WHERE ' . ($requestId > 0 ? 'id = ?' : 'midtrans_order_id = ?')
    );
    $stmt->execute([$requestId > 0 ? $requestId : $orderId]);
    $request = $stmt->fetch();

    if (!$request) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'Transaksi tidak ditemukan.']);
        exit;
    }

    $midtransOrderId = $request['midtrans_order_id'];
    if (empty($midtransOrderId)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Transaksi ini tidak memiliki Order ID Midtrans.']);
        exit;
    }

    $config = midtrans_get_config();
    $baseUrl = $config['is_production'] ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    $statusUrl = $baseUrl . '/v2/' . urlencode($midtransOrderId) . '/status';

    $ch = curl_init($statusUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode($config['server_key'] . ':'),
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resData = json_decode($response, true) ?? [];
    $txnStatus = strtolower((string)($resData['transaction_status'] ?? ''));
    $paymentType = (string)($resData['payment_type'] ?? '');
    $midtransTxId = (string)($resData['transaction_id'] ?? '');

    if ($httpCode === 404 || $txnStatus === '') {
        echo json_encode([
            'ok' => true,
            'message' => 'Status di Midtrans: Transaksi belum dibuat / belum memilih metode pembayaran.',
            'midtrans_status' => 'not_found',
            'current_status' => $request['status'],
        ]);
        exit;
    }

    $newStatus = $request['status'];
    $message = "Status Midtrans: {$txnStatus}.";

    if ($txnStatus === 'settlement' || ($txnStatus === 'capture' && ($resData['fraud_status'] ?? '') !== 'challenge')) {
        $grossAmt = (float)($resData['gross_amount'] ?? $request['price_rupiah'] ?? 0);
        $mdrFee = (strpos(strtolower($paymentType), 'qris') !== false || strpos(strtolower($paymentType), 'gopay') !== false)
            ? round($grossAmt * 0.007, 2)
            : 0.00;
        $netAmt = max(0, $grossAmt - $mdrFee);

        $upStmt = $pdo->prepare(
            'UPDATE token_purchase_requests
             SET midtrans_transaction_id = ?, payment_type = ?, mdr_fee = ?, net_amount = ?, settled_at = CURRENT_TIMESTAMP
             WHERE id = ?'
        );
        $upStmt->execute([$midtransTxId, $paymentType, $mdrFee, $netAmt, (int)$request['id']]);

        $approveRes = token_admin_approve_purchase($pdo, (int)$request['id'], (int)($_SESSION['user_id'] ?? 0));
        $newStatus = 'approved';
        $message = 'Transaksi TERVERIFIKASI LUNAS di Midtrans. Token otomatis ditambahkan!';
    } elseif (in_array($txnStatus, ['cancel', 'deny'], true)) {
        $upStmt = $pdo->prepare("UPDATE token_purchase_requests SET status = 'cancelled', rejected_at = CURRENT_TIMESTAMP WHERE id = ?");
        $upStmt->execute([(int)$request['id']]);
        $newStatus = 'cancelled';
        $message = 'Transaksi berstatus DIBATALKAN di Midtrans.';
    } elseif ($txnStatus === 'expire') {
        $upStmt = $pdo->prepare("UPDATE token_purchase_requests SET status = 'expired', rejected_at = CURRENT_TIMESTAMP WHERE id = ?");
        $upStmt->execute([(int)$request['id']]);
        $newStatus = 'expired';
        $message = 'Transaksi KEDALUWARSA di Midtrans.';
    }

    echo json_encode([
        'ok' => true,
        'message' => $message,
        'midtrans_status' => $txnStatus,
        'payment_type' => $paymentType,
        'transaction_id' => $midtransTxId,
        'current_status' => $newStatus,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Gagal sinkronisasi status: ' . $e->getMessage()]);
}
