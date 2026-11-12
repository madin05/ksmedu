<?php
require_once __DIR__ . '/../services/env_loader.php';
$page_title = 'User Register - KSM Education';
$google_client_id = getenv('GOOGLE_CLIENT_ID') ?: '563246418789-mh2d9pt5edcpm161g00ehsts29nslstb.apps.googleusercontent.com';
?>
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>User Register - KSM Education</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <script>
      window.GOOGLE_CLIENT_ID = <?= json_encode($google_client_id) ?>;
    </script>
    <!--
      ===== DARK MODE — INIT AWAL (anti-flash) =====
      Halaman auth tidak memakai user/components/header.php, jadi init
      tema harus ditulis ulang di sini.
    -->
    <script>
      (function () {
        try {
          if (localStorage.getItem('ksm_theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        } catch (e) {
          /* localStorage tidak tersedia — abaikan, default light */
        }
      })();
    </script>
    <link rel="stylesheet" href="../styles/base/fonts.css" />

    <link rel="shortcut icon" type="image/x-icon" href="../assets/favicon.ico" />
    <link rel="stylesheet" href="../styles/user/login_user.css" />
    <!-- dark_mode_p4.css dimuat setelah login_user.css supaya override menang -->
    <link rel="stylesheet" href="../styles/base/dark_mode/dark_mode_p4.css?v=20260801" />
    <script src="../js/config.js?v=20260325"></script>

    <script src="https://unpkg.com/feather-icons"></script>
    <style>
        .register-wrapper {
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .user-badge {
            background: #e0f2fe;
            color: #0369a1;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 10px;
        }
    </style>
  </head>

  <body>
    <div class="login-wrapper register-wrapper">
      <!-- Header -->
      <div class="login-header">
        <img src="../assets/main_logo.png" alt="KSM Education Logo" class="login-logo" />
        <br>
        <span class="user-badge">User Register</span>
        <h2>Buat Akun Baru</h2>
        <p>Silakan isi data diri Anda untuk mendaftar</p>
      </div>

      <!-- Alert Box -->
      <div id="alertBox" class="alert"></div>

      <!-- Register Form -->
      <form id="registerForm" class="login-form">
        <div class="form-group">
          <input
            type="text"
            id="regName"
            placeholder="Nama Lengkap"
            required
          />
        </div>

        <div class="form-group">
          <input
            type="email"
            id="regEmail"
            placeholder="Alamat Email"
            required
          />
        </div>

        <div class="form-group password-group">
          <input
            type="password"
            id="regPassword"
            placeholder="Password Minimal 6 Karakter"
            required
          />
          <button type="button" class="toggle-password" onclick="togglePass('regPassword', this)">
            <i data-feather="eye"></i>
          </button>
        </div>

        <div class="form-group password-group">
          <input
            type="password"
            id="regConfirmPassword"
            placeholder="Konfirmasi Password"
            required
          />
          <button type="button" class="toggle-password" onclick="togglePass('regConfirmPassword', this)">
            <i data-feather="eye"></i>
          </button>
        </div>

        <button type="submit" class="btn-login">
          <span class="btn-text">Daftar Sekarang</span>
          <div class="loading"></div>
        </button>
      </form>

      <!-- Divider -->
      <div class="divider">
        <span>ATAU</span>
      </div>

      <!-- Social Login / Google Identity Services -->
      <div class="social-login-container" style="display: flex; justify-content: center; align-items: center; width: 100%; margin: 10px 0 20px;">
        <div id="googleBtnContainer" style="width: 100%; min-height: 44px; display: flex; justify-content: center;"></div>
      </div>

      <!-- Footer Links -->
      <div class="signup-link">
        Sudah punya akun? <a href="login">Masuk di sini</a>
      </div>

      <div class="back-to-home">
        <a href="dashboard">
          <i data-feather="arrow-left"></i>
          Kembali ke Beranda
        </a>
      </div>
    </div>

    <script src="../js/auth_storage.js?v=20260801"></script>
    <script src="../js/register_user.js?v=20260801"></script>
    <script>
      feather.replace();
      function togglePass(id, btn) {
          const input = document.getElementById(id);
          const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
          input.setAttribute('type', type);
          const icon = type === 'password' ? 'eye' : 'eye-off';
          btn.innerHTML = `<i data-feather="${icon}"></i>`;
          feather.replace();
      }
    </script>
  </body>
</html>
