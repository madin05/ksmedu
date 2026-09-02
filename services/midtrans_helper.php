<?php
/**
 * services/midtrans_helper.php
 * Helper library for Midtrans Payment Gateway Integration.
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/env_loader.php';

function midtrans_get_config(): array
{
    $serverKey = trim((string)get_env_var('MIDTRANS_SERVER_KEY', 'SB-Mid-server-YOUR_SERVER_KEY'));
    $clientKey = trim((string)get_env_var('MIDTRANS_CLIENT_KEY', 'SB-Mid-client-YOUR_CLIENT_KEY'));
    $merchantId = trim((string)get_env_var('MIDTRANS_MERCHANT_ID', ''));
    $isProduction = filter_var(get_env_var('MIDTRANS_IS_PRODUCTION', 'false'), FILTER_VALIDATE_BOOLEAN);

    $snapApiUrl = $isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    $snapJsUrl = $isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';

    return [
        'server_key' => $serverKey,
        'client_key' => $clientKey,
        'merchant_id' => $merchantId,
        'is_production' => $isProduction,
        'snap_api_url' => $snapApiUrl,
        'snap_js_url' => $snapJsUrl,
    ];
}

function midtrans_get_app_base_url(): string
{
    $envUrl = trim((string)get_env_var('APP_URL', ''));
    if (!empty($envUrl)) {
        return rtrim($envUrl, '/');
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';

    $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    $baseDir = preg_replace('#/(services|user|admin|api).*$#i', '', $scriptDir);
    $baseDir = str_replace('\\', '/', $baseDir);
    if ($baseDir === '/' || $baseDir === '.') {
        $baseDir = '';
    }

    return $scheme . '://' . $host . $baseDir;
}

/**
 * Request Snap Token & Redirect URL from Midtrans API.
 */
function midtrans_create_snap_transaction(array $payload): array
{
    $config = midtrans_get_config();
    if (empty($config['server_key']) || str_contains($config['server_key'], 'YOUR_SERVER_KEY')) {
        throw new RuntimeException('Midtrans Server Key belum dikonfigurasi di file .env.');
    }

    $authHeader = 'Basic ' . base64_encode($config['server_key'] . ':');

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $config['snap_api_url'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'Authorization: ' . $authHeader,
        ],
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $err = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($err) {
        throw new RuntimeException('Koneksi ke Midtrans gagal: ' . $err);
    }

    $result = json_decode($response, true);

    if ($httpCode >= 400 || empty($result['token'])) {
        $msg = $result['error_messages'][0] ?? ($result['message'] ?? 'Gagal membuat transaksi Midtrans.');
        throw new RuntimeException('Midtrans error (' . $httpCode . '): ' . $msg);
    }

    return [
        'token' => $result['token'],
        'redirect_url' => $result['redirect_url'] ?? '',
    ];
}

/**
 * Verify Webhook Signature Key from Midtrans.
 * Signature formula: sha512(order_id + status_code + gross_amount + server_key)
 */
function midtrans_verify_signature(string $orderId, string $statusCode, string $grossAmount, string $signatureKey): bool
{
    $config = midtrans_get_config();
    $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $config['server_key']);
    return hash_equals($expectedSignature, $signatureKey);
}

/**
 * Predefined Token Packages
 */
function midtrans_get_token_packages(): array
{
    return [
        'pkg_1' => [
            'id' => 'pkg_1',
            'tokens' => 1,
            'price' => 2500,
            'title' => 'Eceran',
            'tag' => 'Trial',
            'popular' => false,
            'per_token' => 2500,
            'discount' => 0
        ],
        'pkg_5' => [
            'id' => 'pkg_5',
            'tokens' => 5,
            'price' => 10000,
            'title' => 'Hemat',
            'tag' => 'Hemat 20%',
            'popular' => false,
            'per_token' => 2000,
            'discount' => 20
        ],
        'pkg_10' => [
            'id' => 'pkg_10',
            'tokens' => 10,
            'price' => 18000,
            'title' => 'Standar',
            'tag' => 'Paling Populer',
            'popular' => true,
            'per_token' => 1800,
            'discount' => 28
        ],
        'pkg_20' => [
            'id' => 'pkg_20',
            'tokens' => 20,
            'price' => 34000,
            'title' => 'Super',
            'tag' => 'Best Value',
            'popular' => false,
            'per_token' => 1700,
            'discount' => 32
        ],
        'pkg_50' => [
            'id' => 'pkg_50',
            'tokens' => 50,
            'price' => 80000,
            'title' => 'Sultan',
            'tag' => 'Diskon 36%',
            'popular' => false,
            'per_token' => 1600,
            'discount' => 36
        ],
    ];
}

/**
 * Auto-sync a single pending transaction with Midtrans API.
 */
function midtrans_sync_single_request(PDO $pdo, array $request): array
{
    if (empty($request['id']) || empty($request['midtrans_order_id']) || ($request['status'] ?? '') !== 'pending') {
        return $request;
    }

    try {
        require_once __DIR__ . '/token_service.php';
        $config = midtrans_get_config();
        $baseUrl = $config['is_production'] ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
        $statusUrl = $baseUrl . '/v2/' . urlencode($request['midtrans_order_id']) . '/status';

        $ch = curl_init($statusUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPGET => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Basic ' . base64_encode($config['server_key'] . ':'),
            ],
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 5,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || empty($response)) {
            return $request;
        }

        $resData = json_decode($response, true) ?? [];
        $txnStatus = strtolower((string)($resData['transaction_status'] ?? ''));
        $paymentType = (string)($resData['payment_type'] ?? '');
        $midtransTxId = (string)($resData['transaction_id'] ?? '');

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

            token_admin_approve_purchase($pdo, (int)$request['id'], 0);
            $request['status'] = 'approved';
            $request['payment_type'] = $paymentType;
        } elseif (in_array($txnStatus, ['cancel', 'deny'], true)) {
            $upStmt = $pdo->prepare("UPDATE token_purchase_requests SET status = 'cancelled', rejected_at = CURRENT_TIMESTAMP WHERE id = ?");
            $upStmt->execute([(int)$request['id']]);
            $request['status'] = 'cancelled';
        } elseif ($txnStatus === 'expire') {
            $upStmt = $pdo->prepare("UPDATE token_purchase_requests SET status = 'expired', rejected_at = CURRENT_TIMESTAMP WHERE id = ?");
            $upStmt->execute([(int)$request['id']]);
            $request['status'] = 'expired';
        }
    } catch (Throwable $e) {
        // Ignore background sync errors to avoid blocking page load
    }

    return $request;
}
