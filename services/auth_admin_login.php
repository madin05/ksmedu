<?php
/**
 * POST /services/auth_admin_login.php
 *
 * Login khusus panel admin. Berbeda dari auth_login.php:
 *   - hanya menerima akun dengan role = 'admin'
 *   - session tidak dibuat sama sekali jika role bukan admin
 *
 * Response sama seperti auth_login.php agar TokenManager di sisi klien
 * dapat dipakai tanpa perubahan.
 */

// Endpoint ini selalu berjalan pada konteks 'admin': session yang dibuat
// memakai cookie KSMEDUADMSESS dan token membawa klaim ctx=admin, sehingga
// sesi area user di tab lain tidak ikut berubah.
define('KSMEDU_FORCE_CONTEXT', 'admin');

require_once __DIR__ . '/auth_context.php';
ksmedu_session_start(KSMEDU_CTX_ADMIN);
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/login_guard.php';


try {
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        header('Allow: POST');
        echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $raw  = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    if (!is_array($data) || empty($data['email']) || empty($data['password'])) {
        // Status code harus mencerminkan hasil: input tidak lengkap = 422,
        // bukan 200 seperti sebelumnya (klien tidak bisa membedakan sukses/gagal
        // dari status HTTP).
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Email dan password wajib diisi!']);
        exit;
    }

    $email = trim((string)$data['email']);

    // Brute-force guard untuk panel admin (ambang lebih ketat daripada area
    // user). Dievaluasi sebelum query & bcrypt agar request terkunci tidak
    // memakan biaya komputasi.
    $retryAfter = login_guard_check($pdo, 'admin', $email);
    if ($retryAfter > 0) {
        login_guard_reject($retryAfter);
        exit;
    }

    // Cek kolom account_status secara resilient
    $hasAccountStatus = false;
    try {
        $cStatus = $pdo->query("SHOW COLUMNS FROM users LIKE 'account_status'");
        $hasAccountStatus = (bool)$cStatus->fetch();
    } catch (Throwable $e) {}

    $statusClause = $hasAccountStatus ? " AND (account_status = 'active' OR account_status IS NULL)" : "";

    $stmt = $pdo->prepare(
        "SELECT id, name, email, role, password_hash
         FROM users
         WHERE email = ?{$statusClause}
         LIMIT 1"
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Pesan generik: jangan bocorkan apakah email admin terdaftar atau tidak.
    $genericError = ['ok' => false, 'message' => 'Email atau password admin salah!'];

    if (!$user) {
        error_log("auth_admin_login: user not found or inactive for email '{$email}'");
        password_verify(
            (string)$data['password'],
            '$2y$10$usesomesillystringforeasyverificationabcdefghijklmnopqrstuv'
        );
        login_guard_record($pdo, 'admin', $email, false);
        login_guard_delay(login_guard_current_failures($pdo, 'admin', $email));
        http_response_code(401);
        echo json_encode($genericError);
        exit;
    }

    $passInput = (string)$data['password'];
    $hash = (string)$user['password_hash'];
    $isMatch = password_verify($passInput, $hash) || password_verify(trim($passInput), $hash);

    if (!$isMatch) {
        error_log("auth_admin_login: password mismatch for email '{$email}'");
        login_guard_record($pdo, 'admin', $email, false);
        login_guard_delay(login_guard_current_failures($pdo, 'admin', $email));
        http_response_code(401);
        echo json_encode($genericError);
        exit;
    }

    if (($user['role'] ?? 'user') !== 'admin') {
        // Password benar tetapi bukan admin: tetap dihitung sebagai kegagalan
        // agar endpoint admin tidak bisa dipakai sebagai oracle untuk menguji
        // kredensial akun user tanpa batas.
        login_guard_record($pdo, 'admin', $email, false);
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'message' => 'Akun ini bukan administrator. Gunakan halaman login pengguna.',
            'code' => 'NOT_ADMIN',
        ]);
        exit;
    }

    login_guard_clear($pdo, 'admin', $email);
    login_guard_record($pdo, 'admin', $email, true);

    // Session PHP (dipakai guard halaman admin & endpoint legacy)
    // Buang sisa sesi sebelumnya (mis. sesi user biasa) supaya tidak ada
    // data identitas campuran di dalam satu session.
    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['role']    = $user['role'];
    $_SESSION['name']    = $user['name'];
    $_SESSION['email']   = $user['email'];

    $accessToken  = generate_access_token($user);
    $refreshToken = generate_refresh_token($user);

    echo json_encode([
        'ok' => true,
        'user' => [
            'id'    => (int)$user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'role'  => $user['role'],
        ],
        'access_token'  => $accessToken['token'],
        'refresh_token' => $refreshToken['token'],
        'expires_in'    => $accessToken['expires_in'],
    ]);
} catch (LoginGuardUnavailableException $e) {
    // Fail closed: tanpa guard yang bisa dievaluasi, login admin ditolak.
    error_log('Admin login guard unavailable: ' . $e->getMessage());
    login_guard_unavailable();
} catch (Throwable $e) {
    error_log('Admin login error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Terjadi kesalahan server saat login.']);
}
