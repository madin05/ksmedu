<?php

/**
 * Shared token-wallet service.
 * This file intentionally sends no HTTP response so it can be reused by the
 * Telegram webhook and regular API endpoints.
 */

function token_generate_public_id(): string
{
    return 'TOK-' . strtoupper(bin2hex(random_bytes(6)));
}

function token_get_wallet(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare(
        'INSERT INTO user_token_wallets (user_id, balance) VALUES (?, 0)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)'
    );
    $stmt->execute([$userId]);

    $stmt = $pdo->prepare('SELECT balance, updated_at FROM user_token_wallets WHERE user_id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $wallet = $stmt->fetch();

    return [
        'balance' => (int)($wallet['balance'] ?? 0),
        'updated_at' => $wallet['updated_at'] ?? null,
    ];
}

function token_get_history(PDO $pdo, int $userId, int $limit = 100): array
{
    require_once __DIR__ . '/midtrans_helper.php';
    $limit = max(1, min(100, $limit));
    $stmt = $pdo->prepare(
        "SELECT id, public_id, midtrans_order_id, snap_token, amount, price_rupiah, payment_type, status, created_at, approved_at, rejected_at
         FROM token_purchase_requests
         WHERE user_id = ?
         ORDER BY id DESC LIMIT {$limit}"
    );
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        if (($row['status'] ?? '') === 'pending' && !empty($row['midtrans_order_id'])) {
            $row = midtrans_sync_single_request($pdo, $row);
        }
    }
    unset($row);

    return array_map(static function (array $row): array {
        return [
            // ID database selalu tersedia, termasuk untuk riwayat lama yang
            // belum memiliki public_id. Dipakai oleh aksi hapus milik user.
            'id' => (string)$row['id'],
            'publicId' => $row['public_id'],
            'orderId' => $row['midtrans_order_id'] ?: $row['public_id'],
            'snapToken' => $row['snap_token'],
            'priceRupiah' => (int)($row['price_rupiah'] ?? 0),
            'paymentType' => $row['payment_type'] ?: 'QRIS / Midtrans',
            'amount' => (int)$row['amount'],
            'status' => $row['status'],
            'createdAt' => $row['created_at'],
            'approvedAt' => $row['approved_at'],
            'rejectedAt' => $row['rejected_at'],
        ];
    }, $rows);
}

/**
 * Debit an upload token inside the caller's database transaction.
 *
 * The journal/opinion must be inserted first so its id can be used as the
 * immutable ledger reference. The unique ledger key makes retries safe.
 */
function token_debit_upload(
    PDO $pdo,
    int $userId,
    string $referenceType,
    int $referenceId,
    int $cost = 1,
    string $description = 'Content submission'
): array {
    if (!$pdo->inTransaction()) {
        throw new LogicException('Upload token debit must run inside a database transaction.');
    }

    if ($userId < 1 || $referenceId < 1 || $cost < 1) {
        throw new InvalidArgumentException('Invalid upload token debit parameters.');
    }

    if (!preg_match('/^[a-z0-9_]{1,50}$/', $referenceType)) {
        throw new InvalidArgumentException('Invalid token reference type.');
    }

    $stmt = $pdo->prepare(
        'INSERT INTO user_token_wallets (user_id, balance) VALUES (?, 0)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)'
    );
    $stmt->execute([$userId]);

    $stmt = $pdo->prepare(
        'SELECT balance FROM user_token_wallets WHERE user_id = ? FOR UPDATE'
    );
    $stmt->execute([$userId]);
    $currentBalance = (int)$stmt->fetchColumn();

    if ($currentBalance < $cost) {
        throw new RuntimeException('Saldo token tidak mencukupi.', 402);
    }

    $newBalance = $currentBalance - $cost;
    $stmt = $pdo->prepare(
        'UPDATE user_token_wallets
         SET balance = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?'
    );
    $stmt->execute([$newBalance, $userId]);

    $stmt = $pdo->prepare(
        "INSERT INTO token_transactions
           (user_id, type, amount, balance_after, reference_type, reference_id,
            status, description, processed_at)
         VALUES (?, 'upload', ?, ?, ?, ?, 'completed', ?, CURRENT_TIMESTAMP)"
    );
    $stmt->execute([
        $userId,
        -$cost,
        $newBalance,
        $referenceType,
        $referenceId,
        substr($description, 0, 500),
    ]);

    return [
        'cost' => $cost,
        'balance' => $newBalance,
        'transaction_id' => (int)$pdo->lastInsertId(),
    ];
}

