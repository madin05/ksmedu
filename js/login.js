// ===== LOGIN MANAGER =====
if (window.LoginManagerInstance) {
  console.warn("LoginManager already initialized.");
} else {
  window.LoginManagerInstance = true;

class LoginManager {
  constructor() {
    this.loginModal = document.getElementById("loginModal");
    this.loginForm = document.getElementById("loginForm");

    this.closeModalBtn = document.getElementById("closeLoginModal");
    this.togglePasswordBtn = document.getElementById("togglePassword");
    this.uploadSection = document.querySelector(".upload-section");

    // Admin credentials removed for security — never store in client-side code

    this.isLoggedIn = false;

    if (!this.loginModal || !this.loginForm) {
      console.warn("loginModal atau loginForm tidak ditemukan");
    }

    this.init();
  }

  init() {
    this.checkLoginStatus();

    // Gunakan event delegation agar tombol yang di-clone oleh mobile_menu.js tetap berfungsi
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-register, .btn-login-nav, .btn-user-login, .btn-login");
      if (btn) {
        // Jika ini adalah tombol SUBMIT di dalam form login, biarkan form.submit yang handle
        if (btn.type === "submit" && btn.closest("#loginForm")) return;

        // Using class instead of text to detect status (fixes icon-only buttons)
        const isLoggedOut = !btn.classList.contains("admin-logged-in");

        if (!isLoggedOut) {
          e.preventDefault();
          e.stopPropagation();
          this.logout();
        } else {
          e.preventDefault();
          e.stopPropagation();
          this.openLoginModal();
        }
      }
    });

    // Check jika modal ada sebelum attach event
    if (!this.closeModalBtn) {
      console.warn(
        "closeModalBtn tidak ditemukan, modal tidak ada di halaman ini"
      );
      return;
    }

    this.closeModalBtn.addEventListener("click", () => {
      this.closeLoginModal();
    });

    const overlay = this.loginModal.querySelector(".modal-overlay");
    if (overlay) {
      overlay.addEventListener("click", () => {
        this.closeLoginModal();
      });
    }

    if (this.togglePasswordBtn) {
      this.togglePasswordBtn.addEventListener("click", () => {
        this.togglePasswordVisibility();
      });
    }

    this.loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      const emailInput = document.getElementById("loginEmail");
      if (emailInput) {
        emailInput.value = rememberedEmail;
      }
      const rememberCheckbox = document.getElementById("rememberMe");
      if (rememberCheckbox) {
        rememberCheckbox.checked = true;
      }
    }

    this.updateUploadSection();
    this.renderMobileAuth();
  }

  openLoginModal() {
    if (!this.loginModal) {
      console.error("loginModal tidak ditemukan");
      return;
    }

    this.loginModal.classList.add("active");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      if (typeof feather !== 'undefined') feather.replace();
    }, 100);
  }

  closeLoginModal() {
    if (!this.loginModal) {
      return;
    }

    this.loginModal.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  togglePasswordVisibility() {
    const passwordInput = document.getElementById("loginPassword");
    const toggleBtn = document.getElementById("togglePassword");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleBtn.innerHTML = '<i data-feather="eye-off" id="eyeIcon"></i>';
    } else {
      passwordInput.type = "password";
      toggleBtn.innerHTML = '<i data-feather="eye" id="eyeIcon"></i>';
    }

    if (typeof feather !== "undefined") {
      feather.replace();
    }
  }

  handleLogin() {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const rememberMe = document.getElementById("rememberMe").checked;
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showToast("Email dan password wajib diisi.", "warning", "INPUT KOSONG");
        return;
    }

    const submitBtn = this.loginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "MASUK";
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loader sm" style="margin:0"></span>';
    }

    // PRIMARY AUTH via SERVER
    fetch(`${window.APP_CONFIG.apiBase}/auth_login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            this.isLoggedIn = true;
            
            // ===== STORE JWT TOKENS =====
            if (data.access_token && window.TokenManager) {
                window.TokenManager.setTokens(
                    data.access_token,
                    data.refresh_token,
                    data.expires_in
                );
                console.log('🔐 JWT tokens stored successfully');
            }

            // Dispatch identity change event for components like comments.js
            window.dispatchEvent(new CustomEvent('userIdentityChanged'));

            // SET SESSION & LOCAL STORAGE
            sessionStorage.setItem("userLoggedIn", "true");
            sessionStorage.setItem("userType", data.user?.role || "admin");
            sessionStorage.setItem("userEmail", email);

            localStorage.setItem("adminLoggedIn", "true");
            localStorage.setItem("adminLoginTime", new Date().toISOString());

            if (rememberMe) {
                localStorage.setItem("rememberedEmail", email);
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            this.updateLoginButton();
            this.updateUploadSection();
            this.closeLoginModal();
            
            if (typeof window.closeMobileMenu === 'function') {
                window.closeMobileMenu();
            }

            showToast("Selamat datang kembali, Admin!", "success", "LOGIN BERHASIL");
            this.loginForm.reset();
            this.updateLoginStatusState(true);
        } else {
            showToast(data.message || "Email atau password yang Anda masukkan salah.", "error", "LOGIN GAGAL");
        }
    })
    .catch(err => {
        console.error("Login Error:", err);
        showToast("Terjadi kesalahan jaringan saat mencoba login.", "error", "LOGIN ERROR");
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            if (typeof feather !== "undefined") feather.replace();
        }
    });
  }

  logout() {
    showConfirm(
      "Apakah Anda yakin ingin keluar dari sistem admin?",
      () => {
        // Build logout request with JWT token for server-side blacklisting
        const logoutHeaders = { 'Content-Type': 'application/json' };
        const logoutBody = {};

        if (window.TokenManager) {
          const accessToken = window.TokenManager.getAccessToken();
          const refreshToken = window.TokenManager.getRefreshToken();
          if (accessToken) logoutHeaders['Authorization'] = `Bearer ${accessToken}`;
          if (refreshToken) logoutBody.refresh_token = refreshToken;
        }

        // SYNC PHP SESSION + BLACKLIST JWT TOKENS
        fetch(`${window.APP_CONFIG.apiBase}/auth_logout.php`, {
          method: 'POST',
          headers: logoutHeaders,
          body: JSON.stringify(logoutBody)
        })
          .then(() => {
            console.log("PHP Session cleared + JWT tokens blacklisted");
            this.isLoggedIn = false;

            // ===== CLEAR JWT TOKENS =====
            if (window.TokenManager) {
              window.TokenManager.clearTokens();
            }

            localStorage.removeItem("adminLoggedIn");
            localStorage.removeItem("adminLoginTime");

            sessionStorage.removeItem("userLoggedIn");
            sessionStorage.removeItem("userType");
            sessionStorage.removeItem("userEmail");

            window.dispatchEvent(new CustomEvent("userIdentityChanged"));
            this.updateLoginStatusState(false);
            this.updateLoginButton();
            this.updateUploadSection();

            if (typeof window.closeMobileMenu === "function") {
              window.closeMobileMenu();
            }

            showToast("Anda telah keluar dari sistem.", "success", "LOGOUT BERHASIL");
          });
      },
      "Konfirmasi Logout"
    );
  }

  async checkLoginStatus() {
    const loggedIn = localStorage.getItem("adminLoggedIn");
    const loginTime = localStorage.getItem("adminLoginTime");

    if (loggedIn === "true" && loginTime) {
      const loginDate = new Date(loginTime);
      const now = new Date();
      const diffMinutes = (now - loginDate) / 1000 / 60;

      // Token/Session expiry client-side (120 mins for admin)
      if (diffMinutes > 120) {
        this.clearAdminSession();
        return;
      }

      this.isLoggedIn = true;
      
      // SYNC CHECK: Verify with Server
      try {
        // Use JWT for auth check if available
        const authHeaders = {};
        if (window.TokenManager && window.TokenManager.hasTokens()) {
          const token = await window.TokenManager.getValidToken();
          if (token) authHeaders['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${window.APP_CONFIG.apiBase}/auth_me.php`, {
          headers: authHeaders
        });
        const data = await res.json();
        
        const isAdminPage = window.location.pathname.includes('/admin/');
        
        if (!data.ok || data.user.role !== 'admin') {
          // JANGAN silent re-sync jika kita sedang di halaman USER.
          // Biarkan user tetep login sebagai role 'user' mereka.
          if (!isAdminPage) {
             console.log("Session is not admin, but we are on a user page. Skipping admin sync.");
             return;
          }

          console.log("Admin session expired. Clearing session.");
          this.clearAdminSession();
        }
      } catch (e) {
        console.error("Auth sync check failed:", e);
        // If we are on an admin page, don't clear session just because of a network/API failure
        if (!window.location.pathname.includes('/admin/')) {
          this.clearAdminSession();
        }
      }
    }

    if (this.isLoggedIn) {
      // SET SESSIONSTORAGE JIKA BELUM ADA (saat page reload)
      if (sessionStorage.getItem("userLoggedIn") !== "true") {
        sessionStorage.setItem("userLoggedIn", "true");
        sessionStorage.setItem("userType", "admin");
        sessionStorage.setItem(
          "userEmail",
          localStorage.getItem("adminEmail") || "admin@ksmeducation.com"
        );
      }

      this.updateLoginButton();
      this.updateUploadSection();
    } else {
      this.updateLoginButton();
      this.updateUploadSection();
    }
  }

  clearAdminSession() {
    // Clear JWT tokens
    if (window.TokenManager) {
      window.TokenManager.clearTokens();
    }

    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminLoginTime");
    sessionStorage.removeItem("userLoggedIn");
    sessionStorage.removeItem("userType");
    sessionStorage.removeItem("userEmail");
    
    fetch(`${window.APP_CONFIG.apiBase}/auth_logout.php`)
      .then(() => {
        window.dispatchEvent(new CustomEvent("userIdentityChanged"));
      });
      
    this.isLoggedIn = false;
    this.updateLoginStatusState(false);
    this.updateLoginButton();
    this.updateUploadSection();
    this.renderMobileAuth();
  }

  updateLoginStatusState(isLoggedIn) {
    window.dispatchEvent(
      new CustomEvent("adminLoginStatusChanged", {
        detail: { isLoggedIn: isLoggedIn },
      })
    );
  }

  updateLoginButton() {
    const loginBtns = document.querySelectorAll(".btn-register");
    if (loginBtns.length === 0) {
      return;
    }

    loginBtns.forEach(btn => {
      btn.classList.add("icon-only"); // Added for circular styling
      if (this.isLoggedIn) {
        btn.innerHTML = `
          <div class="user-avatar" style="background: #2c3e50; width:32px; height:32px; font-size:14px;">A</div>
        `;
        btn.classList.add("admin-logged-in");
      } else {
        btn.innerHTML = `
          <div class="guest-avatar" style="width:32px; height:32px; display:flex; align-items:center; justify-content:center; background:#f1f5f9; color:#2c3e50; border-radius:50%;">
            <i data-feather="user" style="width:18px; height:18px;"></i>
          </div>
        `;
        btn.classList.remove("admin-logged-in");
      }
    });

    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    this.renderMobileAuth();
  }

  updateUploadSection() {
    if (!this.uploadSection) {
      return;
    }

    if (this.isLoggedIn) {
      this.uploadSection.classList.remove("locked");
    } else {
      this.uploadSection.classList.add("locked");
    }
  }

  isAdmin() {
    if (this.isLoggedIn) return true;
    
    // Fallback: If we are on an admin page and localStorage says we are logged in,
    // allow the action. This handles cases where the async PHP sync is still running
    // or transiently failed but the user has a valid local session.
    const isAdminPath = window.location.pathname.includes('/admin/') || 
                       window.location.hash.includes('#admin');
    const hasLocalAdmin = localStorage.getItem("adminLoggedIn") === "true";
    
    if (isAdminPath && hasLocalAdmin) {
      console.log("Admin check fallback triggered via localStorage");
      return true;
    }
    
    return false;
  }

  syncLoginStatus() {
    this.checkLoginStatus();
    this.updateLoginButton();
    this.updateUploadSection();
  }

  renderMobileAuth() {
    const mobileHeaderAuth = document.getElementById('mobileAuthHeader');
    if (!mobileHeaderAuth) return;

    if (this.isLoggedIn) {
        mobileHeaderAuth.innerHTML = `
            <div class="user-profile btn-register admin-logged-in" style="cursor:pointer">
                <div class="user-avatar" style="background: #2c3e50">A</div>
            </div>
        `;
    } else {
        mobileHeaderAuth.innerHTML = `
            <div class="guest-profile btn-register" style="cursor:pointer">
                <div class="guest-avatar">
                    <i data-feather="user"></i>
                </div>
            </div>
        `;
    }
    if (typeof feather !== 'undefined') feather.replace();
  }
}

// Inisialisasi
document.addEventListener("DOMContentLoaded", () => {
  window.loginManager = new LoginManager();
});
}
