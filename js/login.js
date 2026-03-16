// ===== LOGIN MANAGER =====

class LoginManager {
  constructor() {
    this.loginModal = document.getElementById("loginModal");
    this.loginForm = document.getElementById("loginForm");

    this.closeModalBtn = document.getElementById("closeLoginModal");
    this.togglePasswordBtn = document.getElementById("togglePassword");
    this.uploadSection = document.querySelector(".upload-section");

    this.adminCredentials = {
      email: "admin@ksmeducation.com",
      password: "admin123",
    };

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
      const btn = e.target.closest(".btn-register");
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        if (this.isLoggedIn) {
          this.logout();
        } else {
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
  }

  openLoginModal() {
    if (!this.loginModal) {
      console.error("loginModal tidak ditemukan");
      return;
    }

    this.loginModal.classList.add("active");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      feather.replace();
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
    const eyeIcon = document.getElementById("eyeIcon");

    if (passwordInput.type === "password") {
      // Show password - ubah ke eye-off
      passwordInput.type = "text";
      eyeIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;
    } else {
      // Hide password - ubah ke eye
      passwordInput.type = "password";
      eyeIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
    }
  }

  handleLogin() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    if (
      email === this.adminCredentials.email &&
      password === this.adminCredentials.password
    ) {
      this.isLoggedIn = true;

      // SET SESSIONSTROAGE UNTUK FUNGSI DELETE
      sessionStorage.setItem("userLoggedIn", "true");
      sessionStorage.setItem("userType", "admin");
      sessionStorage.setItem("userEmail", email);

      // SET LOCALSTORAGE UNTUK PERSISTENT LOGIN
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
      
      // Close mobile menu if it's open
      if (typeof window.closeMobileMenu === 'function') {
        window.closeMobileMenu();
      }

      showToast("Selamat datang kembali, Admin!", "success", "LOGIN BERHASIL");

      this.loginForm.reset();

      window.dispatchEvent(
        new CustomEvent("adminLoginStatusChanged", {
          detail: { isLoggedIn: true },
        })
      );
    } else {
      showToast("Email atau password yang Anda masukkan salah.", "error", "LOGIN GAGAL");
    }
  }

  logout() {
    showConfirm(
      "Apakah Anda yakin ingin keluar dari sistem admin?",
      () => {
        this.isLoggedIn = false;
        localStorage.removeItem("adminLoggedIn");
        localStorage.removeItem("adminLoginTime");

        // HAPUS JUGA DARI sessionStorage
        sessionStorage.removeItem("userLoggedIn");
        sessionStorage.removeItem("userType");
        sessionStorage.removeItem("userEmail");

        this.updateLoginButton();
        this.updateUploadSection();

        // Close mobile menu if it's open
        if (typeof window.closeMobileMenu === "function") {
          window.closeMobileMenu();
        }

        showToast(
          "Anda telah keluar dari sistem admin.",
          "success",
          "LOGOUT BERHASIL"
        );

        window.dispatchEvent(
          new CustomEvent("adminLoginStatusChanged", {
            detail: { isLoggedIn: false },
          })
        );
      },
      "Konfirmasi Logout"
    );
  }

  checkLoginStatus() {
    const loggedIn = localStorage.getItem("adminLoggedIn");
    const loginTime = localStorage.getItem("adminLoginTime");

    if (loggedIn === "true" && loginTime) {
      const loginDate = new Date(loginTime);
      const now = new Date();
      const diffMinutes = (now - loginDate) / 1000 / 60;

      if (diffMinutes > 60) {
        localStorage.removeItem("adminLoggedIn");
        localStorage.removeItem("adminLoginTime");
        // HAPUS JUGA DARI sessionStorage
        sessionStorage.removeItem("userLoggedIn");
        sessionStorage.removeItem("userType");
        sessionStorage.removeItem("userEmail");
        this.isLoggedIn = false;
        return;
      }
    }

    if (loggedIn === "true") {
      this.isLoggedIn = true;

      // SET SESSIONSTROAGE JIKA BELUM ADA (saat page reload)
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
      this.isLoggedIn = false;
    }
  }

  updateLoginButton() {
    const loginBtns = document.querySelectorAll(".btn-register");
    if (loginBtns.length === 0) {
      return;
    }

    loginBtns.forEach(btn => {
      if (this.isLoggedIn) {
        btn.innerHTML = `
        <i data-feather="log-out"></i>
        LOGOUT
      `;
        btn.classList.add("admin-logged-in");
      } else {
        btn.textContent = "LOGIN";
        btn.classList.remove("admin-logged-in");
      }
    });
    
    // Call feather replace once after updating all buttons
    if (this.isLoggedIn) {
      feather.replace();
    }
  }

  updateUploadSection() {
    if (!this.uploadSection) {
      return; // Tidak ada upload section di halaman ini
    }

    if (this.isLoggedIn) {
      this.uploadSection.classList.remove("locked");
    } else {
      this.uploadSection.classList.add("locked");
    }
  }

  isAdmin() {
    return this.isLoggedIn;
  }

  // Sync login status across pages
  syncLoginStatus() {
    this.checkLoginStatus();
    this.updateLoginButton();
    this.updateUploadSection();
  }
}
