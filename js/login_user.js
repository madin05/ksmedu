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
            const response = await fetch(`${window.APP_CONFIG.SERVICES}/auth_login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.ok && result.user) {
                showAlert('Login berhasil! Mengalihkan...', 'success');

                // ===== BUANG SESI SEBELUMNYA =====
                // Wajib: tanpa ini, token JWT sesi lama (mis. akun admin) tetap
                // tersimpan di localStorage dan dipakai kembali oleh dashboard
                // user, sehingga dashboard menampilkan akun yang salah.
                if (window.AuthStorage) {
                    window.AuthStorage.clearAll();
                } else if (window.TokenManager) {
                    window.TokenManager.clearTokens();
                }

                // ===== STORE JWT TOKENS =====
                if (window.AuthStorage) {
                    window.AuthStorage.setTokens(result);
                } else if (result.access_token && window.TokenManager) {
                    window.TokenManager.setTokens(
                        result.access_token,
                        result.refresh_token,
                        result.expires_in
                    );
                }

                // Keep local data
                if (rememberMe) {
                    localStorage.setItem('userEmail', email);
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('rememberMe');
                }

                // Sync session storage
                if (window.AuthStorage) {
                    window.AuthStorage.setSession({
                        email: email,
                        name: result.user.name,
                        role: result.user.role || 'user'
                    });
                } else {
                    sessionStorage.setItem('userLoggedIn', 'true');
                    sessionStorage.setItem('userEmail', email);
                    sessionStorage.setItem('userName', result.user.name);
                    sessionStorage.setItem('userType', result.user.role || 'user');
                }

                // Redirect
                setTimeout(() => {
                    window.location.href = './dashboard';
                }, 1000);
            } else if (result.needs_verification) {
                // Email belum diverifikasi: arahkan ke halaman OTP.
                showAlert(result.message || 'Silakan verifikasi email terlebih dahulu.', 'error');
                setTimeout(() => {
                    window.location.href = './verify_email?email=' + encodeURIComponent(email);
                }, 1500);
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

// ===== AUTOFILL ON LOAD =====
window.addEventListener('load', async () => {
    // If session storage says logged in, we check if PHP session is actually alive
    if (sessionStorage.getItem('userLoggedIn') === 'true') {
        // Build auth headers with JWT if available
        const authHeaders = {};
        if (window.TokenManager && window.TokenManager.hasTokens()) {
            const token = await window.TokenManager.getValidToken();
            if (token) authHeaders['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${window.APP_CONFIG.SERVICES}/auth_me.php`, {
            headers: authHeaders
        });
        const data = await res.json();
        if (data.ok) {
            // Yes, actually logged in. If we are on login page, redirect to dashboard.
            if (ksmPagePath().includes('login_user.php')) {
                window.location.href = './dashboard';
            }
            return;
        } else {
            // Local mock says logged in, but server says no. Clear it.
            if (window.TokenManager) window.TokenManager.clearTokens();
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

// ===== GOOGLE LOGIN (GIS) HANDLER =====
window.handleGoogleCredentialResponse = async function(response) {
    if (!response || !response.credential) {
        showAlert('Gagal mendapatkan respon dari Google.', 'error');
        return;
    }

    const idToken = response.credential;
    showAlert('Memverifikasi akun Google...', 'success');

    try {
        const res = await fetch(`${window.APP_CONFIG.SERVICES}/auth_google.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: idToken })
        });

        const result = await res.json();

        if (result.ok && result.user) {
            showAlert('Login Google berhasil! Mengalihkan...', 'success');

            if (window.AuthStorage) {
                window.AuthStorage.clearAll();
                window.AuthStorage.setTokens(result);
                window.AuthStorage.setSession({
                    email: result.user.email || result.user.name,
                    name: result.user.name,
                    role: result.user.role || 'user'
                });
            } else {
                if (window.TokenManager && result.access_token) {
                    window.TokenManager.setTokens(result.access_token, result.refresh_token, result.expires_in);
                }
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('userEmail', result.user.email || '');
                sessionStorage.setItem('userName', result.user.name);
                sessionStorage.setItem('userType', result.user.role || 'user');
            }

            setTimeout(() => {
                window.location.href = './dashboard';
            }, 1000);
        } else {
            showAlert(result.message || 'Login dengan Google gagal.', 'error');
        }
    } catch (err) {
        console.error('Google Auth Error:', err);
        showAlert('Terjadi kesalahan koneksi saat login Google.', 'error');
    }
};

// ===== INITIALIZE GOOGLE GIS & RENDER RESPONSIVE BUTTON =====
function initGoogleAuth(textType = 'signin_with') {
    const container = document.getElementById('googleBtnContainer');
    if (!container) return;

    const clientId = window.GOOGLE_CLIENT_ID || '563246418789-mh2d9pt5edcpm161g00ehsts29nslstb.apps.googleusercontent.com';

    let isGoogleInitialized = false;

    const render = () => {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
            setTimeout(render, 150);
            return;
        }

        if (!isGoogleInitialized) {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: window.handleGoogleCredentialResponse,
                auto_prompt: false
            });
            isGoogleInitialized = true;
        }

        // Dynamic width calculation based on exact container width
        const targetWidth = Math.min(Math.max(container.clientWidth || 300, 200), 400);

        container.innerHTML = '';
        google.accounts.id.renderButton(container, {
            type: 'standard',
            shape: 'rectangular',
            theme: 'filled_blue',
            text: textType,
            size: 'large',
            logo_alignment: 'left',
            width: targetWidth
        });
    };

    render();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 200);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initGoogleAuth('signin_with'));
} else {
    initGoogleAuth('signin_with');
}