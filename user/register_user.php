<?php
$page_title = 'User Register - KSM Education';
?>
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>User Register - KSM Education</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="shortcut icon" type="image/x-icon" href="../assets/favicon.ico" />
    <link rel="stylesheet" href="../styles/login_user.css" />
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

      <!-- Footer Links -->
      <div class="signup-link">
        Sudah punya akun? <a href="login_user.php">Masuk di sini</a>
      </div>

      <div class="back-to-home">
        <a href="dashboard_user.php">
          <i data-feather="arrow-left"></i>
          Kembali ke Beranda
        </a>
      </div>
    </div>

    <script src="../js/register_user.js"></script>
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
