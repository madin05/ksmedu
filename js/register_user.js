// js/register_user.js
feather.replace();

const registerForm = document.getElementById('registerForm');
const alertBox = document.getElementById('alertBox');
const submitButton = registerForm.querySelector('.btn-login');

function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Client-side validation
    if (password.length < 6) {
        showAlert('Password minimal 6 karakter!');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Konfirmasi password tidak cocok!');
        return;
    }

    // Show loading state
    submitButton.classList.add('loading-state');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Mendaftar...';

    try {
        const response = await fetch(`${window.APP_CONFIG.SERVICES}/auth_register.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const result = await response.json();

        if (result.ok) {
            showAlert(result.message || 'Registrasi berhasil! Mengalihkan...', 'success');

            // Akun belum aktif sampai OTP diverifikasi, jadi tidak ada token
            // yang disimpan di sini. Jejak sesi lama tetap dibersihkan.
            if (window.AuthStorage) {
                window.AuthStorage.clearAll();
            } else if (window.TokenManager) {
                window.TokenManager.clearTokens();
            }

            setTimeout(() => {
                window.location.href = 'verify_email?email=' + encodeURIComponent(email);
            }, 1500);
        } else {

            showAlert(result.message || 'Registrasi gagal.');
            submitButton.classList.remove('loading-state');
            submitButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Terjadi kesalahan server.');
        submitButton.classList.remove('loading-state');
        submitButton.textContent = originalText;
    }
});

// ===== GOOGLE REGISTER / LOGIN (GIS) HANDLER =====
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
            showAlert('Registrasi Google berhasil! Mengalihkan...', 'success');

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
            showAlert(result.message || 'Registrasi dengan Google gagal.', 'error');
        }
    } catch (err) {
        console.error('Google Auth Error:', err);
        showAlert('Terjadi kesalahan koneksi saat registrasi Google.', 'error');
    }
};

// ===== INITIALIZE GOOGLE GIS & RENDER RESPONSIVE BUTTON =====
function initGoogleAuth(textType = 'signup_with') {
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
    document.addEventListener('DOMContentLoaded', () => initGoogleAuth('signup_with'));
} else {
    initGoogleAuth('signup_with');
}
