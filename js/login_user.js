// ===== INITIALIZE FEATHER ICONS =====
feather.replace();

// ===== TOGGLE PASSWORD VISIBILITY =====
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('loginPassword');

togglePassword.addEventListener('click', function() {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  
  const icon = type === 'password' ? 'eye' : 'eye-off';
  this.innerHTML = `<i data-feather="${icon}"></i>`;
  feather.replace();
});

// ===== ALERT FUNCTIONS =====
const alertBox = document.getElementById('alertBox');

function showAlert(message, type = 'error') {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.style.display = 'block';
  
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 5000);
}

// ===== FORM SUBMISSION =====
const loginForm = document.getElementById('loginForm');
const loginButton = document.querySelector('.btn-login');

loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  // Validation
  if (!email || !password) {
    showAlert('Email dan password harus diisi!', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert('Format email tidak valid!', 'error');
    return;
  }

  // Show loading state
  loginButton.classList.add('loading-state');

  // Simulate API call (replace with actual API endpoint)
  setTimeout(() => {
    // Demo credentials
    if (email === 'user@ksmeducation.com' && password === 'user123') {
      showAlert('Login berhasil! Mengalihkan...', 'success');
      
      // Save to localStorage
      if (rememberMe) {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('rememberMe');
      }

      // Save session
      sessionStorage.setItem('userLoggedIn', 'true');
      sessionStorage.setItem('userEmail', email);
      sessionStorage.setItem('userType', 'user');

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = './dashboard_user.php';
      }, 1500);
    } else {
      showAlert('Email atau password salah!', 'error');
      loginButton.classList.remove('loading-state');
    }
  }, 1500);
});

// ===== SOCIAL LOGIN HANDLERS =====
document.getElementById('googleLogin').addEventListener('click', function() {
  showAlert('Fitur login Google sedang dalam pengembangan', 'error');
});

document.getElementById('facebookLogin').addEventListener('click', function() {
  showAlert('Fitur login Facebook sedang dalam pengembangan', 'error');
});

// ===== FORGOT PASSWORD =====
document.querySelector('.forgot-password').addEventListener('click', function(e) {
  e.preventDefault();
  showAlert('Link reset password akan dikirim ke email Anda', 'success');
});

// ===== CHECK IF ALREADY LOGGED IN =====
window.addEventListener('load', function() {
  // Redirect if already logged in
  if (sessionStorage.getItem('userLoggedIn') === 'true') {
    window.location.href = './dashboard_user.php';
  }

  // Auto-fill email if remember me was checked
  if (localStorage.getItem('rememberMe') === 'true') {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      document.getElementById('loginEmail').value = savedEmail;
      document.getElementById('rememberMe').checked = true;
    }
  }
  // ===== LOGIN USER - DATABASE VERSION =====
feather.replace();

const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('loginPassword');
const alertBox = document.getElementById('alertBox');
const loginForm = document.getElementById('loginForm');
const loginButton = document.querySelector('.btn-login');

// Toggle password visibility
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    const icon = type === 'password' ? 'eye' : 'eye-off';
    this.innerHTML = `<i data-feather="${icon}"></i>`;
    feather.replace();
});

// Alert functions
function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

// Form submission - USE DATABASE AUTH
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validation
    if (!email || !password) {
        showAlert('Email dan password harus diisi!', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Format email tidak valid!', 'error');
        return;
    }

    // Show loading state
    loginButton.classList.add('loading-state');
    loginButton.textContent = 'Loading...';

    try {
        // Call actual auth API
        const response = await fetch('/api/auth_login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.ok && result.user) {
            showAlert('Login berhasil! Mengalihkan...', 'success');

            // Save auth token (if backend provides it)
            if (rememberMe && result.token) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userEmail', email);
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('rememberMe');
            }

            // Save session
            sessionStorage.setItem('userLoggedIn', 'true');
            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('userType', result.user.role || 'user');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = './dashboard_user.php';
            }, 1500);
        } else {
            showAlert(result.message || 'Email atau password salah!', 'error');
            loginButton.classList.remove('loading-state');
            loginButton.textContent = 'LOGIN';
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Terjadi kesalahan server. Coba lagi nanti.', 'error');
        loginButton.classList.remove('loading-state');
        loginButton.textContent = 'LOGIN';
    }
});

// Social login handlers
document.getElementById('googleLogin').addEventListener('click', function() {
    showAlert('Fitur login Google sedang dalam pengembangan', 'error');
});

document.getElementById('facebookLogin').addEventListener('click', function() {
    showAlert('Fitur login Facebook sedang dalam pengembangan', 'error');
});

// Forgot password
document.querySelector('.forgot-password').addEventListener('click', function(e) {
    e.preventDefault();
    showAlert('Link reset password akan dikirim ke email Anda', 'success');
});

// Check if already logged in
window.addEventListener('load', async function() {
    // Check session first
    if (sessionStorage.getItem('userLoggedIn') === 'true') {
        window.location.href = './dashboard_user.php';
        return;
    }

    // Check auth token (remember me)
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        try {
            const response = await fetch('/ksmaja/api/auth_me.php', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const result = await response.json();
            
            if (result.ok && result.user) {
                // Token valid, auto redirect
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('userEmail', result.user.email);
                sessionStorage.setItem('userType', result.user.role);
                window.location.href = './dashboard_user.php';
                return;
            }
        } catch (err) {
            console.error('Token validation error:', err);
        }
    }

    // Auto-fill email if remember me was checked
    if (localStorage.getItem('rememberMe') === 'true') {
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail) {
            document.getElementById('loginEmail').value = savedEmail;
            document.getElementById('rememberMe').checked = true;
        }
    }
});

});