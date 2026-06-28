<?php
$page_title = 'User Login - KSM Education';
?>
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>User Login - KSM Education</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="../styles/fonts.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../assets/favicon.ico" />
    <link rel="stylesheet" href="../styles/login_user.css" />
    <script src="../js/config.js?v=20260325"></script>
    <script src="https://unpkg.com/feather-icons"></script>
  </head>

  <body>
    <div class="login-wrapper">
      <!-- Header -->
      <div class="login-header">
        <img src="../assets/main_logo.png" alt="KSM Education Logo" class="login-logo" />
        <br>
        <h2>Selamat Datang!</h2>
        <p>Masuk ke akun pengguna Anda</p>
      </div>

      <!-- Alert Box -->
      <div id="alertBox" class="alert"></div>

      <!-- Login Form -->
      <form id="loginForm" class="login-form">
        <div class="form-group">
          <input
            type="email"
            id="loginEmail"
            placeholder="Masukan Email"
            required
          />
        </div>

        <div class="form-group password-group">
          <input
            type="password"
            id="loginPassword"
            placeholder="Masukan Password"
            required
          />
          <button type="button" class="toggle-password" id="togglePassword">
            <i data-feather="eye"></i>
          </button>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" id="rememberMe" />
            <span>Remember Me</span>
          </label>
          <a href="#" class="forgot-password">Forgot Password?</a>
        </div>

        <button type="submit" class="btn-login">
          <span class="btn-text">Masuk</span>
          <div class="loading"></div>
        </button>
      </form>

      <!-- Divider -->
      <div class="divider">
        <span>OR</span>
      </div>

      <!-- Social Login -->
      <div class="social-login">
        <button type="button" class="social-btn" id="googleLogin">
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <button type="button" class="social-btn" id="facebookLogin">
          <svg viewBox="0 0 24 24">
            <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
      </div>

      <!-- Footer Links -->
      <div class="signup-link">
        Belum punya akun? <a href="register_user.php">Daftar Sekarang</a>
      </div>

      <div class="back-to-home">
        <a href="../user/dashboard_user.php">
          <i data-feather="arrow-left"></i>
          Kembali ke Beranda
        </a>
      </div>
    </div>

    <script src="../js/login_user.js?v=20260325"></script>
    <script>
      feather.replace();
    </script>
  </body>
</html>
