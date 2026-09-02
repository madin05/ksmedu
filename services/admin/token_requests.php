<?php
// services/admin/token_requests.php
// Daftar permintaan pembelian token (top-up) seluruh user untuk panel admin.
// Method: GET  -> ?status=pending|awaiting_proof|approved|rejected|cancelled
//                 &limit=&offset=
// Selalu menyertakan ringkasan jumlah per status agar tab UI tidak perlu
// memanggil endpoint berkali-kali.

require_once dirname(__DIR__) . '/db.php';
require_once dirname(__DIR__) . '/jwt_middleware.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['ok' => false, 'message' => 'Only GET allowed']);
    exit;
}

try {
    $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));
    $status = strtolower(trim((string)($_GET['status'] ?? '')));
    $allowed = ['awaiting_proof', 'pending', 'approved', 'rejected', 'cancelled'];
    if ($status !== '' && !in_array($status, $allowed, true)) {
        throw new InvalidArgumentException('Filter status tidak valid.');
    }

    $where = $status === '' ? '' : ' WHERE tpr.status = ?';
    $params = $status === '' ? [] : [$status];

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM token_purchase_requests tpr' . $where);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $pdo->prepare(
        'SELECT tpr.id, tpr.public_id, tpr.midtrans_order_id, tpr.midtrans_transaction_id,
                tpr.user_id, tpr.amount, tpr.price_rupiah, tpr.payment_type, tpr.mdr_fee, tpr.net_amount,
                tpr.status, tpr.created_at, tpr.submitted_at, tpr.approved_at, tpr.settled_at,
                tpr.rejected_at, tpr.rejection_reason, tpr.telegram_chat_id,
                tpr.telegram_user_id, tpr.telegram_proof_file_id, tpr.telegram_proof_type,
                tpr.proof_file_path, tpr.processed_by, tpr.processed_by_telegram_id,
                u.name AS user_name, u.email AS user_email,
                admin.name AS processed_by_name,
                w.balance AS user_balance
         FROM token_purchase_requests tpr
         LEFT JOIN users u ON u.id = tpr.user_id
         LEFT JOIN users admin ON admin.id = tpr.processed_by
         LEFT JOIN user_token_wallets w ON w.user_id = tpr.user_id' . $where .
        " ORDER BY tpr.created_at DESC, tpr.id DESC LIMIT {$limit} OFFSET {$offset}"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    require_once dirname(__DIR__) . '/midtrans_helper.php';
    foreach ($rows as &$row) {
        if (($row['status'] ?? '') === 'pending' && !empty($row['midtrans_order_id'])) {
            $synced = midtrans_sync_single_request($pdo, [
                'id' => $row['id'],
                'midtrans_order_id' => $row['midtrans_order_id'],
                'status' => $row['status'],
                'price_rupiah' => $row['price_rupiah'],
            ]);
            $row['status'] = $synced['status'];
            if (!empty($synced['payment_type'])) {
                $row['payment_type'] = $synced['payment_type'];
            }
        }
    }
    unset($row);

    $summary = array_fill_keys($allowed, 0);
    $summaryStmt = $pdo->query(
        'SELECT status, COUNT(*) AS total FROM token_purchase_requests GROUP BY status'
    );
    foreach ($summaryStmt->fetchAll() as $row) {
        $key = (string)$row['status'];
        if (array_key_exists($key, $summary)) {
            $summary[$key] = (int)$row['total'];
        }
    }
    $summary['all'] = array_sum(array_intersect_key($summary, array_flip($allowed)));

    // Total token yang sudah pernah dikreditkan & nilai rupiah disetujui.
    $totals = $pdo->query(
        "SELECT
            COALESCE(SUM(CASE WHEN status = 'approved' THEN amount END), 0) AS approved_tokens,
            COALESCE(SUM(CASE WHEN status = 'approved' THEN price_rupiah END), 0) AS approved_rupiah
         FROM token_purchase_requests"
    )->fetch();

    echo json_encode([
        'ok' => true,
        'results' => array_map(static function (array $row): array {
            return [
                'id' => (int)$row['id'],
                'publicId' => $row['public_id'],
                'midtransOrderId' => $row['midtrans_order_id'],
                'midtransTransactionId' => $row['midtrans_transaction_id'],
                'userId' => (int)$row['user_id'],
                'userName' => $row['user_name'],
                'userEmail' => $row['user_email'],
                'userBalance' => (int)($row['user_balance'] ?? 0),
                'amount' => (int)$row['amount'],
                'priceRupiah' => $row['price_rupiah'] === null ? null : (int)$row['price_rupiah'],
                'paymentType' => $row['payment_type'],
                'mdrFee' => $row['mdr_fee'] === null ? 0.00 : (float)$row['mdr_fee'],
                'netAmount' => $row['net_amount'] === null ? ($row['price_rupiah'] === null ? 0.00 : (float)$row['price_rupiah']) : (float)$row['net_amount'],
                'status' => $row['status'],
                'createdAt' => $row['created_at'],
                'submittedAt' => $row['submitted_at'],
                'approvedAt' => $row['approved_at'],
                'settledAt' => $row['settled_at'],
                'rejectedAt' => $row['rejected_at'],
                'rejectionReason' => $row['rejection_reason'],
                'telegramChatId' => $row['telegram_chat_id'] === null ? null : (int)$row['telegram_chat_id'],
                'telegramUserId' => $row['telegram_user_id'] === null ? null : (int)$row['telegram_user_id'],
                'hasProof' => !empty($row['telegram_proof_file_id']) || !empty($row['proof_file_path']),
                'proofFilePath' => $row['proof_file_path'],
                'proofType' => $row['telegram_proof_type'] ?: 'image',
                'processedByName' => $row['processed_by_name'],
                'processedByTelegramId' => $row['processed_by_telegram_id'] === null
                    ? null
                    : (int)$row['processed_by_telegram_id'],
            ];
        }, $rows),
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset,
        'status' => $status,
        'summary' => $summary,
        'approvedTokens' => (int)($totals['approved_tokens'] ?? 0),
        'approvedRupiah' => (int)($totals['approved_rupiah'] ?? 0),
    ]);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('Admin token requests error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Gagal memuat permintaan token.']);
}
