(function (global) {
  // Interval polling saldo token. 15s cukup responsif untuk top-up manual
  // via admin/Telegram tanpa membanjiri server.
  const POLL_INTERVAL_MS = 15000;

  const KsmTokenWallet = {
    balance: 0,
    history: [],
    _initialized: false,
    _pollTimer: null,
    _inFlight: null,

    getBalance() {
      return this.balance;
    },

    getHistory() {
      return [...this.history];
    },

    renderBalance() {
      document.querySelectorAll("[data-ksm-token-balance]").forEach((el) => {
        el.textContent = this.balance;
      });
    },

    async refresh() {
      if (typeof authFetch !== "function") return;
      // Cegah request bertumpuk saat polling dan refresh manual bersamaan.
      if (this._inFlight) return this._inFlight;

      this._inFlight = (async () => {
        const response = await authFetch(`${global.APP_CONFIG.apiBase}/token_wallet.php`);
        if (!response.ok) return;
        const data = await response.json();
        if (!data.ok) return;

        const previousBalance = this.balance;
        const isFirstLoad = !this._initialized;

        this.balance = Number(data.wallet?.balance || 0);
        this.history = Array.isArray(data.history) ? data.history : [];
        this._initialized = true;
        this.renderBalance();

        const delta = this.balance - previousBalance;
        global.dispatchEvent(
          new CustomEvent("ksm-token-wallet:updated", {
            detail: { balance: this.balance, previousBalance, delta },
          })
        );

        // Notifikasi hanya untuk penambahan saldo setelah muatan pertama,
        // supaya user tahu top-up sudah masuk tanpa perlu refresh halaman.
        if (!isFirstLoad && delta > 0) {
          this._notifyTopUp(delta);
        }
      })().finally(() => {
        this._inFlight = null;
      });

      return this._inFlight;
    },

    _notifyTopUp(delta) {
      const message = `Saldo token bertambah ${delta}. Total sekarang ${this.balance}.`;
      global.dispatchEvent(
        new CustomEvent("ksm-token-wallet:topup", { detail: { delta, balance: this.balance } })
      );
      if (typeof global.showToast === "function") {
        global.showToast(message, "success");
      } else {
        console.info("[token-wallet]", message);
      }
    },

    _safeRefresh() {
      this.refresh().catch((error) => console.error("Token wallet error:", error));
    },

    /**
     * Polling berhenti saat tab tidak terlihat (hemat request dan baterai),
     * lalu langsung refresh sekali begitu user kembali ke tab. Ini yang
     * membuat saldo terasa real time setelah user selesai bayar di
     * tab/aplikasi lain (mis. Telegram).
     */
    startAutoRefresh(intervalMs = POLL_INTERVAL_MS) {
      this.stopAutoRefresh();
      if (document.visibilityState === "hidden") return;
      this._pollTimer = global.setInterval(() => this._safeRefresh(), intervalMs);
    },

    stopAutoRefresh() {
      if (this._pollTimer) {
        global.clearInterval(this._pollTimer);
        this._pollTimer = null;
      }
    },
  };

  global.KsmTokenWallet = KsmTokenWallet;

  function initInsufficientModal() {
    const overlay = document.getElementById("ksmInsufficientTokenModal");
    if (!overlay) return;
    const closeBtn = document.getElementById("ksmInsufficientClose");
    const goBuyBtn = document.getElementById("ksmGoBuyTokenBtn");
    const balanceEl = document.getElementById("ksmInsufficientCurrentBalance");
    const close = () => overlay.classList.remove("active");
    closeBtn?.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    goBuyBtn?.addEventListener("click", close);
    global.ksmOpenInsufficientModal = () => {
      if (balanceEl) balanceEl.textContent = KsmTokenWallet.getBalance();
      overlay.classList.add("active");
    };

    // Saldo di modal ikut ter-update kalau top-up masuk saat modal terbuka.
    global.addEventListener("ksm-token-wallet:updated", () => {
      if (balanceEl) balanceEl.textContent = KsmTokenWallet.getBalance();
    });
  }

  function loadSnapJs(clientKey, snapJsUrl) {
    return new Promise((resolve, reject) => {
      if (global.snap) {
        resolve(global.snap);
        return;
      }

      const targetSrc = snapJsUrl || "https://app.sandbox.midtrans.com/snap/snap.js";
      const existingScript = document.querySelector('script[src*="snap.js"]');

      if (existingScript) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (global.snap) {
            clearInterval(interval);
            resolve(global.snap);
          } else if (attempts > 15) {
            clearInterval(interval);
            reject(new Error("Gagal memuat SDK Pembayaran Midtrans Snap."));
          }
        }, 200);
        return;
      }

      const script = document.createElement("script");
      script.id = "midtrans-snap-script";
      script.src = targetSrc;
      if (clientKey) {
        script.setAttribute("data-client-key", clientKey);
      }
      script.onload = () => {
        if (global.snap) {
          resolve(global.snap);
        } else {
          let checkCount = 0;
          const pollSnap = setInterval(() => {
            checkCount++;
            if (global.snap) {
              clearInterval(pollSnap);
              resolve(global.snap);
            } else if (checkCount > 10) {
              clearInterval(pollSnap);
              reject(new Error("Gagal memuat SDK Pembayaran Midtrans Snap."));
            }
          }, 200);
        }
      };
      script.onerror = () => reject(new Error("Gagal memuat SDK Pembayaran Midtrans Snap."));
      document.head.appendChild(script);
    });
  }

  function initBuyTokenModal() {
    const overlay = document.getElementById("ksmBuyTokenModal");
    if (!overlay) return;
    const closeBtn = document.getElementById("ksmBuyTokenClose");
    const payBtn = document.getElementById("ksmMidtransPayBtn") || document.getElementById("ksmContactAdminBtn");
    const selectedPkgNameEl = document.getElementById("ksmSelectedPkgName");
    const selectedPkgPriceEl = document.getElementById("ksmSelectedPkgPrice");

    const close = () => overlay.classList.remove("active");
    const open = () => overlay.classList.add("active");

    let selectedPackageId = "pkg_20";
    let selectedTokens = 20;
    let selectedPrice = 55000;

    const pkgCards = overlay.querySelectorAll(".ksm-pkg-card");
    pkgCards.forEach((card) => {
      card.addEventListener("click", () => {
        pkgCards.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");

        selectedPackageId = card.dataset.pkgId || "pkg_10";
        selectedTokens = Number(card.dataset.tokens || 10);
        selectedPrice = Number(card.dataset.price || 18000);

        const titleText = card.querySelector(".ksm-pkg-title")?.textContent || "Paket Token";
        if (selectedPkgNameEl) {
          selectedPkgNameEl.textContent = `${titleText} (${selectedTokens} Token)`;
        }
        if (selectedPkgPriceEl) {
          selectedPkgPriceEl.textContent = `Rp${selectedPrice.toLocaleString("id-ID")}`;
        }
      });
    });

    document.querySelectorAll("[data-ksm-open-buy-token]").forEach((button) => {
      button.addEventListener("click", open);
    });
    closeBtn?.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });

    payBtn?.addEventListener("click", async () => {
      const originalText = payBtn.innerHTML;
      payBtn.disabled = true;
      payBtn.textContent = "Menyiapkan Pembayaran...";

      try {
        const response = await authFetch(`${global.APP_CONFIG.apiBase}/midtrans_create_transaction.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ package_id: selectedPackageId, tokens: selectedTokens }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok || !data.snap_token) {
          throw new Error(data.message || "Gagal membuat transaksi pembayaran Midtrans.");
        }

        // Load Midtrans Snap SDK if needed, with automatic fallback to redirect URL
        try {
          await loadSnapJs(data.client_key, data.snap_js_url);
        } catch (snapErr) {
          console.warn("Midtrans Snap SDK load warning:", snapErr);
          if (data.redirect_url) {
            global.location.href = data.redirect_url;
            return;
          }
          throw snapErr;
        }

        if (!global.snap || typeof global.snap.pay !== "function") {
          // Fallback to redirect URL if snap.pay unavailable
          if (data.redirect_url) {
            global.location.href = data.redirect_url;
            return;
          }
          throw new Error("SDK Midtrans Snap tidak dapat diinisialisasi.");
        }

        // Trigger Midtrans Snap Popup
        global.snap.pay(data.snap_token, {
          onSuccess: function (result) {
            console.log("Midtrans payment success:", result);
            if (typeof global.showToast === "function") {
              global.showToast("Pembayaran berhasil! Saldo token telah bertambah.", "success");
            } else if (global.showAlert) {
              global.showAlert.success("Pembayaran berhasil! Saldo token telah bertambah.", "Berhasil");
            }
            close();
            KsmTokenWallet.refresh();
            setTimeout(() => {
              window.location.href = "dashboard_user.php?payment=success";
            }, 800);
          },
          onPending: function (result) {
            console.log("Midtrans payment pending:", result);
            if (typeof global.showToast === "function") {
              global.showToast("Menunggu konfirmasi pembayaran QRIS / Transfer.", "info");
            } else if (global.showAlert) {
              global.showAlert.warning("Menunggu konfirmasi pembayaran.", "Pending");
            }
            KsmTokenWallet.startAutoRefresh(4000);
          },
          onError: function (result) {
            console.error("Midtrans payment error:", result);
            const msg = "Pembayaran gagal atau dibatalkan. Silakan coba lagi.";
            if (global.showAlert) global.showAlert.error(msg, "Gagal");
            else if (typeof global.showToast === "function") global.showToast(msg, "error");
          },
          onClose: function () {
            console.log("Midtrans payment popup closed");
            KsmTokenWallet._safeRefresh();
          },
        });
      } catch (error) {
        console.error("Midtrans purchase error:", error);
        const msg = error.message || "Gagal memproses pembayaran. Silakan periksa koneksi internet Anda.";
        if (global.showAlert) global.showAlert.error(msg, "Gagal");
        else if (typeof global.showToast === "function") global.showToast(msg, "error");
      } finally {
        payBtn.disabled = false;
        payBtn.innerHTML = originalText;
        if (global.feather) global.feather.replace();
      }
    });
  }

  function initAutoRefresh() {
    KsmTokenWallet.startAutoRefresh();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        KsmTokenWallet._safeRefresh();
        KsmTokenWallet.startAutoRefresh();
      } else {
        KsmTokenWallet.stopAutoRefresh();
      }
    });

    // Balik dari Telegram / tab lain lewat bfcache tidak selalu memicu
    // visibilitychange, jadi 'focus' dipakai sebagai jaring pengaman.
    global.addEventListener("focus", () => KsmTokenWallet._safeRefresh());
  }

  document.addEventListener("DOMContentLoaded", () => {
    KsmTokenWallet.renderBalance();
    initBuyTokenModal();
    initInsufficientModal();
    KsmTokenWallet._safeRefresh();
    initAutoRefresh();
  });
})(window);
