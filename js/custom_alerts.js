/**
 * Custom Modern Alert System (Vanilla JS)
 * Premium alternatives to alert() and confirm()
 */

class CustomAlert {
  constructor() {
    this.overlay = null;
    this.modal = null;
    this.titleEl = null;
    this.messageEl = null;
    this.iconEl = null;
    this.actionsEl = null;
    this.init();
  }

  init() {
    // Create elements if they don't exist
    if (document.getElementById('custom-alert-overlay')) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'custom-alert-overlay';

    this.overlay.innerHTML = `
      <div class="custom-alert-modal">
        <div class="custom-alert-icon" id="custom-alert-icon"></div>
        <h3 class="custom-alert-title" id="custom-alert-title"></h3>
        <p class="custom-alert-message" id="custom-alert-message"></p>
        <div class="custom-alert-actions" id="custom-alert-actions"></div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.modal = this.overlay.querySelector('.custom-alert-modal');
    this.iconEl = document.getElementById('custom-alert-icon');
    this.titleEl = document.getElementById('custom-alert-title');
    this.messageEl = document.getElementById('custom-alert-message');
    this.actionsEl = document.getElementById('custom-alert-actions');
  }

  show({ title, message, type = 'info', actions = [] }) {
    this.init(); // Ensure initialized

    // Set content
    this.titleEl.textContent = title;
    this.messageEl.textContent = message;

    // Set icon based on type
    this.iconEl.className = `custom-alert-icon ${type}`;
    this.iconEl.innerHTML = this.getIconSvg(type);

    // Set actions
    this.actionsEl.innerHTML = '';
    if (actions.length === 0) {
      // Default "OK" button
      actions = [{
        text: 'OK',
        type: 'primary',
        onClick: () => this.hide()
      }];
    }

    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = `custom-alert-btn ${action.type || 'primary'}`;
      btn.textContent = action.text;
      btn.onclick = () => {
        if (action.onClick) action.onClick();
        this.hide();
      };
      this.actionsEl.appendChild(btn);
    });

    // Show overlay
    this.overlay.classList.add('active');
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
  }

  // Convenience methods
  success(message, title = 'Berhasil!') {
    return new Promise((resolve) => {
      this.show({
        title,
        message,
        type: 'success',
        actions: [{ text: 'ok', type: 'primary', onClick: resolve }]
      });
    });
  }

  error(message, title = 'Oops!') {
    return new Promise((resolve) => {
      this.show({
        title,
        message,
        type: 'error',
        actions: [{ text: 'Gagal', type: 'primary', onClick: resolve }]
      });
    });
  }

  warning(message, title = 'Peringatan!') {
    return new Promise((resolve) => {
      this.show({
        title,
        message,
        type: 'warning',
        actions: [{ text: 'Ok', type: 'primary', onClick: resolve }]
      });
    });
  }

  confirm(message, title = 'Konfirmasi', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal') {
    return new Promise((resolve) => {
      this.show({
        title,
        message,
        type: 'warning',
        actions: [
          { text: cancelText, type: 'secondary', onClick: () => resolve(false) },
          { text: confirmText, type: 'primary', onClick: () => resolve(true) }
        ]
      });
    });
  }

  getIconSvg(type) {
    switch (type) {
      case 'success':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" class="success-animate"></polyline></svg>`;
      case 'error':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      case 'warning':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }
  }
}

// Export as global
window.showAlert = new CustomAlert();

// Polyfill alert and confirm optionally if you want to replace globally
// window.alert = (msg) => window.showAlert.success(msg);
// window.confirm = (msg) => window.showAlert.confirm(msg);
