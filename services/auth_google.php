<?php
/**
 * POST /services/auth_google.php — Login / Registrasi via Google Identity Services (GIS).
 * Verifikasi ID Token dari Google, mengotentikasi atau membuat akun user baru,
 * lalu menerbitkan JWT access & refresh token.
 */

define('KSMEDU_FORCE_CONTEXT', 'user');

require_once __DIR__ . '/auth_context.php';
ksmedu_session_start(KSMEDU_CTX_USER);
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/env_loader.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['ok' => false, 'message' => 'Metode tidak diizinkan.']);
    exit;
}

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    $idToken = trim($data['id_token'] ?? $_POST['id_token'] ?? '');

    if (empty($idToken)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Token Google tidak ditemukan!']);
        exit;
    }

    $googleClientId = getenv('GOOGLE_CLIENT_ID') ?: '563246418789-mh2d9pt5edcpm161g00ehsts29nslstb.apps.googleusercontent.com';

    // Verifikasi Token ke Endpoint Google tokeninfo API
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'message' => 'Token Google tidak valid atau sudah kadaluarsa.']);
        exit;
    }

    $payload = json_decode($response, true);
    if (!$payload || empty($payload['email'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'message' => 'Email dari akun Google tidak ditemukan.']);
        exit;
    }

    $email = strtolower(trim($payload['email']));
    $name = trim($payload['name'] ?? explode('@', $email)[0]);

    // Cari user berdasarkan email (resilient terhadap ketiadaan kolom email_verified_at)
    $hasVerifiedCol = true;
    try {
        $stmt = $pdo->prepare("SELECT id, name, role, email, email_verified_at FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
    } catch (Throwable $e) {
        $hasVerifiedCol = false;
        $stmt = $pdo->prepare("SELECT id, name, role, email FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
    }

    if ($user) {
        // Update email_verified_at bila belum terverifikasi
        if ($hasVerifiedCol && empty($user['email_verified_at'])) {
            try {
                $updateStmt = $pdo->prepare("UPDATE users SET email_verified_at = NOW() WHERE id = ?");
                $updateStmt->execute([$user['id']]);
                $user['email_verified_at'] = date('Y-m-d H:i:s');
            } catch (Throwable $e) {}
        }
    } else {
        // Buat user baru otomatis
        $randomPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
        if ($hasVerifiedCol) {
            $insertStmt = $pdo->prepare("INSERT INTO users (email, email_verified_at, password_hash, name, role, created_at) VALUES (?, NOW(), ?, ?, 'user', NOW())");
            $insertStmt->execute([$email, $randomPassword, $name]);
        } else {
            $insertStmt = $pdo->prepare("INSERT INTO users (email, password_hash, name, role, created_at) VALUES (?, ?, ?, 'user', NOW())");
            $insertStmt->execute([$email, $randomPassword, $name]);
        }

        $newUserId = $pdo->lastInsertId();
        $user = [
            'id' => $newUserId,
            'email' => $email,
            'name' => $name,
            'role' => 'user',
        ];
        if ($hasVerifiedCol) {
            $user['email_verified_at'] = date('Y-m-d H:i:s');
        }
    }

    // Set PHP Session
    $_SESSION = [];
    session_regenerate_id(true);

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['name'] = $user['name'];
    $_SESSION['email'] = $user['email'];

    // Generate JWT Tokens
    $accessToken = generate_access_token($user);
    $refreshToken = generate_refresh_token($user);

    echo json_encode([
        'ok' => true,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role']
        ],
        'access_token' => $accessToken['token'],
        'refresh_token' => $refreshToken['token'],
        'expires_in' => $accessToken['expires_in']
    ]);

} catch (Throwable $e) {
    error_log('Google Auth Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Terjadi kesalahan sistem saat proses Google Login: ' . $e->getMessage()
    ]);
}
