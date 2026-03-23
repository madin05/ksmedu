<!-- Login Modal (Admin) -->
<div id="loginModal" class="modal">
  <div class="modal-overlay"></div>
  <div class="modal-content login-container">
    <button type="button" class="close-modal" id="closeLoginModal">
      <i data-feather="x"></i>
    </button>
    <div class="login-header">
      <img
        src="../assets/main_logo.png"
        alt="KSM Education Logo"
        class="login-logo"
      />
      <h2>ADMIN LOGIN</h2>
      <p style="color: #666; font-size: 14px; margin-top: 8px">
        Login sebagai Administrator
      </p>
    </div>
    <form id="loginForm" class="login-form">
      <div class="form-group">
        <input
          type="email"
          id="loginEmail"
          placeholder="Masukan Email Admin"
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
          <i data-feather="eye" id="eyeIcon"></i>
        </button>
      </div>
      <div class="form-options">
        <label class="remember-me">
          <input type="checkbox" id="rememberMe" />
          <span>Remember Me</span>
        </label>
        <a href="#" class="forgot-password">Forgot Password?</a>
      </div>
      <button type="submit" class="btn-login">MASUK</button>
    </form>
  </div>
</div>
