// ===== INITIALIZE FEATHER ICONS =====
feather.replace();

// ===== TOGGLE PASSWORD VISIBILITY =====
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('loginPassword');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = type === 'password' ? 'eye' : 'eye-off';
        this.innerHTML = `<i data-feather="${icon}"></i>`;
        feather.replace();
    });
}

// ===== ALERT FUNCTIONS =====
const alertBox = document.getElementById('alertBox');
function showAlert(message, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

// ===== LOGIN SUBMISSION (DATABASE DRIVEN) =====
const loginForm = document.getElementById('loginForm');
const loginButton = document.querySelector('.btn-login');

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!email || !password) {
            showAlert('Email dan password harus diisi!', 'error');
            return;
        }

        // Show loading state
        loginButton.classList.add('loading-state');
        const originalText = loginButton.textContent;
        loginButton.textContent = 'Memproses...';

        try {
            // Call actual auth API (using relative path to be safe regardless of subdir)
            const response = await fetch('/ksmaja/api/auth_login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.ok && result.user) {
                showAlert('Login berhasil! Mengalihkan...', 'success');

                // Keep local data
                if (rememberMe) {
                    localStorage.setItem('userEmail', email);
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('rememberMe');
                }

                // Sync session storage
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('userEmail', email);
                sessionStorage.setItem('userName', result.user.name);
                sessionStorage.setItem('userType', result.user.role || 'user');

                // Redirect
                setTimeout(() => {
                    window.location.href = './dashboard_user.php';
                }, 1000);
            } else {
                showAlert(result.message || 'Email atau password salah!', 'error');
                loginButton.classList.remove('loading-state');
                loginButton.textContent = originalText;
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Terjadi kesalahan server. Coba lagi nanti.', 'error');
            loginButton.classList.remove('loading-state');
            loginButton.textContent = originalText;
        }
    });
}

// ===== SOCIAL LOGIN HANDLERS =====
const setupSocial = (id) => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', () => showAlert('Fitur login ini sedang dikembangkan.', 'info'));
    }
};
setupSocial('googleLogin');
setupSocial('facebookLogin');

// ===== AUTOFILL ON LOAD =====
window.addEventListener('load', async () => {
    // If session storage says logged in, we check if PHP session is actually alive
    if (sessionStorage.getItem('userLoggedIn') === 'true') {
        const res = await fetch('/ksmaja/api/auth_me.php');
        const data = await res.json();
        if (data.ok) {
            // Yes, actually logged in. If we are on login page, redirect to dashboard.
            if (window.location.pathname.includes('login_user.php')) {
                window.location.href = './dashboard_user.php';
            }
            return;
        } else {
            // Local mock says logged in, but server says no. Clear it.
            sessionStorage.clear();
        }
    }

    // Auto-fill from remember me
    if (localStorage.getItem('rememberMe') === 'true') {
        const savedEmail = localStorage.getItem('userEmail');
        const emailField = document.getElementById('loginEmail');
        const rememberField = document.getElementById('rememberMe');
        if (savedEmail && emailField) emailField.value = savedEmail;
        if (rememberField) rememberField.checked = true;
    }
});