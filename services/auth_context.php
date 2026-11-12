<?php
/**
 * services/auth_context.php
 *
 * PEMISAHAN KONTEKS SESI: panel admin (/admin) vs area pengguna (/user).
 *
 * LATAR MASALAH (bug yang diperbaiki):
 * Sebelumnya seluruh aplikasi memakai SATU session PHP (cookie PHPSESSID)
 * dan SATU set key JWT di localStorage. Akibatnya:
 *
 *   1. Login di /admin ikut membuat $_SESSION['user_id'] yang dipakai
 *      jwt_middleware.php sebagai fallback, sehingga halaman /user
 *      langsung "ikut login" sebagai admin tanpa pernah login di sana.
 *   2. Login user biasa menimpa session/token admin di tab lain
 *      (dan sebaliknya) — dua peran saling merusak sesi.
 *   3. Logout dari salah satu sisi mematikan sesi sisi lainnya.
 *
 * SOLUSI:
 * Setiap konteks memakai NAMA COOKIE SESSION SENDIRI sehingga dua sesi
 * dapat hidup berdampingan tanpa saling menimpa:
 *
 *   konteks 'user'  -> cookie KSMEDUSESS
 *   konteks 'admin' -> cookie KSMEDUADMSESS
 *
 * Token JWT juga membawa klaim 'ctx' dan hanya berlaku pada konteks yang
 * sama (lihat jwt_helper.php / jwt_middleware.php).
 *
 * Catatan keamanan: konteks dapat dipilih klien (header/query), namun itu
 * TIDAK memberi eskalasi hak — klien tetap harus memiliki cookie/token
 * milik konteks tersebut. Konteks hanya menentukan "kotak sesi" mana yang
 * dibaca, bukan hak akses.
 */

if (defined('KSMEDU_AUTH_CONTEXT_LOADED')) {
    return;
}
define('KSMEDU_AUTH_CONTEXT_LOADED', true);

define('KSMEDU_CTX_ADMIN', 'admin');
define('KSMEDU_CTX_USER', 'user');

/**
 * Nama cookie session per konteks.
 */
function ksmedu_session_name(string $context): string
{
    return $context === KSMEDU_CTX_ADMIN ? 'KSMEDUADMSESS' : 'KSMEDUSESS';
}

/**
 * Normalisasi nilai konteks bebas menjadi 'admin' atau 'user'.
 */
function ksmedu_normalize_context($value): ?string
{
    $value = strtolower(trim((string)$value));
    if ($value === KSMEDU_CTX_ADMIN) {
        return KSMEDU_CTX_ADMIN;
    }
    if ($value === KSMEDU_CTX_USER) {
        return KSMEDU_CTX_USER;
    }
    return null;
}

/**
 * Tentukan konteks request saat ini.
 *
 * Prioritas:
 *   1. Konstanta KSMEDU_FORCE_CONTEXT (di-set halaman/endpoint tertentu)
 *   2. Header X-KSM-Context (dikirim js/api.js & halaman auth)
 *   3. Query/body parameter ctx (untuk navigasi GET seperti logout)
 *   4. Path skrip yang dieksekusi (halaman di dalam /admin/)
 *   5. Referer (fetch dari halaman /admin/ ke /services/*)
 *   6. Default: 'user'
 */
function ksmedu_request_context(): string
{
    static $resolved = null;
    if ($resolved !== null) {
        return $resolved;
    }

    if (defined('KSMEDU_FORCE_CONTEXT')) {
        $forced = ksmedu_normalize_context(KSMEDU_FORCE_CONTEXT);
        if ($forced !== null) {
            return $resolved = $forced;
        }
    }

    $fromHeader = ksmedu_normalize_context($_SERVER['HTTP_X_KSM_CONTEXT'] ?? '');
    if ($fromHeader !== null) {
        return $resolved = $fromHeader;
    }

    $fromQuery = ksmedu_normalize_context($_GET['ctx'] ?? '');
    if ($fromQuery !== null) {
        return $resolved = $fromQuery;
    }

    $script = (string)($_SERVER['SCRIPT_NAME'] ?? '');
    if (strpos($script, '/admin/') !== false || preg_match('#/(admin)(/|$|\.)#', $script)) {
        return $resolved = KSMEDU_CTX_ADMIN;
    }

    $referer = (string)($_SERVER['HTTP_REFERER'] ?? '');
    if ($referer !== '') {
        $path = (string)(parse_url($referer, PHP_URL_PATH) ?? '');
        if (strpos($path, '/admin/') !== false || preg_match('#/(admin)(/|$)#', $path)) {
            return $resolved = KSMEDU_CTX_ADMIN;
        }
    }

    return $resolved = KSMEDU_CTX_USER;
}

/**
 * Mulai session untuk konteks tertentu (default: konteks request).
 * Aman dipanggil berulang kali.
 *
 * @return string konteks yang aktif
 */
function ksmedu_session_start(?string $context = null): string
{
    $context = ksmedu_normalize_context($context) ?? ksmedu_request_context();
    $name = ksmedu_session_name($context);

    if (session_status() === PHP_SESSION_ACTIVE) {
        // Session sudah jalan. Bila ternyata milik konteks lain, tutup dulu
        // supaya identitas dua peran tidak pernah tercampur dalam 1 request.
        if (session_name() === $name) {
            return $context;
        }
        session_write_close();
    }

    session_name($name);

    $secure = (
        (($_SERVER['HTTPS'] ?? '') !== '' && strtolower((string)$_SERVER['HTTPS']) !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
    );

    if (PHP_VERSION_ID >= 70300) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure'   => $secure,
        ]);
    } else {
        session_set_cookie_params(0, '/', '', $secure, true);
    }

    session_start();

    // Tandai konteks di dalam session agar cookie yang "dipindah tangan"
    // tidak bisa dipakai lintas konteks.
    if (empty($_SESSION['ksm_ctx'])) {
        $_SESSION['ksm_ctx'] = $context;
    } elseif ($_SESSION['ksm_ctx'] !== $context) {
        $_SESSION = [];
        $_SESSION['ksm_ctx'] = $context;
    }

    return $context;
}

/**
 * Hancurkan session pada konteks aktif saja (konteks lain tetap hidup).
 */
function ksmedu_session_destroy(?string $context = null): void
{
    $context = ksmedu_session_start($context);
    $name = ksmedu_session_name($context);

    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            $name,
            '',
            time() - 42000,
            $params['path'] ?: '/',
            $params['domain'] ?? '',
            (bool)($params['secure'] ?? false),
            (bool)($params['httponly'] ?? true)
        );
    }
    session_destroy();
}
