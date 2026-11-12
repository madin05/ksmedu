// =========================================================
// RIWAYAT TOKEN — render, filter, dan hapus riwayat milik user.
// =========================================================

(function () {
  let currentFilter = "all";
  const selectedIds = new Set();

  function getHistory() {
    return typeof KsmTokenWallet !== "undefined" ? KsmTokenWallet.getHistory() : [];
  }

  function statusBadge(status) {
    const map = {
      pending: { label: "Pending", icon: "clock", cls: "ksm-status-pending" },
      approved: { label: "Disetujui", icon: "check-circle", cls: "ksm-status-published" },
      rejected: { label: "Ditolak", icon: "x-circle", cls: "ksm-status-rejected" },
      cancelled: { label: "Dibatalkan", icon: "slash", cls: "ksm-status-rejected" },
      expired: { label: "Kedaluwarsa", icon: "alert-circle", cls: "ksm-status-rejected" },
    };
    const info = map[status] || map.pending;
    return `<span class="ksm-status-badge ${info.cls}"><i data-feather="${info.icon}"></i>${info.label}</span>`;
  }

  function formatDate(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatRupiah(num) {
    if (!num) return "Rp 0";
    return "Rp " + Number(num).toLocaleString("id-ID");
  }

  function visibleHistory() {
    return getHistory().filter((item) => currentFilter === "all" || item.status === currentFilter);
  }

  function renderSummary(all) {
    const totalEl = document.getElementById("ksmTotalRequests");
    const pendingEl = document.getElementById("ksmPendingRequests");
    if (totalEl) totalEl.textContent = all.length;
    if (pendingEl) pendingEl.textContent = all.filter((i) => i.status === "pending").length;
  }

  function updateSelectionControls(items = visibleHistory()) {
    const selectAll = document.getElementById("ksmSelectAllHistory");
    const deleteButton = document.getElementById("ksmDeleteSelectedHistory");
    const count = document.getElementById("ksmHistorySelectedCount");
    const selectedVisible = items.filter((item) => selectedIds.has(item.id)).length;

    if (selectAll) {
      selectAll.checked = items.length > 0 && selectedVisible === items.length;
      selectAll.indeterminate = selectedVisible > 0 && selectedVisible < items.length;
      selectAll.disabled = items.length === 0;
    }
    if (deleteButton) deleteButton.disabled = selectedIds.size === 0;
    if (count) count.textContent = selectedIds.size ? `${selectedIds.size} riwayat dipilih` : "";
  }

  async function cancelOrder(id) {
    let confirmed = false;
    if (window.showAlert) {
      confirmed = await window.showAlert.confirm("Pesanan yang dibatalkan tidak dapat dipulihkan. Lanjutkan?", "Batalkan Pesanan?", "Ya, Batalkan", "Tidak");
    } else if (typeof window.showToast === "function") {
      // fallback tanpa native confirm: pakai toast lalu batal jika custom alert gagal load
      window.showToast("Memuat dialog konfirmasi...", "info");
      return;
    } else {
      confirmed = false;
      return;
    }
    if (!confirmed) return;
    try {
      const response = await authFetch(`${window.APP_CONFIG.apiBase}/cancel_token_transaction.php`, {
        method: "POST",
        body: JSON.stringify({ id: id }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Gagal membatalkan pesanan.");
      if (typeof window.showToast === "function") window.showToast(data.message, "success");
      else if (window.showAlert) window.showAlert.success(data.message, "Berhasil");
      await KsmTokenWallet.refresh();
    } catch (err) {
      const msg = err.message || "Gagal membatalkan pesanan.";
      if (window.showAlert) window.showAlert.error(msg, "Gagal Membatalkan");
      else if (typeof window.showToast === "function") window.showToast(msg, "error");
    }
  }

  function payOrder(snapToken) {
    if (typeof snap !== "undefined" && snap.pay) {
      snap.pay(snapToken, {
        onSuccess: function () {
          if (typeof window.showToast === "function") window.showToast("Pembayaran berhasil!", "success");
          else if (window.showAlert) window.showAlert.success("Pembayaran berhasil! Saldo akan segera bertambah.", "Berhasil");
          KsmTokenWallet.refresh();
        },
        onPending: function () {
          if (typeof window.showToast === "function") window.showToast("Pembayaran menunggu konfirmasi. Selesaikan pembayaran Anda.", "info");
          else if (window.showAlert) window.showAlert.warning("Menunggu konfirmasi pembayaran.", "Pending");
          KsmTokenWallet.refresh();
        },
        onError: function () {
          const msg = "Pembayaran gagal. Silakan coba lagi.";
          if (window.showAlert) window.showAlert.error(msg, "Gagal");
          else if (typeof window.showToast === "function") window.showToast(msg, "error");
        },
      });
    } else {
      const msg = "SDK Pembayaran Midtrans belum siap. Silakan refresh halaman.";
      if (window.showAlert) window.showAlert.error(msg, "Gagal Memuat Pembayaran");
      else if (typeof window.showToast === "function") window.showToast(msg, "error");
    }
  }  function showDetailModal(item) {
    let existingModal = document.getElementById("ksmUserTxnDetailModal");
    if (!existingModal) {
      existingModal = document.createElement("div");
      existingModal.id = "ksmUserTxnDetailModal";
      existingModal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px;";
      document.body.appendChild(existingModal);
    }

    existingModal.innerHTML = `
      <div style="background:#fff; border-radius:16px; max-width:440px; width:100%; padding:24px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); position:relative;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <h3 style="margin:0; font-size:18px; font-weight:700; color:#1e293b;">Rincian Pembelian Token</h3>
          <button type="button" id="closeUserTxnDetailModal" style="background:none; border:none; font-size:20px; color:#64748b; cursor:pointer; padding:4px;">&times;</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; font-size:14px; color:#334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:8px; border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">Status</span>
            <span>${statusBadge(item.status)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">Order ID</span>
            <span style="font-family:monospace; font-weight:600; color:#0284c7;">${item.orderId || item.publicId || '-'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">Jumlah Token</span>
            <span style="font-weight:700; color:#1e293b;">${item.amount} Token</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">Total Bayar</span>
            <span style="font-weight:700; color:#059669;">${formatRupiah(item.priceRupiah)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">Metode Pembayaran</span>
            <span>${item.paymentType || 'QRIS / Midtrans'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;">Waktu Pemesanan</span>
            <span>${formatDate(item.createdAt)}</span>
          </div>
          ${item.approvedAt ? `
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#64748b;">Waktu Disetujui/Lunas</span>
            <span style="color:#059669; font-weight:600;">${formatDate(item.approvedAt)}</span>
          </div>` : ''}
        </div>
        <div style="margin-top:20px; text-align:right;">
          <button type="button" id="btnDoneUserTxnDetail" style="padding:10px 20px; background:#1e293b; color:#fff; border:none; border-radius:8px; font-weight:600; cursor:pointer;">Tutup</button>
        </div>
      </div>
    `;

    existingModal.style.display = "flex";
    if (typeof feather !== "undefined") feather.replace();
    const close = () => { existingModal.style.display = "none"; };
    document.getElementById("closeUserTxnDetailModal").onclick = close;
    document.getElementById("btnDoneUserTxnDetail").onclick = close;
  }

  function render() {
    const container = document.getElementById("ksmTokenHistoryList");
    if (!container) return;

    const all = getHistory();
    const validIds = new Set(all.map((item) => item.id));
    [...selectedIds].forEach((id) => {
      if (!validIds.has(id)) selectedIds.delete(id);
    });
    renderSummary(all);

    const filtered = visibleHistory();
    if (!filtered.length) {
      container.innerHTML = `
        <div class="ksm-my-journals-empty">
          <i data-feather="inbox"></i>
          <h3>Belum ada riwayat di kategori ini</h3>
          <p>Klik "Beli Token" untuk mengajukan permintaan token baru.</p>
        </div>`;
      if (typeof feather !== "undefined") feather.replace();
      updateSelectionControls(filtered);
      return;
    }

    container.innerHTML = filtered.map((item) => `
      <div class="ksm-token-history-card">
        <div class="ksm-token-history-main">
          <label class="ksm-history-checkbox" aria-label="Pilih riwayat ${item.amount} Token">
            <input type="checkbox" class="ksm-history-item-checkbox" value="${item.id}" ${selectedIds.has(item.id) ? "checked" : ""} />
          </label>
          <div class="ksm-token-history-icon">
            <i data-feather="zap"></i>
          </div>
          <div class="ksm-token-history-info">
            <div class="ksm-token-history-amount">${item.amount} Token <span class="ksm-token-price">(${formatRupiah(item.priceRupiah)})</span></div>
            <div class="ksm-token-history-date">Order ID: <strong>${item.orderId || item.publicId || '-'}</strong> • ${formatDate(item.createdAt)}</div>
            <div class="ksm-token-history-method">Metode: ${item.paymentType || 'QRIS / Midtrans'}</div>
          </div>
        </div>
        <div class="ksm-token-history-actions">
          ${statusBadge(item.status)}
          <button type="button" class="btn-view-detail" data-id="${item.id}">Rincian</button>
          ${item.status === 'pending' ? `
            <button type="button" class="btn-cancel-order" data-id="${item.id}">Batalkan</button>
            ${item.snapToken ? `<button type="button" class="btn-pay-order" data-token="${item.snapToken}">Bayar Sekarang</button>` : ''}
          ` : ''}
        </div>
      </div>`).join("");

    if (typeof feather !== "undefined") feather.replace();

    container.querySelectorAll(".ksm-history-item-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selectedIds.add(checkbox.value);
        else selectedIds.delete(checkbox.value);
        updateSelectionControls(filtered);
      });
    });

    container.querySelectorAll(".btn-view-detail").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = filtered.find((i) => i.id === btn.dataset.id);
        if (item) showDetailModal(item);
      });
    });

    container.querySelectorAll(".btn-cancel-order").forEach((btn) => {
      btn.addEventListener("click", () => cancelOrder(btn.dataset.id));
    });

    container.querySelectorAll(".btn-pay-order").forEach((btn) => {
      btn.addEventListener("click", () => payOrder(btn.dataset.token));
    });

    updateSelectionControls(filtered);
  }

  function initFilters() {
    document.querySelectorAll("#ksmTokenHistoryFilters .ksm-filter-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll("#ksmTokenHistoryFilters .ksm-filter-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        currentFilter = tab.dataset.filter;
        render();
      });
    });
  }

  function initSelection() {
    const selectAll = document.getElementById("ksmSelectAllHistory");
    const deleteButton = document.getElementById("ksmDeleteSelectedHistory");

    selectAll?.addEventListener("change", () => {
      visibleHistory().forEach((item) => {
        if (selectAll.checked) selectedIds.add(item.id);
        else selectedIds.delete(item.id);
      });
      render();
    });

    deleteButton?.addEventListener("click", async () => {
      if (!selectedIds.size) return;
      const count = selectedIds.size;
      let ok = false;
      if (window.showAlert) {
        ok = await window.showAlert.confirm(`Hapus ${count} riwayat token yang dipilih? Tindakan ini tidak dapat dibatalkan.`, "Hapus Riwayat?", "Ya, Hapus", "Batal");
      } else {
        if (typeof window.showToast === "function") window.showToast("Dialog konfirmasi tidak tersedia, refresh halaman.", "error");
        return;
      }
      if (!ok) return;

      deleteButton.disabled = true;
      try {
        const response = await authFetch(`${window.APP_CONFIG.apiBase}/token_history_delete.php`, {
          method: "POST",
          body: JSON.stringify({ ids: [...selectedIds] }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "Riwayat gagal dihapus.");

        selectedIds.clear();
        await KsmTokenWallet.refresh();
        if (typeof window.showToast === "function") window.showToast(`${data.deleted} riwayat berhasil dihapus.`, "success");
        else if (window.showAlert) window.showAlert.success(`${data.deleted} riwayat berhasil dihapus.`, "Berhasil");
      } catch (error) {
        const msg = error.message || "Riwayat gagal dihapus.";
        if (window.showAlert) window.showAlert.error(msg, "Gagal");
        else if (typeof window.showToast === "function") window.showToast(msg, "error");
        updateSelectionControls();
      } finally {
        deleteButton.disabled = false;
        updateSelectionControls();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initFilters();
    initSelection();
    render();
    window.addEventListener("ksm-token-wallet:updated", render);
  });
})();