/**
 * Approve once and credit the wallet atomically.
 * Repeated Telegram callbacks return the existing balance without crediting it.
 */
function token_approve_purchase(PDO $pdo, int $requestId, int $approvedByTelegramId): array
{
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'SELECT id, public_id, user_id, amount, status
             FROM token_purchase_requests WHERE id = ? FOR UPDATE'
        );
        $stmt->execute([$requestId]);
        $request = $stmt->fetch();

        if (!$request) {
            throw new RuntimeException('Permintaan token tidak ditemukan.');
        }

        if ($request['status'] === 'approved') {
            $wallet = token_get_wallet($pdo, (int)$request['user_id']);
            $pdo->commit();
            return [
                'ok' => true,
                'already_processed' => true,
                'public_id' => $request['public_id'],
                'amount' => (int)$request['amount'],
                'balance' => $wallet['balance'],
            ];
        }

        if ($request['status'] !== 'pending') {
            throw new RuntimeException('Hanya transaksi berstatus pending yang dapat disetujui.');
        }

        // Lock the wallet row before calculating balance_after. The upsert is
        // intentional: it also supports accounts created after migration 001.
        $stmt = $pdo->prepare(
            'INSERT INTO user_token_wallets (user_id, balance) VALUES (?, 0)
             ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)'
        );
        $stmt->execute([(int)$request['user_id']]);

        $stmt = $pdo->prepare(
            'SELECT balance FROM user_token_wallets WHERE user_id = ? FOR UPDATE'
        );
        $stmt->execute([(int)$request['user_id']]);
        $currentBalance = (int)$stmt->fetchColumn();
        $newBalance = $currentBalance + (int)$request['amount'];

        $stmt = $pdo->prepare(
            'UPDATE user_token_wallets
             SET balance = ?, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?'
        );
        $stmt->execute([$newBalance, (int)$request['user_id']]);

        // The purchase request id is the idempotency reference. The unique
        // ledger key prevents duplicate credits even if a callback is retried.
        $stmt = $pdo->prepare(
            "INSERT INTO token_transactions
               (user_id, type, amount, balance_after, reference_type, reference_id,
                status, description, processed_by_telegram_id, processed_at)
             VALUES (?, 'purchase', ?, ?, 'token_purchase_request', ?, 'completed',
                     ?, ?, CURRENT_TIMESTAMP)"
        );
        $stmt->execute([
            (int)$request['user_id'],
            (int)$request['amount'],
            $newBalance,
            (int)$request['id'],
            'Purchase approval ' . $request['public_id'],
            $approvedByTelegramId,
        ]);

        $stmt = $pdo->prepare(
            "UPDATE token_purchase_requests
             SET status = 'approved', approved_at = CURRENT_TIMESTAMP,
                 processed_by_telegram_id = ?
             WHERE id = ?"
        );
        $stmt->execute([$approvedByTelegramId, $requestId]);

        $wallet = [
            'balance' => $newBalance,
            'updated_at' => date('Y-m-d H:i:s'),
        ];
        $pdo->commit();

        return [
            'ok' => true,
            'already_processed' => false,
            'public_id' => $request['public_id'],
            'amount' => (int)$request['amount'],
            'balance' => $wallet['balance'],
        ];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Approve a purchase request from the admin web panel.
 *
 * Mirrors token_approve_purchase() but records the acting admin as an internal
 * user id (processed_by) instead of a Telegram id, so manual top-up
 * verification done on admin/token_requests.php stays auditable.
 */
