<?php
/**
 * services/midtrans_notification.php
 * Webhook handler for Midtrans Payment Notifications.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/midtrans_helper.php';
require_once __DIR__ . '/token_service.php';

try {
    $json = file_get_contents('php://input');
    $notif = json_decode($json, true);

    if (empty($notif)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Empty notification payload']);
        exit;
    }

    $orderId = (string)($notif['order_id'] ?? '');
    $statusCode = (string)($notif['status_code'] ?? '');
    $grossAmount = (string)($notif['gross_amount'] ?? '');
    $signatureKey = (string)($notif['signature_key'] ?? '');
    $transactionStatus = (string)($notif['transaction_status'] ?? '');
    $fraudStatus = (string)($notif['fraud_status'] ?? '');
    $paymentType = (string)($notif['payment_type'] ?? '');

    if (empty($orderId) || empty($signatureKey)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Invalid notification format']);
        exit;
    }

    // Verify Signature
    if (!midtrans_verify_signature($orderId, $statusCode, $grossAmount, $signatureKey)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'message' => 'Invalid signature key']);
        exit;
    }

    // Find request in DB
    $stmt = $pdo->prepare(
        'SELECT id, public_id, user_id, amount, status
         FROM token_purchase_requests
         WHERE midtrans_order_id = ? FOR UPDATE'
    );
    $stmt->execute([$orderId]);
    $request = $stmt->fetch();

    if (!$request) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'Order not found']);
        exit;
    }

    $requestId = (int)$request['id'];

    // Update payment type
    if (!empty($paymentType)) {
        $stmt = $pdo->prepare('UPDATE token_purchase_requests SET payment_type = ? WHERE id = ?');
        $stmt->execute([$paymentType, $requestId]);
    }

    // Handle Payment Statuses
    if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
        if ($transactionStatus === 'capture' && $fraudStatus === 'challenge') {
            // Transaction challenged by fraud detection
            $stmt = $pdo->prepare("UPDATE token_purchase_requests SET status = 'pending' WHERE id = ?");
            $stmt->execute([$requestId]);
        } else {
            // Payment Success: Update financial metrics & approve token credit
            $midtransTxId = (string)($notif['transaction_id'] ?? '');
            $grossAmt = (float)($notif['gross_amount'] ?? 0);
            $mdrFee = (strpos(strtolower($paymentType), 'qris') !== false || strpos(strtolower($paymentType), 'gopay') !== false)
                ? round($grossAmt * 0.007, 2)
                : 0.00;
            $netAmt = max(0, $grossAmt - $mdrFee);

            $stmt = $pdo->prepare(
                'UPDATE token_purchase_requests
                 SET midtrans_transaction_id = ?, payment_type = ?, mdr_fee = ?, net_amount = ?, settled_at = CURRENT_TIMESTAMP
                 WHERE id = ?'
            );
            $stmt->execute([$midtransTxId, $paymentType, $mdrFee, $netAmt, $requestId]);

            // Atomic & Idempotent Token Approval
            token_admin_approve_purchase($pdo, $requestId, 0);
        }
    } elseif (in_array($transactionStatus, ['cancel', 'deny'], true)) {
        $stmt = $pdo->prepare("UPDATE token_purchase_requests SET status = 'cancelled', rejected_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$requestId]);
    } elseif ($transactionStatus === 'expire') {
        $stmt = $pdo->prepare("UPDATE token_purchase_requests SET status = 'expired', rejected_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$requestId]);
    } elseif ($transactionStatus === 'pending') {
        $stmt = $pdo->prepare("UPDATE token_purchase_requests SET status = 'pending' WHERE id = ?");
        $stmt->execute([$requestId]);
    }

    echo json_encode(['ok' => true, 'message' => 'Notification processed successfully']);
} catch (Throwable $e) {
    error_log('Midtrans Notification Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
