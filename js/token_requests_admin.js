// ===== VERIFIKASI TOKEN (ADMIN) =====
// Halaman : admin/token_requests.php
// Endpoint: services/admin/token_requests.php        (GET  — daftar + ringkasan)
//           services/admin/token_request_action.php  (POST — approve / reject)
//           services/admin/token_transactions.php    (GET  — ledger semua user)
//
// Alur pembelian token lewat Telegram sudah punya backend lengkap
// (token_purchase_link.php, telegram_webhook.php, add_token.php) tetapi tidak
// ada UI admin untuk verifikasi manual maupun melihat riwayat seluruh user.

(() => {
  const PER_PAGE = 15;

  const state = {
    view: "requests",
    status: "pending",
    type: "",
    page: 1,
    txnPage: 1,
    items: [],
    txns: [],
    active: null,
    busy: false,
  };

  const $ = (id) => document.getElementById(id);

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return escapeHtml(value);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRupiah = (value) =>
    value === null || value === undefined
      ? "-"
      : "Rp " + Number(value).toLocaleString("id-ID");

  const notify = (msg, type = "success", title = "") => {
    if (typeof showToast === "function") showToast(msg, type, title);
    else console.log(`[${type}] ${msg}`);
  };

  const apiFetch = (url, options) =>
    (window.authFetch || fetch)(url, { cache: "no-store", ...options });

  const refreshIcons = () => {
    if (typeof feather !== "undefined") feather.replace();
  };

  const STATUS_LABEL = {
    awaiting_proof: "Belum Ada Bukti",
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
    cancelled: "Dibatalkan",
    expired: "Kedaluwarsa",
  };

  const TYPE_LABEL = {
    purchase: "Pembelian",
    upload: "Upload",
    refund: "Refund",
    adjustment: "Penyesuaian",
  };

  async function syncStatus(requestId, orderId) {
    if (state.busy) return;
    state.busy = true;
    try {
      notify("Menghubungkan ke API Midtrans...", "info");
      const res = await apiFetch(`${window.APP_CONFIG.apiBase}/admin/token_sync_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: Number(requestId), order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Gagal sinkronisasi status.");
      notify(data.message, "success");
      await loadRequests();
      if (state.view === "transactions") await loadTransactions();
    } catch (err) {
      notify(err.message || "Gagal sinkronisasi status.", "error");
    } finally {
      state.busy = false;
    }
  }

  // ===== LOAD: PERMINTAAN TOP-UP =====
  async function loadRequests() {
    const tbody = $("tokenTableBody");
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="review-empty-cell">
          <div class="loader" style="margin:0 auto 12px;"></div>
          Memuat permintaan token...
        </td>
      </tr>`;

    try {
      let url = `${window.APP_CONFIG.apiBase}/admin/token_requests.php?limit=100&offset=0&t=${Date.now()}`;
      if (state.status) url += `&status=${encodeURIComponent(state.status)}`;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Gagal memuat permintaan token.");
      }

      state.items = Array.isArray(data.results) ? data.results : [];
      state.page = 1;
      renderSummary(data);
      renderRequests();
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="review-empty-cell review-error">
            ${escapeHtml(err.message || "Gagal memuat permintaan token.")}
          </td>
        </tr>`;
      $("tokenPagination").innerHTML = "";
      $("tokenTotal").textContent = "";
    }
  }

  function renderSummary(data) {
    const summary = data.summary || {};
    const set = (id, value) => {
      const el = $(id);
      if (el) el.textContent = value;
    };

    set("statPending", Number(summary.pending || 0).toLocaleString("id-ID"));
    set(
      "statApprovedTokens",
      Number(data.approvedTokens || 0).toLocaleString("id-ID")
    );
    set("statApprovedRupiah", formatRupiah(data.approvedRupiah || 0));

    const badges = {
      countPending: summary.pending,
      countAwaiting: summary.awaiting_proof,
      countApproved: summary.approved,
      countRejected: summary.rejected,
    };
    Object.entries(badges).forEach(([id, count]) => {
      const el = $(id);
      if (el) el.textContent = Number(count || 0) > 0 ? Number(count) : "";
    });
  }

  function renderRequests() {
    const tbody = $("tokenTableBody");
    const totalPages = Math.max(1, Math.ceil(state.items.length / PER_PAGE));
    if (state.page > totalPages) state.page = totalPages;

    const start = (state.page - 1) * PER_PAGE;
    const rows = state.items.slice(start, start + PER_PAGE);

    $("tokenTotal").textContent = state.items.length
      ? `${state.items.length} permintaan`
      : "";

    if (!rows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="review-empty-cell">
            Tidak ada permintaan pada filter ini.
          </td>
        </tr>`;
      $("tokenPagination").innerHTML = "";
      return;
    }

    tbody.innerHTML = rows
      .map((item) => {
        const canDecide =
          item.status === "pending" || item.status === "awaiting_proof";
        return `
        <tr>
          <td>
            <div class="review-title" style="font-weight:600;">${escapeHtml(item.userName || "User #" + item.userId)}</div>
            <div class="review-sub">ID User: #${item.userId} &middot; ${escapeHtml(item.userEmail || "-")}</div>
            <div class="review-sub" style="font-size:11px; color:#0284c7;">Order ID: <strong>${escapeHtml(item.midtransOrderId || item.publicId)}</strong></div>
          </td>
          <td>
            <div style="font-size:12px; font-family:monospace; font-weight:600; color:#334155;">${escapeHtml(item.midtransTransactionId || '-')}</div>
            <div class="review-sub">Metode: ${escapeHtml(item.paymentType || 'QRIS/Midtrans')}</div>
          </td>
          <td>
            <strong>${Number(item.amount).toLocaleString("id-ID")} Token</strong>
            <div class="review-sub">Gross: ${formatRupiah(item.priceRupiah)}</div>
          </td>
          <td>
            <div style="font-size:12px; color:#64748b;">MDR: ${formatRupiah(item.mdrFee)}</div>
            <div style="font-size:12px; font-weight:600; color:#059669;">Net: ${formatRupiah(item.netAmount)}</div>
          </td>
          <td>
            <span class="review-status status-${escapeHtml(item.status)}">
              ${escapeHtml(STATUS_LABEL[item.status] || item.status)}
            </span>
          </td>
          <td>
            <div style="font-size:11px;">Dibuat: ${formatDate(item.createdAt)}</div>
            ${item.approvedAt || item.settledAt ? `<div style="font-size:11px; color:#059669;">Lunas: ${formatDate(item.settledAt || item.approvedAt)}</div>` : ''}
          </td>
          <td class="col-actions">
            <button type="button" class="btn-icon btn-icon-sync" data-sync="${item.id}" data-order="${escapeHtml(item.midtransOrderId || '')}" title="Sinkronkan Status ke Midtrans Gateway">
              <i data-feather="refresh-cw"></i>
            </button>
            <button type="button" class="btn-icon" data-detail="${item.id}" title="Lihat detail">
              <i data-feather="eye"></i>
            </button>
            ${
              canDecide
                ? `<button type="button" class="btn-icon btn-icon-approve" data-approve="${item.id}" title="Setujui Manual">
                     <i data-feather="check"></i>
                   </button>
                   <button type="button" class="btn-icon btn-icon-reject" data-reject="${item.id}" title="Tolak">
                     <i data-feather="x"></i>
                   </button>`
                : ""
            }
          </td>
        </tr>`;
      })
      .join("");

    renderPagination("tokenPagination", state.page, totalPages, (page) => {
      state.page = page;
      renderRequests();
    });
    refreshIcons();
  }

  // ===== LOAD: LEDGER =====
  async function loadTransactions() {
    const tbody = $("txnTableBody");
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="review-empty-cell">
          <div class="loader" style="margin:0 auto 12px;"></div>
          Memuat riwayat transaksi...
        </td>
      </tr>`;

    try {
      let url = `${window.APP_CONFIG.apiBase}/admin/token_transactions.php?limit=100&offset=0&t=${Date.now()}`;
      if (state.type) url += `&type=${encodeURIComponent(state.type)}`;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Gagal memuat riwayat transaksi.");
      }

      state.txns = Array.isArray(data.results) ? data.results : [];
      state.txnPage = 1;

      const circulating = $("statCirculating");
      if (circulating) {
        circulating.textContent = Number(
          data.summary?.circulating || 0
        ).toLocaleString("id-ID");
      }
      renderTransactions();
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="review-empty-cell review-error">
            ${escapeHtml(err.message || "Gagal memuat riwayat transaksi.")}
          </td>
        </tr>`;
      $("txnPagination").innerHTML = "";
      $("txnTotal").textContent = "";
    }
  }

  function renderTransactions() {
    const tbody = $("txnTableBody");
    const totalPages = Math.max(1, Math.ceil(state.txns.length / PER_PAGE));
    if (state.txnPage > totalPages) state.txnPage = totalPages;

    const start = (state.txnPage - 1) * PER_PAGE;
    const rows = state.txns.slice(start, start + PER_PAGE);

    $("txnTotal").textContent = state.txns.length
      ? `${state.txns.length} transaksi`
      : "";

    if (!rows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="review-empty-cell">Belum ada transaksi token.</td>
        </tr>`;
      $("txnPagination").innerHTML = "";
      return;
    }

    tbody.innerHTML = rows
      .map((txn) => {
        const positive = Number(txn.amount) > 0;
        return `
        <tr>
          <td>
            <div class="review-title">${escapeHtml(
              txn.userName || "Pengguna #" + txn.userId
            )}</div>
            <div class="review-sub">${escapeHtml(txn.userEmail || "-")}</div>
          </td>
          <td>
            <span class="review-status status-${escapeHtml(txn.type)}">
              ${escapeHtml(TYPE_LABEL[txn.type] || txn.type)}
            </span>
          </td>
          <td class="${positive ? "token-credit" : "token-debit"}">
            ${positive ? "+" : ""}${Number(txn.amount).toLocaleString("id-ID")}
          </td>
          <td>${Number(txn.balanceAfter).toLocaleString("id-ID")}</td>
          <td>
            ${escapeHtml(txn.description || "-")}
            ${
              txn.processedByName
                ? `<div class="review-sub">oleh ${escapeHtml(
                    txn.processedByName
                  )}</div>`
                : txn.processedByTelegramId
                ? `<div class="review-sub">oleh Telegram #${txn.processedByTelegramId}</div>`
                : ""
            }
          </td>
          <td>${formatDate(txn.createdAt)}</td>
        </tr>`;
      })
      .join("");

    renderPagination("txnPagination", state.txnPage, totalPages, (page) => {
      state.txnPage = page;
      renderTransactions();
    });
    refreshIcons();
  }

  // ===== PAGINATION =====
  function renderPagination(containerId, current, totalPages, onGo) {
    const box = $(containerId);
    if (!box) return;
    if (totalPages <= 1) {
      box.innerHTML = "";
      return;
    }

    let html = `<button type="button" class="page-btn" data-page="${
      current - 1
    }" ${current === 1 ? "disabled" : ""}>Sebelumnya</button>`;
    for (let i = 1; i <= totalPages; i += 1) {
      html += `<button type="button" class="page-btn ${
        i === current ? "active" : ""
      }" data-page="${i}">${i}</button>`;
    }
    html += `<button type="button" class="page-btn" data-page="${
      current + 1
    }" ${current === totalPages ? "disabled" : ""}>Berikutnya</button>`;
    box.innerHTML = html;

    box.querySelectorAll(".page-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.page);
        if (page >= 1 && page <= totalPages && page !== current) onGo(page);
      });
    });
  }

  // ===== MODAL =====
  function openModal(id) {
    const item = state.items.find((row) => row.id === Number(id));
    if (!item) return;
    state.active = item;

    const canDecide =
      item.status === "pending" || item.status === "awaiting_proof";

    $("tokenDetail").innerHTML = `
      <div><dt>Kode</dt><dd>${escapeHtml(item.publicId)}</dd></div>
      <div><dt>Pengguna</dt><dd>${escapeHtml(
        item.userName || "-"
      )} (${escapeHtml(item.userEmail || "-")})</dd></div>
      <div><dt>Jumlah token</dt><dd>${Number(item.amount).toLocaleString(
        "id-ID"
      )}</dd></div>
      <div><dt>Nilai</dt><dd>${formatRupiah(item.priceRupiah)}</dd></div>
      <div><dt>Saldo pengguna</dt><dd>${Number(
        item.userBalance || 0
      ).toLocaleString("id-ID")} token</dd></div>
      <div><dt>Status</dt><dd>${escapeHtml(
        STATUS_LABEL[item.status] || item.status
      )}</dd></div>
      <div><dt>Bukti transfer</dt><dd>${
        item.hasProof
          ? "Terkirim via Telegram" +
            (item.proofType ? ` (${escapeHtml(item.proofType)})` : "")
          : "Belum ada"
      }</dd></div>
      <div><dt>Telegram</dt><dd>${
        item.telegramUserId ? "#" + item.telegramUserId : "Tidak terhubung"
      }</dd></div>
      <div><dt>Dibuat</dt><dd>${formatDate(item.createdAt)}</dd></div>
      <div><dt>Diproses</dt><dd>${
        item.approvedAt
          ? formatDate(item.approvedAt)
          : item.rejectedAt
          ? formatDate(item.rejectedAt)
          : "-"
      }</dd></div>
      ${
        item.rejectionReason
          ? `<div><dt>Alasan tolak</dt><dd>${escapeHtml(
              item.rejectionReason
            )}</dd></div>`
          : ""
      }`;

    $("tokenReason").value = "";
    $("tokenReasonCount").textContent = "0";
    $("tokenReasonGroup").hidden = !canDecide;
    $("tokenApproveBtn").hidden = !canDecide;
    $("tokenRejectBtn").hidden = !canDecide;
    $("tokenModal").hidden = false;
    document.body.style.overflow = "hidden";
    refreshIcons();
  }

  function closeModal() {
    $("tokenModal").hidden = true;
    state.active = null;
    document.body.style.overflow = "";
  }

  // ===== AKSI =====
  async function decide(id, action, reason = "") {
    if (state.busy) return;
    state.busy = true;

    const approveBtn = $("tokenApproveBtn");
    const rejectBtn = $("tokenRejectBtn");
    if (approveBtn) approveBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;

    try {
      const res = await apiFetch(
        `${window.APP_CONFIG.apiBase}/admin/token_request_action.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: Number(id), action, reason }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Gagal memproses permintaan.");
      }

      notify(
        data.alreadyProcessed
          ? "Permintaan ini sudah diproses sebelumnya."
          : data.message,
        data.alreadyProcessed ? "info" : "success"
      );
      closeModal();
      await loadRequests();
      if (state.view === "transactions") await loadTransactions();
    } catch (err) {
      notify(err.message || "Gagal memproses permintaan.", "error");
    } finally {
      state.busy = false;
      if (approveBtn) approveBtn.disabled = false;
      if (rejectBtn) rejectBtn.disabled = false;
    }
  }

  // ===== INIT =====
  function switchView(view) {
    state.view = view;
    $("viewRequests").hidden = view !== "requests";
    $("viewTransactions").hidden = view !== "transactions";

    document.querySelectorAll(".token-view-btn").forEach((btn) => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (view === "transactions" && !state.txns.length) loadTransactions();
  }

  function init() {
    if (!$("tokenTableBody")) return;

    document.querySelectorAll(".token-view-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    // Tab status permintaan (hindari .txn-tab yang milik view ledger).
    document
      .querySelectorAll("#viewRequests .review-tab")
      .forEach((tab) => {
        tab.addEventListener("click", () => {
          document
            .querySelectorAll("#viewRequests .review-tab")
            .forEach((t) => {
              t.classList.remove("active");
              t.setAttribute("aria-selected", "false");
            });
          tab.classList.add("active");
          tab.setAttribute("aria-selected", "true");
          state.status = tab.dataset.status || "";
          loadRequests();
        });
      });

    document.querySelectorAll(".txn-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".txn-tab").forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        state.type = tab.dataset.type || "";
        loadTransactions();
      });
    });

    $("tokenRefresh")?.addEventListener("click", loadRequests);
    $("txnRefresh")?.addEventListener("click", loadTransactions);

    $("tokenTableBody").addEventListener("click", (event) => {
      const sync = event.target.closest("[data-sync]");
      if (sync) return syncStatus(sync.dataset.sync, sync.dataset.order);

      const detail = event.target.closest("[data-detail]");
      if (detail) return openModal(detail.dataset.detail);

      const approve = event.target.closest("[data-approve]");
      if (approve) return decide(approve.dataset.approve, "approve");

      const reject = event.target.closest("[data-reject]");
      if (reject) return openModal(reject.dataset.reject);
    });

    $("tokenApproveBtn")?.addEventListener("click", () => {
      if (state.active) decide(state.active.id, "approve");
    });

    $("tokenRejectBtn")?.addEventListener("click", () => {
      if (state.active) {
        decide(state.active.id, "reject", $("tokenReason").value.trim());
      }
    });

    $("tokenReason")?.addEventListener("input", (event) => {
      $("tokenReasonCount").textContent = String(event.target.value.length);
    });

    document.querySelectorAll("[data-close-token-modal]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("tokenModal").hidden) closeModal();
    });

    loadRequests();
    loadTransactions(); // sekaligus mengisi kartu "Saldo Beredar"
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