function token_admin_approve_purchase(PDO $pdo, int $requestId, int $adminUserId): array
{
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'SELECT id, public_id, user_id, amount, status
             FROM token_purchase_requests WHERE id = ? FOR UPDATE'
        );
        $stmt->execute([$requestId]);
        $request = $stmt->fetch();

        if (!$request) {
            throw new RuntimeException('Permintaan token tidak ditemukan.');
        }

        if ($request['status'] === 'approved') {
            $wallet = token_get_wallet($pdo, (int)$request['user_id']);
            $pdo->commit();
            return [
                'ok' => true,
                'already_processed' => true,
                'public_id' => $request['public_id'],
                'amount' => (int)$request['amount'],
                'balance' => $wallet['balance'],
            ];
        }

        if (!in_array($request['status'], ['pending', 'awaiting_proof'], true)) {
            throw new RuntimeException('Hanya transaksi pending atau menunggu bukti yang dapat disetujui.');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO user_token_wallets (user_id, balance) VALUES (?, 0)
             ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)'
        );
        $stmt->execute([(int)$request['user_id']]);

        $stmt = $pdo->prepare('SELECT balance FROM user_token_wallets WHERE user_id = ? FOR UPDATE');
        $stmt->execute([(int)$request['user_id']]);
        $newBalance = (int)$stmt->fetchColumn() + (int)$request['amount'];

        $stmt = $pdo->prepare(
            'UPDATE user_token_wallets
             SET balance = ?, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?'
        );
        $stmt->execute([$newBalance, (int)$request['user_id']]);

        $stmt = $pdo->prepare(
            "INSERT INTO token_transactions
               (user_id, type, amount, balance_after, reference_type, reference_id,
                status, description, processed_by, processed_at)
             VALUES (?, 'purchase', ?, ?, 'token_purchase_request', ?, 'completed',
                     ?, ?, CURRENT_TIMESTAMP)"
        );
        $stmt->execute([
            (int)$request['user_id'],
            (int)$request['amount'],
            $newBalance,
            (int)$request['id'],
            'Verifikasi manual admin ' . $request['public_id'],
            $adminUserId,
        ]);

        $stmt = $pdo->prepare(
            "UPDATE token_purchase_requests
             SET status = 'approved', approved_at = CURRENT_TIMESTAMP, processed_by = ?
             WHERE id = ?"
        );
        $stmt->execute([$adminUserId, $requestId]);
        $pdo->commit();

        return [
            'ok' => true,
            'already_processed' => false,
            'public_id' => $request['public_id'],
            'amount' => (int)$request['amount'],
            'balance' => $newBalance,
        ];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Reject a purchase request from the admin web panel, optionally storing the
 * reason shown to the user in their token history.
 */
function token_admin_reject_purchase(PDO $pdo, int $requestId, int $adminUserId, string $reason = ''): array
{
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'SELECT id, public_id, user_id, amount, status, telegram_chat_id
             FROM token_purchase_requests WHERE id = ? FOR UPDATE'
        );
        $stmt->execute([$requestId]);
        $request = $stmt->fetch();

        if (!$request) {
            throw new RuntimeException('Permintaan token tidak ditemukan.');
        }

        if ($request['status'] === 'rejected') {
            $pdo->commit();
            return ['ok' => true, 'already_processed' => true] + $request;
        }

        if (!in_array($request['status'], ['pending', 'awaiting_proof'], true)) {
            throw new RuntimeException('Hanya transaksi pending atau menunggu bukti yang dapat ditolak.');
        }

        $stmt = $pdo->prepare(
            "UPDATE token_purchase_requests
             SET status = 'rejected', rejected_at = CURRENT_TIMESTAMP,
                 processed_by = ?, rejection_reason = ?
             WHERE id = ?"
        );
        $stmt->execute([$adminUserId, ($reason === '' ? null : mb_substr($reason, 0, 500)), $requestId]);
        $pdo->commit();

        return ['ok' => true, 'already_processed' => false] + $request;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function token_reject_purchase(PDO $pdo, int $requestId, int $rejectedByTelegramId): array
{

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'SELECT id, public_id, user_id, amount, status, telegram_chat_id
             FROM token_purchase_requests WHERE id = ? FOR UPDATE'
        );
        $stmt->execute([$requestId]);
        $request = $stmt->fetch();

        if (!$request) {
            throw new RuntimeException('Permintaan token tidak ditemukan.');
        }

        if ($request['status'] === 'rejected') {
            $pdo->commit();
            return ['ok' => true, 'already_processed' => true] + $request;
        }

        if ($request['status'] !== 'pending') {
            throw new RuntimeException('Hanya transaksi berstatus pending yang dapat ditolak.');
        }

        $stmt = $pdo->prepare(
            "UPDATE token_purchase_requests
             SET status = 'rejected', rejected_at = CURRENT_TIMESTAMP,
                 processed_by_telegram_id = ?
             WHERE id = ?"
        );
        $stmt->execute([$rejectedByTelegramId, $requestId]);
        $pdo->commit();

        return ['ok' => true, 'already_processed' => false] + $request;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}
