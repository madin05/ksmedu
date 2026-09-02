'use strict';

// ─── Auth UI ──────────────────────────────────────────────────────────────────
function setUserName() {
  const userEmail = sessionStorage.getItem('userEmail');
  if (!userEmail) return;
  const userName    = userEmail.split('@')[0].toUpperCase();
  const userNameEl  = document.querySelector('.user-name');
  const userAvatar  = document.querySelector('.user-avatar');
  if (userNameEl) userNameEl.textContent = userName;
  if (userAvatar) {
    userAvatar.textContent = userName.charAt(0);
    if (typeof getAvatarColor === 'function') {
      userAvatar.style.background = getAvatarColor(userName);
    }
  }
}

function setupGuestMode() {
  const isLoggedIn      = window.articleStore.checkLoginStatus();
  const authEls         = [
    document.getElementById('userProfile'),
    document.getElementById('logoutBtn'),
    document.querySelector('.user-info-section'),
  ];

  if (!isLoggedIn) {
    authEls.forEach(el => el && (el.style.display = 'none'));

    const navbar = document.querySelector('.navbar');
    if (navbar && !document.getElementById('guestLoginBtn')) {
      const loginBtn       = document.createElement('a');
      loginBtn.id          = 'guestLoginBtn';
      loginBtn.href        = './login';
      loginBtn.className   = 'btn-guest-login';
      loginBtn.innerHTML   = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        LOGIN
      `;
      navbar.appendChild(loginBtn);
    }

    const userNameEl = document.querySelector('.user-name');
    const userAvatar = document.querySelector('.user-avatar');
    if (userNameEl) userNameEl.textContent = 'GUEST';
    if (userAvatar) {
      userAvatar.textContent = 'G';
      if (typeof getAvatarColor === 'function') {
        userAvatar.style.background = getAvatarColor('GUEST');
      }
    }
  } else {
    authEls.forEach(el => el && (el.style.display = 'block'));
    document.getElementById('guestLoginBtn')?.remove();
    setUserName();
  }
}

// ─── Event handlers ───────────────────────────────────────────────────────────
function setupLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    const confirmed = await showAlert.confirm('YAKIN INGIN LOGOUT?', 'Konfirmasi Logout');
    if (confirmed) {
      sessionStorage.clear();
      localStorage.removeItem('userEmail');
      window.location.href = './login';
    }
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setupNewsletter() {
  const btn   = document.getElementById('subscribeBtn');
  const input = document.getElementById('newsletterEmail');
  if (!btn || !input) return;

  const submit = () => {
    const email = input.value.trim();
    if (email && EMAIL_REGEX.test(email)) {
      showToast('Terima kasih! Anda telah berhasil subscribe newsletter.', 'success');
      input.value = '';
    } else {
      showToast('Mohon masukkan email yang valid.', 'error');
    }
  };

  btn.addEventListener('click', submit);
  input.addEventListener('keypress', e => e.key === 'Enter' && submit());
}

function setupSearch() {
  const searchInput = document.querySelector('.search-box input');
  if (!searchInput) return;
  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) window.location.href = `journals?search=${encodeURIComponent(query)}`;
    }
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing User Dashboard (Database Mode)...');

  feather.replace();
  setupGuestMode();
  setupLogout();
  setupNewsletter();
  setupSearch();

  await renderArticles();
  renderMyArticles();
  renderActivityFeed();

  feather.replace();
  console.log('User Dashboard ready');
});

console.log('Dashboard User initialized - Download & Share actions added');