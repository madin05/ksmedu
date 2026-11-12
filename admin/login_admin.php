<?php
// admin/login_admin.php
// Halaman login khusus administrator. Tidak boleh memakai auth_guard
// (halaman ini justru tujuan redirect dari guard).
require_once __DIR__ . '/../services/auth_context.php';
ksmedu_session_start(KSMEDU_CTX_ADMIN);

// Jika sudah login sebagai admin di sesi admin, verifikasi ke DB sebelum redirect ke dashboard.
// Cegah loop tak berujung (ERR_TOO_MANY_REDIRECTS) jika session ada tetapi tidak lolos di auth_guard.
if (!empty($_SESSION['user_id']) && ($_SESSION['role'] ?? '') === 'admin') {
    try {
        require_once __DIR__ . '/../services/db.php';
        $ksmedu_stmt = $pdo->prepare(
            "SELECT role, account_status FROM users WHERE id = ? LIMIT 1"
        );
        $ksmedu_stmt->execute([(int)$_SESSION['user_id']]);
        $ksmedu_row = $ksmedu_stmt->fetch();
        if ($ksmedu_row && ($ksmedu_row['role'] ?? '') === 'admin' && (($ksmedu_row['account_status'] ?? 'active') === 'active')) {
            header('Location: dashboard_admin.php');
            exit;
        } else {
            // Sesi kedaluwarsa atau bukan admin aktif di DB, bersihkan agar tidak loop
            $_SESSION = [];
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params["path"], $params["domain"],
                    $params["secure"], $params["httponly"]
                );
            }
            session_destroy();
        }
    } catch (Throwable $e) {
        error_log('Admin login precheck error: ' . $e->getMessage());
        // Jika koneksi DB bermasalah, jangan redirect agar tidak loop
    }
}

// Halaman tujuan setelah login (whitelist nama file di folder admin).
$next = basename((string)($_GET['next'] ?? 'dashboard_admin.php'));
if ($next === '' || $next === 'login_admin.php' || !preg_match('/^[a-z0-9_\-]+\.php$/i', $next) || !file_exists(__DIR__ . '/' . $next)) {
    $next = 'dashboard_admin.php';
}
?>
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login Admin - KSM Education</title>
    <link rel="stylesheet" href="../styles/base/fonts.css" />
    <link rel="stylesheet" href="../styles/admin/login_admin.css" />
    <link rel="stylesheet" href="../styles/base/custom_alerts.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../assets/favicon.ico" />
    <script src="../js/config.js"></script>
    <script src="https://unpkg.com/feather-icons"></script>
  </head>
  <body class="admin-login-body">
    <main class="admin-login-wrapper">
      <div class="admin-login-card">
        <div class="admin-badge-container">
          <span class="admin-badge"><i data-feather="shield"></i> Admin Portal</span>
        </div>
        <img src="../assets/main_logo.png" alt="KSM Education" class="login-logo" />
        <h1>Login Administrator</h1>
        <p class="subtitle">Masuk untuk mengelola panel KSM Education</p>

        <div class="login-alert" id="loginAlert" role="alert" aria-live="polite"></div>

        <form id="adminLoginForm" novalidate>
          <div class="form-group">
            <label for="adminEmail">Email</label>
            <div class="input-with-icon">
              <i data-feather="mail" class="field-icon"></i>
              <input
                type="email"
                id="adminEmail"
                name="email"
                autocomplete="username"
                placeholder="ksmedu2025@gmail.com"
                required
              />
            </div>
          </div>
          <div class="form-group password-group">
            <label for="adminPassword">Password</label>
            <div class="input-with-icon">
              <i data-feather="lock" class="field-icon"></i>
              <input
                type="password"
                id="adminPassword"
                name="password"
                autocomplete="current-password"
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                class="toggle-password"
                id="togglePassword"
                aria-label="Tampilkan password"
              >
                <i data-feather="eye"></i>
              </button>
            </div>
          </div>
          <button type="submit" class="btn-login" id="btnAdminLogin">
            <i data-feather="log-in"></i> MASUK
          </button>
        </form>

        <div class="back-link-container">
          <a class="back-link" href="../index.php">
            <i data-feather="arrow-left"></i> Kembali ke halaman utama
          </a>
        </div>
      </div>
    </main>

    <script>
      window.ADMIN_LOGIN_NEXT = <?php echo json_encode($next, JSON_UNESCAPED_SLASHES); ?>;
    </script>
    <script src="../js/auth_storage.js?v=20260801"></script>
    <script src="../js/login_admin.js?v=20260801"></script>
    <script>
      if (window.feather) window.feather.replace();
    </script>
  </body>
</html>
